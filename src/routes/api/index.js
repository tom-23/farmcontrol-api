import express from "express";
import passport from "passport";
import jwt from 'jsonwebtoken';

const router = express.Router();
import { getProfileRouteHandler, patchProfileRouteHandler, getDashboardRouteHandler } from "../../services/api/index.js";

// get main dashboard info profile
router.get("/", passport.authenticate('jwt',{session: false}), (req, res) => {
  getDashboardRouteHandler(req, res);
});

// get user's profile
router.get("/user", passport.authenticate('jwt',{session: false}), (req, res) => {
  getProfileRouteHandler(req, res);
});

// update user's profile
router.patch("/", passport.authenticate('jwt',{session: false}), async (req, res) => {
  patchProfileRouteHandler(req, res);
});

export default router;
