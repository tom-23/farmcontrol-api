import express from "express";
import passport from "passport";
import jwt from 'jsonwebtoken';
import { parseStringIfNumber } from '../../util/index.js'

const router = express.Router();
import { listFillamentsRouteHandler, getFillamentRouteHandler, editFillamentRouteHandler, newFillamentRouteHandler } from "../../services/fillaments/index.js";

// list of fillaments
router.get("/", passport.authenticate('jwt',{session: false}), (req, res) => {
  const { page, limit, property } = req.query;
  
  const allowedFilters = [
    'type',
    'brand',
    'diameter',
    'color'
  ]
  
  const filter = {};
  
  for (const [key, value] of Object.entries(req.query)) {
    for (var i = 0; i < allowedFilters.length; i++) {
      if (key == allowedFilters[i]) {
        filter[key] = parseStringIfNumber(value);
      }
    }
   
  }
  
  listFillamentsRouteHandler(req, res, page, limit, property, filter);
});

router.post("/", passport.authenticate('jwt',{session: false}), (req, res) => {
  newFillamentRouteHandler(req, res);
});

router.get("/:id", passport.authenticate('jwt',{session: false}), (req, res) => {
  getFillamentRouteHandler(req, res);
});

// update printer info
router.put("/:id", passport.authenticate('jwt',{session: false}), async (req, res) => {
  editFillamentRouteHandler(req, res);
});

export default router;
