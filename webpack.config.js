/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase, webpack docs */
"use strict";

import path from "node:path";
import url from "url";
import webpack from "webpack";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const PROD_GH_CLIENT_ID = "Ov23liWawHIrVg5l3YoB";
const DEV_GH_CLIENT_ID = "Ov23libak0KLsGGQS7kn";

const isProduction = process.env.NODE_ENV === "production";

export default {
  context: path.join(__dirname, "/src/client"),
  entry: "./main.js",
  mode: isProduction ? "production" : "development",
  devtool: isProduction ? "source-map" : "eval-source-map",
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "public/js"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.CLIENT_ID": JSON.stringify(
        isProduction ? PROD_GH_CLIENT_ID : DEV_GH_CLIENT_ID
      ),
    }),
  ],
};
