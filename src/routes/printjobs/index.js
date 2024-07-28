import express from "express";
import passport from "passport";
import jwt from 'jsonwebtoken';

const router = express.Router();
import { listPrintJobsRouteHandler, getPrintJobRouteHandler, editPrintJobRouteHandler } from "../../services/printjobs/index.js";

// list of printers
router.get("/", passport.authenticate('jwt',{session: false}), (req, res) => {
  const { page, limit } = req.body;
  listPrintJobsRouteHandler(req, res, page, limit);
});

router.get("/:jobNumber", passport.authenticate('jwt',{session: false}), (req, res) => {
  getPrintJobRouteHandler(req, res);
});

// update printer info
router.put("/:jobNumber", passport.authenticate('jwt',{session: false}), async (req, res) => {
  editPrintJobRouteHandler(req, res);
});

export default router;
