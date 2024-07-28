import dotenv from "dotenv";
import { fillamentModel } from "../../schemas/fillament.schema.js"
import jwt from "jsonwebtoken";
import log4js from "log4js";
import mongoose from "mongoose";

dotenv.config();

const logger = log4js.getLogger("Fillaments");
logger.level = process.env.LOG_LEVEL;

export const listFillamentsRouteHandler = async (req, res, page = 1, limit = 25, property = "", filter = {}) => {
  try {
    // Calculate the skip value based on the page number and limit
    const skip = (page - 1) * limit;
    

    let fillament;
    let aggregateCommand = [];
    
    if (filter != {}) { // use filtering if present
      aggregateCommand.push({ $match: filter });
    }
    
    if (property != "") {
      aggregateCommand.push({ $group: { _id: `$${property}` } }) // group all same properties
      aggregateCommand.push({ $project: { _id: 0, [property]: "$_id"  }}); // rename _id to the property name
    } else {
      aggregateCommand.push({ $project: { image: 0, url: 0  }});
    }
    
    aggregateCommand.push({ $skip: skip });
    aggregateCommand.push({ $limit: Number(limit) });
    
    console.log(aggregateCommand)
    
    fillament = await fillamentModel.aggregate(aggregateCommand)
    
    logger.trace(`List of filaments (Page ${page}, Limit ${limit}, Property ${property}):`, fillament);
    res.send(fillament);
  } catch (error) {
    logger.error("Error listing filaments:", error);
    res.status(500).send({ error: error });
  }
};

export const getFillamentRouteHandler = async (req, res) => {
  try {
    // Get ID from params
    const id = new mongoose.Types.ObjectId(req.params.id);
    // Fetch the fillament with the given remote address
    const fillament = await fillamentModel.findOne({ 
      _id: id
    });
    
    if (!fillament) {
      logger.warn(`Fillament not found with supplied id.`);
      return res.status(404).send({ error: "Print job not found." });
    }

    logger.trace(`Fillament with ID: ${id}:`, fillament);
    res.send(fillament);
  } catch (error) {
    logger.error("Error fetching Fillament:", error);
    res.status(500).send({ error: error.message });
  }
};

export const editFillamentRouteHandler = async (req, res) => {
  try {
    // Get ID from params
    const id = new mongoose.Types.ObjectId(req.params.id);
    // Fetch the fillament with the given remote address
    const fillament = await fillamentModel.findOne({ _id: id });

    if (!fillament) { // Error handling
      logger.warn(`Fillament not found with supplied id.`);
      return res.status(404).send({ error: "Print job not found." });
    }

    logger.trace(`Fillament with ID: ${id}:`, fillament);
    
    try {
      const { created_at, updated_at, started_at, status, ...updateData } = req.body;
      
      const result = await fillamentModel.updateOne(
        { _id: id },
        { $set: updateData }
      );
      if (result.nModified === 0) {
        logger.error("No Fillament updated.");
        res.status(500).send({ error: "No fillaments updated." });
      }
    } catch (updateError) {
      logger.error("Error updating fillament:", updateError);
      res.status(500).send({ error: updateError.message });
    }
    res.send("OK");
  } catch (fetchError) {
    logger.error("Error fetching fillament:", fetchError);
    res.status(500).send({ error: fetchError.message });
  }
};

export const newFillamentRouteHandler = async (req, res) => {

    try {
      let { ...newFillament  } = req.body;
      newFillament = { ...newFillament, created_at: new Date(), updated_at: new Date() }
      
      const result = await fillamentModel.create(newFillament);
      if (result.nCreated === 0) {
        logger.error("No fillament created.");
        res.status(500).send({ error: "No fillament created." });
      }
      res.status(200).send({ status: "ok" });
    } catch (updateError) {
      logger.error("Error updating fillament:", updateError);
      res.status(500).send({ error: updateError.message });
    }
};