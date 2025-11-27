/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

import React from "react";
import styled from "styled-components";

const CardImg = styled.img`
  position: absolute;
  height: auto;
  width: 100%;
`;

export const Card = ({ card, top, left, onClick, pile, isSelected }) => {
  const source = card.up
    ? `/images/${card.value}_of_${card.suit}.png`
    : "/images/face_down.jpg";
  const style = {
    left: `${left}%`,
    top: `${top}%`,
    border: isSelected ? "3px solid yellow" : "none",
    boxShadow: isSelected ? "0 0 10px yellow" : "none",
  };
  const id = `${card.suit}:${card.value}`;

  const handleClick = (e) => {
    e.stopPropagation();
    onClick(e);
  };

  return (
    <CardImg
      id={id}
      data-pile={pile}
      data-suit={card.suit}
      data-value={card.value}
      data-up={card.up}
      onClick={handleClick}
      style={style}
      src={source}
    />
  );
};

const PileBase = styled.div`
  margin: 5px;
  position: relative;
  display: inline-block;
  border: dashed 2px #808080;
  border-radius: 5px;
  width: 12%;
`;

const PileFrame = styled.div`
  margin-top: 140%;
`;

export const Pile = ({
  pileType,
  cards = [],
  spacing = 12,
  horizontal = false,
  up,
  onClick,
  selection,
}) => {
  const children = cards.map((card, i) => {
    const top = horizontal ? 0 : i * spacing;
    const left = horizontal ? i * spacing : 0;
    const isSelected =
      selection &&
      selection.pile === pileType &&
      selection.cardIndex !== null &&
      i >= selection.cardIndex;
    return (
      <Card
        key={i}
        card={card}
        pile={pileType}
        up={up}
        top={top}
        left={left}
        onClick={onClick}
        isSelected={isSelected}
      />
    );
  });
  return (
    <PileBase data-pile={pileType} onClick={onClick}>
      <PileFrame />
      {children}
    </PileBase>
  );
};
