/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ErrorMessage,
  FormBase,
  FormInput,
  FormLabel,
  FormButton,
  ModalNotify,
} from "./shared.js";

export const Edit = ({ user }) => {
  let navigate = useNavigate();
  let [state, setState] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    city: user.city || "",
  });
  let [error, setError] = useState("");
  let [notify, setNotify] = useState("");

  useEffect(() => {
    document.getElementById("first_name").focus();
  }, []);

  const onChange = (ev) => {
    setError("");
    setState({
      ...state,
      [ev.target.name]: ev.target.value,
    });
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const res = await fetch("/v1/user", {
      method: "PUT",
      body: JSON.stringify(state),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
    });
    if (res.ok) {
      const updatedUser = { ...user, ...state };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setNotify(`Profile updated.`);
    } else if (res.status === 401) {
      setError("Error: You must be logged in to edit profile.");
    } else {
      const err = await res.json();
      setError(err.error ? `Error: ${err.error}` : "Error updating profile.");
    }
  };

  const onAcceptEdit = () => {
    navigate(`/profile/${user.username}`);
  };

  return (
    <div style={{ gridArea: "main" }}>
      {notify !== "" ? (
        <ModalNotify id="notification" msg={notify} onAccept={onAcceptEdit} />
      ) : null}
      <ErrorMessage msg={error} />
      <FormBase>
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
          Update Profile
        </FormButton>
      </FormBase>
    </div>
  );
};
