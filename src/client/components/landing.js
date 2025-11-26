/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

import React from "react";
import styled from "styled-components";

const LandingBase = styled.div`
  display: flex;
  justify-content: center;
  grid-area: main;
`;

export const Landing = () => (
  <LandingBase>
    <h1>This is my landing page!</h1>
  </LandingBase>
);
