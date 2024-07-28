import express from "express";
import passport from "passport";
import jwt from 'jsonwebtoken';

const router = express.Router();
import { listGCodeFilesRouteHandler, getGCodeFileRouteHandler, editGCodeFileRouteHandler } from "../../services/gcodefiles/index.js";

// list of printers
router.get("/", passport.authenticate('jwt',{session: false}), (req, res) => {
  const { page, limit } = req.body;
  listGCodeFilesRouteHandler(req, res, page, limit);
});

router.get("/:id", passport.authenticate('jwt',{session: false}), (req, res) => {
  getGCodeFileRouteHandler(req, res);
});

// update printer info
router.put("/:id", passport.authenticate('jwt',{session: false}), async (req, res) => {
  editGCodeFileRouteHandler(req, res);
});

export default router;
