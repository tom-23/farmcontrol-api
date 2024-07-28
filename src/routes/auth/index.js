import express from "express";
import passport from "passport";

import {
  getAuthModesHandler,
  forgotPasswordRouteHandler,
  loginRouteHandler,
  registerPasskeyRouteHandler,
  loginPasskeyRouteHandler,
  registerRouteHandler,
  resetPasswordRouteHandler,
  validateTokenRouteHandler,
} from "../../services/auth/index.js";

const router = express.Router();

router.post("/modes", async (req, res, next) => {
  const { email } = req.body;
  await getAuthModesHandler(req, res, email);
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  await loginRouteHandler(req, res, email, password);
});

router.post("/validate-token", async (req, res, next) => {
  const { token } = req.body;
  await validateTokenRouteHandler(req, res, token);
});

router.post("/logout", (req, res) => {
  return res.sendStatus(204);
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  await registerRouteHandler(req, res, name, email, password);
});

router.post("/passkey/register", passport.authenticate('jwt',{session: false}), async (req, res) => {
  await registerPasskeyRouteHandler(req, res);
});

router.post("/passkey/login", async (req, res) => {
  const { email, attestationResponse } = req.body;
  await loginPasskeyRouteHandler(req, res, email, attestationResponse);
});

router.post("/password-forgot", async (req, res) => {
  const { email } = req.body;
  await forgotPasswordRouteHandler(req, res, email);
});

router.post("/password-reset", async (req, res) => {
  await resetPasswordRouteHandler(req, res);
});

export default router;
