/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

import mongoose from "mongoose";
const Schema = mongoose.Schema;
import CardState from "./card_state.js";

/***************** Move Model *******************/

/* Schema for an individual move of Klondike */
const Move = new Schema(
  {
    user: { type: Schema.ObjectId, ref: "User", required: true, index: true },
    game: { type: Schema.ObjectId, ref: "Game", required: true, index: true },
    cards: { type: [CardState] },
    src: { type: String },
    dst: { type: String },
    date: { type: Date },
  },
  // { _id: false },
);

Move.pre("validate", function (next) {
  this.start = Date.now();
  next();
});

export default mongoose.model("Move", Move);
