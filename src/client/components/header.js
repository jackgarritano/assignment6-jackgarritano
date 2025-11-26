/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

import React, { Fragment } from "react";
import styled from "styled-components";
import { NavLink } from "react-router";
import md5 from "md5";

/**
 * @return {string}
 */
export function GravHash(email, size) {
  let hash = email && email.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
  hash = hash && hash.toLowerCase();
  hash = hash && md5(hash);
  return `https://www.gravatar.com/avatar/${hash}?size=${size}`;
}

const fontColor = "#c4a1a1";

const HeaderLeftBase = styled.div`
  flex-grow: 1;
  font-style: italic;
  & > h2 {
    color: ${fontColor};
    margin: 0.75em 0 0.75em 0.5em;
  }
  & > a {
    text-decoration: none;
    & > h2 {
      color: ${fontColor};
      margin: 0.75em 0 0.75em 0.5em;
    }
  }
`;

const HeaderLeft = ({ user }) => {
  return (
    <HeaderLeftBase>
      {user !== "" ? (
        <NavLink to={`/profile/${user}`}>
          <h2>GrahamCard</h2>
        </NavLink>
      ) : (
        <h2>GrahamCard</h2>
      )}
    </HeaderLeftBase>
  );
};

const HeaderRightBase = styled.div`
  display: flex;
  flex-direction: ${(props) => (props.$vertical ? "row" : "column")};
  justify-content: center;
  align-items: ${(props) => (props.$vertical ? "center" : "flex-end")};
  padding-right: 0.5em;
  & > a {
    color: ${fontColor};
    padding-right: ${(props) => (props.$vertical ? "0.5em" : "0")};
  }
`;

const HeaderRight = ({ user, email }) => {
  const isLoggedIn = user !== "";
  return (
    <HeaderRightBase $vertical={isLoggedIn}>
      {isLoggedIn ? (
        <Fragment>
          <NavLink to="/logout">Log Out</NavLink>
          <NavLink to={`/profile/${user}`}>
            <img alt="go to profile" src={GravHash(email, 40)} />
          </NavLink>
        </Fragment>
      ) : (
        <Fragment>
          <NavLink id="loginLink" to="/login">
            Log In
          </NavLink>
          <NavLink id="regLink" to="/register">
            Register
          </NavLink>
        </Fragment>
      )}
    </HeaderRightBase>
  );
};

const HeaderBase = styled.div`
  grid-area: hd;
  display: flex;
  background: #000;
`;

export const Header = ({ user = "", email = "" }) => (
  <HeaderBase>
    <HeaderLeft user={user} />
    <HeaderRight user={user} email={email} />
  </HeaderBase>
);
