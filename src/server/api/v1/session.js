/* Copyright G. Hemingway, @2025 - All rights reserved */
/* Attribution: Assignment 5 codebase */
"use strict";

import Joi from "joi";

export default (app) => {
  /**
   * Log a user in
   *
   * @param {req.body.username} Username of user trying to log in
   * @param {req.body.password} Password of user trying to log in
   * @return { 200, {username, primary_email} }
   */
  app.post("/v1/session", async (req, res) => {
    // Validate incoming request has username and password, if not return 400:'username and password are required'
    const schema = Joi.object({
      username: Joi.string().lowercase().required(),
      password: Joi.string().required(),
    });
    try {
      const data = await schema.validateAsync(req.body, { stripUnknown: true });
      // Search database for user
      try {
        let user = await app.models.User.findOne({ username: data.username });
        if (!user) res.status(401).send({ error: "unauthorized" });
        else if (await user.authenticate(data.password)) {
          // Regenerate session when signing in to prevent fixation
          req.session.regenerate(() => {
            req.session.user = user;
            console.log(`Session.login success: ${req.session.user.username}`);
            // If a match, return 201:{ username, primary_email }
            res.status(200).send({
              username: user.username,
              primary_email: user.primary_email,
            });
          });
        } else {
          // If not a match, return 401:unauthorized
          console.log(`Session.login failed.  Incorrect credentials.`);
          res.status(401).send({ error: "unauthorized" });
        }
      } catch (err) {
        res.status(500).send({ error: "internal server error" });
      }
    } catch (err) {
      console.log(err);
      const message = err.details[0].message;
      console.log(`Session.login validation failure: ${message}`);
      res.status(400).send({ error: message });
    }
  });

  /**
   * Log a user out
   *
   * @return { 204 if was logged in, 200 if no user in session }
   */
  app.delete("/v1/session", (req, res) => {
    if (req.session.user) {
      req.session.destroy(() => {
        res.status(204).end();
      });
    } else {
      res.status(200).end();
    }
  });

  /**
   * GitHub OAuth callback
   *
   * @param {req.query.code} OAuth authorization code from GitHub
   * @return {200, {exists: boolean, username: string}} - exists=true if user logged in, false if needs registration
   */
  app.get("/v1/session/github-login", async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send({ error: "Authorization code is required" });
    }

    try {
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.log(`GitHub OAuth error: ${tokenData.error}`);
        console.log(tokenData);
        return res.status(400).send({ error: "GitHub authorization failed" });
      }

      const accessToken = tokenData.access_token;

      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });

      const githubUser = await userResponse.json();

      let user = await app.models.User.findOne({ github_id: githubUser.id.toString() });

      if (user) {
        // log in existing user
        req.session.regenerate(() => {
          req.session.user = user;
          console.log(`GitHub login success: ${user.username}`);
          res.status(200).send({
            exists: true,
            username: user.username,
          });
        });
      } else {
        // store GitHub data in session for registration of new user
        req.session.githubData = {
          github_id: githubUser.id.toString(),
          username: githubUser.login,
        };
        console.log(`GitHub new user: ${githubUser.login}`);
        res.status(200).send({
          exists: false,
          username: githubUser.login,
        });
      }
    } catch (err) {
      console.log(`GitHub OAuth error chekc: ${err}`);
      res.status(500).send({ error: "Internal server error" });
    }
  });
};
