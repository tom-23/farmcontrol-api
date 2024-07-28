import express from "express";
import passport from "passport";
import jwt from 'jsonwebtoken';

const router = express.Router();
import { listPrintersRouteHandler, editPrinterRouteHandler, getPrinterRouteHandler } from "../../services/printers/index.js";

// list of printers
router.get("/", passport.authenticate('jwt',{session: false}), (req, res) => {
  const { page, limit } = req.body;
  listPrintersRouteHandler(req, res, page, limit);
});

router.get("/:remoteAddress", passport.authenticate('jwt',{session: false}), (req, res) => {
  getPrinterRouteHandler(req, res);
});

// update printer info
router.put("/:remoteAddress", passport.authenticate('jwt',{session: false}), async (req, res) => {
  editPrinterRouteHandler(req, res);
});



export default router;
