/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import styled from "styled-components";
import { Pile } from "./pile.js";
import { toast } from "sonner";

const CardRow = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 2em;
`;

const CardRowGap = styled.div`
  flex-grow: 2;
`;

const GameBase = styled.div`
  grid-row: 2;
  grid-column: sb / main;
`;

const AutoCompleteButton = styled.button`
  padding: 10px 20px;
  margin: 10px;
  font-size: 1em;
  background: ${(props) =>
    props.disabled ? "#cccccc" : props.$active ? "#ff6b6b" : "#6495ed"};
  color: white;
  border: none;
  border-radius: 5px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};

  &:hover {
    background: ${(props) =>
      props.disabled ? "#cccccc" : props.$active ? "#ff5252" : "#4169e1"};
  }
`;

export const Game = ({ readOnly = false }) => {
  const { id, moveId } = useParams();
  let [state, setState] = useState({
    pile1: [],
    pile2: [],
    pile3: [],
    pile4: [],
    pile5: [],
    pile6: [],
    pile7: [],
    stack1: [],
    stack2: [],
    stack3: [],
    stack4: [],
    draw: [],
    discard: [],
  });
  let [selection, setSelection] = useState({
    pile: null,
    cardIndex: null,
    cards: [],
  });
  let [autoCompleting, setAutoCompleting] = useState(false);
  let [hasValidMoves, setHasValidMoves] = useState(true);
  // let [target, setTarget] = useState(undefined);
  // let [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const getGameState = async () => {
      const endpoint = moveId
        ? `/v1/game/${id}/move/${moveId}`
        : `/v1/game/${id}`;
      const response = await fetch(endpoint);
      const data = await response.json();
      setState({
        pile1: data.pile1,
        pile2: data.pile2,
        pile3: data.pile3,
        pile4: data.pile4,
        pile5: data.pile5,
        pile6: data.pile6,
        pile7: data.pile7,
        stack1: data.stack1,
        stack2: data.stack2,
        stack3: data.stack3,
        stack4: data.stack4,
        draw: data.draw,
        discard: data.discard,
      });

      if (!readOnly && !moveId) {
        const validMovesResponse = await fetch(`/v1/game/${id}/valid-move`);
        const validMoves = await validMovesResponse.json();
        setHasValidMoves(validMoves.length > 0);
      }
    };
    getGameState().then();
  }, [id, moveId, readOnly]);

  useEffect(() => {
    let intervalId;

    const autoComplete = async () => {
      try {
        const response = await fetch(`/v1/game/${id}/valid-move`);
        const validMoves = await response.json();

        if (validMoves.length === 0) {
          setHasValidMoves(false);
          setAutoCompleting(false);
          return;
        }

        setHasValidMoves(true);

        if (autoCompleting) {
          const move = validMoves[0];
          await makeMove(move);
        }
      } catch (error) {
        setAutoCompleting(false);
      }
    };

    if (autoCompleting && !readOnly && !moveId) {
      intervalId = setInterval(autoComplete, 500);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoCompleting, id, readOnly, moveId]);

  const toggleAutoComplete = () => {
    setAutoCompleting(!autoCompleting);
  };

  const handleSelection = (pile, suit, value) => {
    if (!suit || !value) return; // Clicked on empty pile

    const pileCards = state[pile];
    const cardIndex = pileCards.findIndex(
      (c) => c.suit === suit && c.value.toString() === value.toString()
    );

    if (cardIndex === -1) return;

    const isTableau = pile.startsWith("pile");
    const selectedCards = isTableau
      ? pileCards.slice(cardIndex)
      : [pileCards[cardIndex]];

    setSelection({
      pile,
      cardIndex,
      cards: selectedCards,
    });
  };

  const makeMove = async (moveRequest) => {
    try {
      const response = await fetch(`/v1/game/${id}`, {
        body: JSON.stringify(moveRequest),
        method: "PUT",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.error != null) {
          toast(`Invalid move: ${data.error}`);
          setSelection({ pile: null, cardIndex: null, cards: [] });
        } else {
          setState({
            pile1: data.pile1,
            pile2: data.pile2,
            pile3: data.pile3,
            pile4: data.pile4,
            pile5: data.pile5,
            pile6: data.pile6,
            pile7: data.pile7,
            stack1: data.stack1,
            stack2: data.stack2,
            stack3: data.stack3,
            stack4: data.stack4,
            draw: data.draw,
            discard: data.discard,
          });

          setSelection({ pile: null, cardIndex: null, cards: [] });
          const validMovesResponse = await fetch(`/v1/game/${id}/valid-move`);
          const validMoves = await validMovesResponse.json();
          setHasValidMoves(validMoves.length > 0);
        }
      } else {
        setSelection({ pile: null, cardIndex: null, cards: [] });
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  const handleMove = async (destinationPile) => {
    const moveRequest = {
      cards: selection.cards.map((c) => ({ suit: c.suit, value: c.value })),
      src: selection.pile,
      dst: destinationPile,
    };

    await makeMove(moveRequest);
  };

  const handleTalonClick = async () => {
    const moveRequest = {
      cards: [],
      src: "draw",
      dst: "discard",
    };

    await makeMove(moveRequest);
  };

  const onClick = (ev) => {
    let target = ev.target;

    // Name is stored on parent for empty piles
    let pile = target.dataset.pile;
    if (!pile && target.parentElement) {
      target = target.parentElement;
      pile = target.dataset.pile;
    }

    const suit = target.dataset.suit;
    const value = target.dataset.value;
    const isUp = target.dataset.up === "true";

    if (!pile) {
      return;
    }

    if (pile === "draw") {
      handleTalonClick();
      return;
    }

    const isEmptyPile = !suit && !value;

    if (!isEmptyPile && !isUp && pile !== "draw") {
      return;
    }

    if (!selection.pile && !isEmptyPile) {
      handleSelection(pile, suit, value);
    } else if (selection.pile === pile && suit && value) {
      setSelection({ pile: null, cardIndex: null, cards: [] });
    } else if (selection.pile) {
      handleMove(pile);
    }
  };

  const pileOnClick = readOnly ? () => {} : onClick;

  return (
    <GameBase>
      {!readOnly && !moveId && (
        <div style={{ textAlign: "center" }}>
          <AutoCompleteButton
            onClick={toggleAutoComplete}
            disabled={!hasValidMoves}
            $active={autoCompleting}
          >
            {autoCompleting ? "Stop Auto-Complete" : "Auto-Complete"}
          </AutoCompleteButton>
        </div>
      )}
      <CardRow>
        <Pile
          pileType="stack1"
          cards={state.stack1}
          spacing={0}
          onClick={pileOnClick}
          selection={selection}
        />
        <Pile
          pileType="stack2"
          cards={state.stack2}
          spacing={0}
          onClick={pileOnClick}
          selection={selection}
        />
        <Pile
          pileType="stack3"
          cards={state.stack3}
          spacing={0}
          onClick={pileOnClick}
          selection={selection}
        />
        <Pile
          pileType="stack4"
          cards={state.stack4}
          spacing={0}
          onClick={pileOnClick}
          selection={selection}
        />
        <CardRowGap />
        <Pile
          pileType="draw"
          cards={state.draw}
          spacing={0}
          onClick={pileOnClick}
          selection={selection}
        />
        <Pile
          pileType="discard"
          cards={state.discard}
          spacing={0}
          onClick={pileOnClick}
          selection={selection}
        />
      </CardRow>
      <CardRow>
        <Pile
          pileType="pile1"
          cards={state.pile1}
          onClick={pileOnClick}
          selection={selection}
        />
        <Pile
          pileType="pile2"
          cards={state.pile2}
          onClick={pileOnClick}
          selection={selection}
        />
        <Pile
          pileType="pile3"
          cards={state.pile3}
          onClick={pileOnClick}
          selection={selection}
        />
        <Pile
          pileType="pile4"
          cards={state.pile4}
          onClick={pileOnClick}
          selection={selection}
        />
        <Pile
          pileType="pile5"
          cards={state.pile5}
          onClick={pileOnClick}
          selection={selection}
        />
        <Pile
          pileType="pile6"
          cards={state.pile6}
          onClick={pileOnClick}
          selection={selection}
        />
        <Pile
          pileType="pile7"
          cards={state.pile7}
          onClick={pileOnClick}
          selection={selection}
        />
      </CardRow>
    </GameBase>
  );
};
