/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ErrorMessage,
  FormBase,
  FormInput,
  FormLabel,
  FormButton,
  ModalNotify,
} from "./shared.js";

export const GitHubRegister = ({ logIn }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username || "";

  const [state, setState] = useState({
    primary_email: "",
    first_name: "",
    last_name: "",
    city: "",
  });
  const [error, setError] = useState("");
  const [notify, setNotify] = useState("");

  useEffect(() => {
    if (!username) {
      setError("No GitHub user data found. Please try registering again.");
    } else {
      document.getElementById("primary_email").focus();
    }
  }, [username]);

  const onChange = (ev) => {
    setError("");
    setState({
      ...state,
      [ev.target.name]: ev.target.value,
    });
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();

    if (!username) {
      setError("No GitHub user data. Please start the registration process again.");
      return;
    }

    const res = await fetch("/v1/user/github", {
      method: "POST",
      body: JSON.stringify(state),
      headers: {
        "content-type": "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      await logIn(data.username);
      setNotify(`Welcome ${data.username}! Your GitHub account has been linked.`);
    } else {
      const err = await res.json();
      setError(err.error || "Registration failed");
    }
  };

  const onAcceptRegister = () => {
    navigate(`/profile/${username}`);
  };

  if (!username) {
    return (
      <div style={{ gridArea: "main" }}>
        <ErrorMessage msg={error} />
        <FormButton onClick={() => navigate("/register")}>
          Back to Registration
        </FormButton>
      </div>
    );
  }

  return (
    <div style={{ gridArea: "main" }}>
      {notify !== "" ? (
        <ModalNotify
          id="notification"
          msg={notify}
          onAccept={onAcceptRegister}
        />
      ) : null}
      <ErrorMessage msg={error} />
      <h3 style={{ textAlign: "center" }}>Complete Your GitHub Registration</h3>
      <FormBase>
        <FormLabel htmlFor="username">GitHub Username:</FormLabel>
        <FormInput
          id="username"
          name="username"
          value={username}
          disabled
          style={{ background: "#f5f5f5", cursor: "not-allowed" }}
        />

        <FormLabel htmlFor="primary_email">Email:</FormLabel>
        <FormInput
          id="primary_email"
          name="primary_email"
          type="email"
          placeholder="Email Address"
          onChange={onChange}
          value={state.primary_email}
          required
        />

        <FormLabel htmlFor="first_name">First Name:</FormLabel>
        <FormInput
          id="first_name"
          name="first_name"
          placeholder="First Name"
          onChange={onChange}
          value={state.first_name}
        />

        <FormLabel htmlFor="last_name">Last Name:</FormLabel>
        <FormInput
          id="last_name"
          name="last_name"
          placeholder="Last Name"
          onChange={onChange}
          value={state.last_name}
        />

        <FormLabel htmlFor="city">City:</FormLabel>
        <FormInput
          id="city"
          name="city"
          placeholder="City"
          onChange={onChange}
          value={state.city}
        />

        <div />
        <FormButton id="submitBtn" onClick={onSubmit}>
          Complete Registration
        </FormButton>
      </FormBase>
    </div>
  );
};
