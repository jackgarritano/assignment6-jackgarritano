/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

export const shuffleCards = (includeJokers = false) => {
  /* Return an array of 52 cards (if jokers is false, 54 otherwise). Carefully follow the instructions in the README */
  let cards = [];
  ["spades", "clubs", "hearts", "diamonds"].forEach((suit) => {
    ["ace", 2, 3, 4, 5, 6, 7, 8, 9, 10, "jack", "queen", "king"].forEach(
      (value) => {
        cards.push({ suit: suit, value: value });
      }
    );
  });
  // Add in jokers here
  if (includeJokers) {
    /*...*/
  }
  // Now shuffle
  let deck = [];
  while (cards.length > 0) {
    // Find a random number between 0 and cards.length - 1
    const index = Math.floor(Math.random() * cards.length);
    deck.push(cards[index]);
    cards.splice(index, 1);
  }
  return deck;
};

export const initialState = () => {
  /* Use the above function.  Generate and return an initial state for a game */
  let state = {
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
  };

  // Get the shuffled deck and distribute it to the players
  const deck = shuffleCards(false);
  // Setup the piles
  for (let i = 1; i <= 7; ++i) {
    let card = deck.splice(0, 1)[0];
    card.up = true;
    state[`pile${i}`].push(card);
    for (let j = i + 1; j <= 7; ++j) {
      card = deck.splice(0, 1)[0];
      card.up = false;
      state[`pile${j}`].push(card);
    }
  }
  // Finally, get the draw right
  state.draw = deck.map((card) => {
    card.up = false;
    return card;
  });
  return state;
};

export const filterGameForProfile = (game) => ({
  active: game.active,
  score: game.score,
  won: game.won,
  id: game._id,
  game: "klondyke",
  start: game.start,
  state: game.state,
  moves: game.moves,
  winner: game.winner,
});

export const filterMoveForResults = (move) => ({
  ...move,
});

