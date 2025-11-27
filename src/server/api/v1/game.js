/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

import Joi from "joi";
import {
  initialState,
  shuffleCards,
  filterGameForProfile,
  filterMoveForResults,
  validateMove,
  isComplete,
} from "../../solitare.js";

export default (app) => {
  /**
   * Create a new game
   *
   * @param {req.body.game} Type of game to be played
   * @param {req.body.color} Color of cards
   * @param {req.body.draw} Number of cards to draw
   * @return {201 with { id: ID of new game }}
   */
  app.post("/v1/game", async (req, res) => {
    if (!req.session.user)
      return res.status(401).send({ error: "unauthorized" });

    // Schema for user info validation
    const schema = Joi.object({
      game: Joi.string().lowercase().required(),
      color: Joi.string().lowercase().required(),
      draw: Joi.any(),
    });
    // Validate user input
    try {
      const data = await schema.validateAsync(req.body, { stripUnknown: true });
      // Set up the new game
      let newGame = {
        owner: req.session.user._id,
        active: true,
        cards_remaining: 52,
        color: data.color,
        game: data.game,
        score: 0,
        start: Date.now(),
        winner: "",
        state: [],
      };
      switch (data.draw) {
        case "Draw 1":
          newGame.drawCount = 1;
          break;
        case "Draw 3":
          newGame.drawCount = 3;
          break;
        default:
          newGame.drawCount = 1;
      }
      console.log(newGame);
      // Generate a new initial game state
      const startState = initialState();
      newGame.state = startState;
      newGame.initialState = startState;
      let game = new app.models.Game(newGame);
      try {
        await game.save();
        const query = { $push: { games: game._id } };
        // Save game to user's document too
        await app.models.User.findByIdAndUpdate(req.session.user._id, query);
        res.status(201).send({ id: game._id });
      } catch (err) {
        console.log(`Game.create save failure: ${err}`);
        res.status(400).send({ error: "failure creating game" });
        // TODO: Much more error management needs to happen here
      }
    } catch (err) {
      console.log(err);
      const message = err.details[0].message;
      console.log(`Game.create validation failure: ${message}`);
      res.status(400).send({ error: message });
    }
  });

  /**
   * Fetch game information
   *
   * @param {req.params.id} Id of game to fetch
   * @return {200} Game information
   */
  app.get("/v1/game/:id", async (req, res) => {
    try {
      let game = await app.models.Game.findById(req.params.id);
      if (!game) {
        res.status(404).send({ error: `unknown game: ${req.params.id}` });
      } else {
        const state = game.state.toJSON();
        let results = filterGameForProfile(game);
        results.start = Date.parse(results.start);
        results.cards_remaining =
          52 -
          (state.stack1.length +
            state.stack2.length +
            state.stack3.length +
            state.stack4.length);
        // Do we need to grab the moves
        // if (req.query.moves === "") {
          const moves = await app.models.Move.find({ game: req.params.id }).populate('user', 'username');
          state.moves = moves.map((move) => filterMoveForResults(move));
        // }
        res.status(200).send(Object.assign({}, results, state));
      }
    } catch (err) {
      console.log(`Game.get failure: ${err}`);
      res.status(404).send({ error: `unknown game: ${req.params.id}` });
    }
  });

  /**
   * Fetch game state at a specific move
   *
   * @param {req.params.id} Id of game
   * @param {req.params.moveId} Id of move to reconstruct state up to
   * @return {200} Game state after the specified move
   */
  app.get("/v1/game/:id/move/:moveId", async (req, res) => {
    try {
      let game = await app.models.Game.findById(req.params.id);
      if (!game) {
        return res.status(404).send({ error: `unknown game: ${req.params.id}` });
      }

      const allMoves = await app.models.Move.find({ game: req.params.id })
                                            .sort({ date: 1 })
                                            .populate('user', 'username');

      const targetMoveIndex = allMoves.findIndex(
        move => move._id.toString() === req.params.moveId
      );

      if (targetMoveIndex === -1) {
        return res.status(404).send({ error: `unknown move: ${req.params.moveId}` });
      }

      let state = game.initialState.toJSON();

      const movesToReplay = allMoves.slice(0, targetMoveIndex + 1);
      for (const move of movesToReplay) {
        const moveRequest = {
          cards: move.cards,
          src: move.src,
          dst: move.dst,
        };
        const result = validateMove(state, moveRequest, game.drawCount);
        if (result.valid) {
          state = result.newState;
        } else {
          console.error(`Error replaying move ${move._id}: ${result.error}`);
        }
      }

      let results = filterGameForProfile(game);

      res.status(200).send(Object.assign({}, results, state));
    } catch (err) {
      console.log(`Get old move failure: ${err}`);
      res.status(500).send({ error: `server error` });
    }
  });

  /**
   * Make a move in a game
   *
   * @param {req.params.gameID} Id of game to update
   * @param {req.body.cards} Array of cards being moved
   * @param {req.body.src} Source location (e.g., "pile1", "draw")
   * @param {req.body.dst} Destination location (e.g., "stack2", "pile3")
   * @return {200} Updated game state
   */
  app.put("/v1/game/:gameID", async (req, res) => {
    if (!req.session.user)
      return res.status(401).send({ error: "unauthorized" });

    const schema = Joi.object({
      src: Joi.string()
        .valid(
          "pile1",
          "pile2",
          "pile3",
          "pile4",
          "pile5",
          "pile6",
          "pile7",
          "stack1",
          "stack2",
          "stack3",
          "stack4",
          "draw",
          "discard"
        )
        .required(),
      dst: Joi.string()
        .valid(
          "pile1",
          "pile2",
          "pile3",
          "pile4",
          "pile5",
          "pile6",
          "pile7",
          "stack1",
          "stack2",
          "stack3",
          "stack4",
          "draw",
          "discard"
        )
        .required(),
      cards: Joi.array()
        .items(
          Joi.object({
            suit: Joi.string()
              .valid("hearts", "spades", "diamonds", "clubs")
              .required(),
            value: Joi.alternatives()
              .try(
                Joi.string().valid("ace", "jack", "queen", "king"),
                Joi.number().integer().min(2).max(10),
              )
              .required(),
          })
        )
        .required(),
    })

    try {
      const data = await schema.validateAsync(req.body);

      try {
        let game = await app.models.Game.findById(req.params.gameID);
        if (!game) {
          return res
            .status(404)
            .send({ error: `unknown game: ${req.params.gameID}` });
        }

        if (req.session.user && game.owner.toString() !== req.session.user._id.toString()) {
          return res.status(403).send({ error: "not game owner" });
        }

        const validationResult = validateMove(game.state, data, game.drawCount);
        if (!validationResult.valid) {
          return res.status(400).send({ error: validationResult.error });
        }

        game.state = validationResult.newState;
        game.moves += 1;

        const state = validationResult.newState;
        game.cards_remaining =
          52 -
          (state.stack1.length +
            state.stack2.length +
            state.stack3.length +
            state.stack4.length);

        const move = new app.models.Move({
          user: req.session.user._id,
          game: game._id,
          cards: validationResult.movedCards ? validationResult.movedCards : data.cards,
          src: data.src,
          dst: data.dst,
          date: Date.now(),
        });

        const {complete, victory} = isComplete(state);
        if (complete) {
          game.active = false;
        }
        if (victory) {
          game.won = false;
        }

        await game.save();
        await move.save();

        res.status(200).send(state);
      } catch (err) {
        console.log(`Game.move failure: ${err}`);
        res.status(500).send({ error: "Internal server error" });
      }
    } catch (err) {
      const message = err.details[0].message;
      console.log(`Game.move validation failure: ${message}`);
      res.status(400).send({ error: message });
    }
  });

  // Provide end-point to request shuffled deck of cards and initial state - for testing
  app.get("/v1/cards/shuffle", (req, res) => {
    res.send(shuffleCards(false));
  });
  app.get("/v1/cards/initial", (req, res) => {
    res.send(initialState());
  });
};
