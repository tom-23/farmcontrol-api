import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { userModel } from "../../schemas/user.schema.js";
import { printerModel } from "../../schemas/printer.schema.js";
import jwt from "jsonwebtoken";
import log4js from "log4js";

dotenv.config();

const logger = log4js.getLogger("Printers");
logger.level = process.env.LOG_LEVEL;

export const listPrintersRouteHandler = async (
  req,
  res,
  page = 1,
  limit = 25
) => {
  try {
    // Calculate the skip value based on the page number and limit
    const skip = (page - 1) * limit;

    // Fetch users with pagination
    const printers = await printerModel.find().skip(skip).limit(limit);

    logger.trace(`List of printers (Page ${page}, Limit ${limit}):`);
    res.send(printers);
  } catch (error) {
    logger.error("Error listing users:", error);
    res.status(500).send({ error: error });
  }
};

export const getPrinterRouteHandler = async (req, res) => {
  const remoteAddress = req.params.remoteAddress;

  try {
    // Fetch the printer with the given remote address
    const printer = await printerModel.findOne({ remoteAddress });

    if (!printer) {
      logger.warn(`Printer with remote address ${remoteAddress} not found.`);
      return res.status(404).send({ error: "Printer not found" });
    }

    logger.trace(`Printer with remote address ${remoteAddress}:`, printer);
    res.send(printer);
  } catch (error) {
    logger.error("Error fetching printer:", error);
    res.status(500).send({ error: error.message });
  }
};

export const editPrinterRouteHandler = async (req, res) => {
  const remoteAddress = req.params.remoteAddress;
  const { friendlyName } = req.body;

  try {
    // Fetch the printer with the given remote address
    const printer = await printerModel.findOne({ remoteAddress });

    if (!printer) {
      logger.warn(`Printer with remote address ${remoteAddress} not found.`);
      return res.status(404).send({ error: "Printer not found" });
    }

    logger.trace(`Editing printer with remote address ${remoteAddress}:`, printer);
    try {
      const result = await printerModel.updateOne(
        { remoteAddress: remoteAddress },
        { $set: req.body }
      );
      if (result.nModified === 0) {
        logger.error("No printers updated.");
        res.status(500).send({ error: "No printers updated." });
      }
    } catch (updateError) {
      logger.error("Error updating printer:", updateError);
      res.status(500).send({ error: updateError.message });
    }
    res.send("OK");
  } catch (fetchError) {
    logger.error("Error fetching printer:", fetchError);
    res.status(500).send({ error: fetchError.message });
  }
};