export const validateMove = (currentState, move, drawCount = 1) => {
  if (!currentState || !move) {
    return { valid: false, error: "Invalid move data" };
  }

  const { src, dst, cards } = move;
  if (!src || !dst || !cards) {
    return { valid: false, error: "Invalid move data" };
  }

  const newState = structuredClone(currentState.toJSON());

  const getCardValue = (card) => {
    const val = card.value.toString().toLowerCase();
    if (val === "ace") return 1;
    if (val === "jack") return 11;
    if (val === "queen") return 12;
    if (val === "king") return 13;
    return parseInt(val);
  };

  const getCardColor = (card) => {
    return card.suit === "hearts" || card.suit === "diamonds" ? "red" : "black";
  };

  const cardsMatch = (card1, card2) => {
    return (
      card1.suit === card2.suit &&
      card1.value.toString() === card2.value.toString()
    );
  };

  const isPile = (location) => location.startsWith("pile");
  const isStack = (location) => location.startsWith("stack");
  const isDraw = (location) => location === "draw";
  const isDiscard = (location) => location === "discard";

  // pile/stack/discard -> pile
  if (isPile(dst)) {
    const srcPile = isDiscard(src) ? newState.discard : newState[src];
    const dstPile = newState[dst];

    if (!srcPile || srcPile.length === 0) {
      return { valid: false, error: "Source pile is empty" };
    }

    const isFromTableau = isPile(src);
    const allowMultipleCards = isFromTableau;

    if (!allowMultipleCards && cards.length !== 1) {
      return {
        valid: false,
        error: isStack(src)
          ? "Can only move one card from foundation"
          : "Can only move one card from waste pile",
      };
    }

    if (isFromTableau && cards.length > 1) {
      let startIndex = -1;
      for (let i = srcPile.length - cards.length; i < srcPile.length; i++) {
        if (
          i >= 0 &&
          cardsMatch(srcPile[i], cards[i - (srcPile.length - cards.length)])
        ) {
          if (startIndex === -1) startIndex = i;
        } else {
          startIndex = -1;
          break;
        }
      }

      if (startIndex === -1) {
        return { valid: false, error: "Cards not found in source pile" };
      }

      for (let i = startIndex; i < srcPile.length; i++) {
        if (!srcPile[i].up) {
          return { valid: false, error: "Cannot move face-down cards" };
        }
      }

      for (let i = 1; i < cards.length; i++) {
        const prevCard = cards[i - 1];
        const currCard = cards[i];
        if (getCardValue(prevCard) !== getCardValue(currCard) + 1) {
          return { valid: false, error: "Cards are not in valid sequence" };
        }
        if (getCardColor(prevCard) === getCardColor(currCard)) {
          return {
            valid: false,
            error: "Cards must alternate colors in tableau",
          };
        }
      }
    } else {
      const topCard = srcPile[srcPile.length - 1];
      const movingCard = cards[0];

      if (!cardsMatch(topCard, movingCard)) {
        return {
          valid: false,
          error: isStack(src)
            ? "Card not found at top of foundation"
            : "Card not found at top of source pile",
        };
      }

      if (isPile(src) && !topCard.up) {
        return { valid: false, error: "Cannot move face-down cards" };
      }
    }

    if (dstPile.length === 0) {
      if (getCardValue(cards[0]) !== 13) {
        return {
          valid: false,
          error: "Only Kings can be placed on empty tableau piles",
        };
      }
    } else {
      const topDstCard = dstPile[dstPile.length - 1];
      const bottomMovingCard = cards[0];
      if (getCardValue(topDstCard) !== getCardValue(bottomMovingCard) + 1) {
        return { valid: false, error: "Card rank does not follow sequence" };
      }
      if (getCardColor(topDstCard) === getCardColor(bottomMovingCard)) {
        return {
          valid: false,
          error: "Cards must alternate colors in tableau",
        };
      }
    }

    if (isFromTableau && cards.length > 1) {
      const startIndex = srcPile.length - cards.length;
      const movedCards = srcPile.splice(startIndex, cards.length);
      dstPile.push(...movedCards);
    } else {
      const movedCard = srcPile.pop();
      dstPile.push(movedCard);
    }

    if ((isPile(src) || isStack(src)) && srcPile.length > 0) {
      srcPile[srcPile.length - 1].up = true;
    }

    return { valid: true, newState };
  }

  // pile/discard -> stack
  if (isStack(dst)) {
    if (isStack(src) || isDraw(src)) {
      return { valid: false, error: "Invalid move type" };
    }

    const srcPile = isDiscard(src) ? newState.discard : newState[src];
    const dstStack = newState[dst];

    if (!srcPile || srcPile.length === 0) {
      return { valid: false, error: "Source pile is empty" };
    }

    if (cards.length !== 1) {
      return { valid: false, error: "Can only move one card to foundation" };
    }

    const topCard = srcPile[srcPile.length - 1];
    const movingCard = cards[0];

    if (!cardsMatch(topCard, movingCard)) {
      return {
        valid: false,
        error: isDiscard(src)
          ? "Card not found at top of waste pile"
          : "Card not found at top of source pile",
      };
    }

    if (isPile(src) && !topCard.up) {
      return { valid: false, error: "Cannot move face-down cards" };
    }

    if (dstStack.length === 0) {
      if (getCardValue(movingCard) !== 1) {
        return {
          valid: false,
          error: "Only Aces can start a foundation stack",
        };
      }
    } else {
      const topStackCard = dstStack[dstStack.length - 1];
      if (topStackCard.suit !== movingCard.suit) {
        return { valid: false, error: "Card must be same suit as foundation" };
      }
      if (getCardValue(movingCard) !== getCardValue(topStackCard) + 1) {
        return { valid: false, error: "Card rank does not follow sequence" };
      }
    }

    const movedCard = srcPile.pop();
    dstStack.push(movedCard);

    if (isPile(src) && srcPile.length > 0) {
      srcPile[srcPile.length - 1].up = true;
    }

    return { valid: true, newState };
  }

  // draw -> discard
  if (isDraw(src) && isDiscard(dst)) {
    const drawPile = newState.draw;
    const discardPile = newState.discard;

    if (drawPile.length === 0) {
      if (discardPile.length === 0) {
        return { valid: false, error: "Both draw and discard piles are empty" };
      }
      while (discardPile.length > 0) {
        const card = discardPile.pop();
        card.up = false;
        drawPile.push(card);
      }
      return { valid: true, newState };
    }

    const numToMove = Math.min(drawCount, drawPile.length);
    for (let i = 0; i < numToMove; i++) {
      const card = drawPile.pop();
      card.up = true;
      discardPile.push(card);
    }

    return { valid: true, newState };
  }

  return { valid: false, error: "Invalid move type" };
};
