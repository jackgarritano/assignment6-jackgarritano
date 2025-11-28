/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import styled from "styled-components";

const LoadingMessage = styled.div`
  grid-area: main;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2em;
  color: #666;
`;

export const GitHubCallback = ({ logIn }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleGitHubCallback = async () => {
      if (hasProcessed.current) {
        return;
      }
      hasProcessed.current = true;

      const code = searchParams.get("code");

      if (!code) {
        setError("No authorization code received from GitHub");
        return;
      }

      try {
        const response = await fetch(`/v1/session/github-login?code=${code}`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "GitHub authentication failed");
          return;
        }

        if (data.exists) {
          await logIn(data.username);
          navigate(`/profile/${data.username}`);
        } else {
          navigate("/github-register", { state: { username: data.username } });
        }
      } catch (err) {
        console.error("GitHub callback error:", err);
        setError("An error occurred during GitHub authentication");
      }
    };

    handleGitHubCallback();
  }, [searchParams, navigate, logIn]);

  return (
    <LoadingMessage>
      {error || "Completing authentication..."}
    </LoadingMessage>
  );
};
