/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ErrorMessage,
  FormBase,
  FormLabel,
  FormInput,
  FormButton,
  OrSeparator,
} from "./shared.js";

export const Login = (props) => {
  let navigate = useNavigate();
  let [username, setUser] = useState("");
  let [password, setPass] = useState("");
  let [error, setError] = useState("");

  const onSubmit = async (ev) => {
    ev.preventDefault();
    let res = await fetch("/v1/session", {
      body: JSON.stringify({
        username,
        password,
      }),
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
    });
    const data = await res.json();
    if (res.ok) {
      props.logIn(data.username);
      navigate(`/profile/${data.username}`);
    } else {
      setError(`Error: ${data.error}`);
    }
  };

  useEffect(() => {
    document.getElementById("username").focus();
  }, []);

  return (
    <div style={{ gridArea: "main" }}>
      <ErrorMessage msg={error} />
      <FormBase>
        <FormLabel htmlFor="username">Username:</FormLabel>
        <FormInput
          id="username"
          name="username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(ev) => setUser(ev.target.value.toLowerCase())}
        />

        <FormLabel htmlFor="password">Password:</FormLabel>
        <FormInput
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(ev) => setPass(ev.target.value)}
        />
        <div />
        <FormButton id="submitBtn" onClick={onSubmit}>
          Login
        </FormButton>
        <FormLabel />
        <OrSeparator />
        <FormLabel />
        <FormButton
          type="button"
          onClick={() => {
            window.location.href = `https://github.com/login/oauth/authorize?client_id=Ov23liWawHIrVg5l3YoB&redirect_uri=${encodeURIComponent("http://localhost:8080/github")}&scope=read:user`;
          }}
          style={{ background: "#24292e", color: "white" }}
        >
          Log in with GitHub
        </FormButton>
      </FormBase>
    </div>
  );
};
