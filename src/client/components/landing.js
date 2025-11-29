/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

import React from "react";
import styled from "styled-components";

const LandingBase = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  grid-area: main;
`;

export const Landing = () => (
  <LandingBase>
    <h1>This is my landing page!</h1>
    <h2>Supported functionalities:</h2>
    <ul>
      <li>Modify profile</li>
      <li>Results page with clickable moves</li>
      <li>Register/login with Github</li>
      <li>Autocomplete button</li>
    </ul>
  </LandingBase>
);
