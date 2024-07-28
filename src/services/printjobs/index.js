import dotenv from "dotenv";
import { printJobModel } from "../../schemas/printjob.schema.js"
import jwt from "jsonwebtoken";
import log4js from "log4js";

dotenv.config();

const logger = log4js.getLogger("PrintJobs");
logger.level = process.env.LOG_LEVEL;

export const listPrintJobsRouteHandler = async (
  req,
  res,
  page = 1,
  limit = 25
) => {
  try {
    // Calculate the skip value based on the page number and limit
    const skip = (page - 1) * limit;

    // Fetch users with pagination
    const printJobs = await printJobModel.find().skip(skip).limit(limit);

    logger.trace(`List of print jobs (Page ${page}, Limit ${limit}):`);
    res.send(printJobs);
  } catch (error) {
    logger.error("Error listing print jobs:", error);
    res.status(500).send({ error: error });
  }
};

export const getPrintJobRouteHandler = async (req, res) => {
  try {
    // Get ID from params
    const id = new mongoose.Types.ObjectId(req.params.id);
    // Fetch the printJob with the given remote address
    const printJob = await printJobModel.findOne({ 
      _id: id
    });
    
    if (!printJob) {
      logger.warn(`PrintJob not found with supplied id.`);
      return res.status(404).send({ error: "Print job not found." });
    }

    logger.trace(`PrintJob with ID: ${id}:`, printJob);
    res.send(printJob);
  } catch (error) {
    logger.error("Error fetching printJob:", error);
    res.status(500).send({ error: error.message });
  }
};

export const editPrintJobRouteHandler = async (req, res) => {
  try {
    // Get ID from params
    const id = new mongoose.Types.ObjectId(req.params.id);
    // Fetch the printJob with the given remote address
    const printJob = await printJobModel.findOne({ _id: id });

    if (!printJob) { // Error handling
      logger.warn(`PrintJob not found with supplied id.`);
      return res.status(404).send({ error: "Print job not found." });
    }

    logger.trace(`PrintJob with ID: ${id}:`, printJob);
    
    try {
      const { created_at, updated_at, started_at, status, ...updateData } = req.body;
      
      const result = await printJobModel.updateOne(
        { _id: id },
        { $set: updateData }
      );
      if (result.nModified === 0) {
        logger.error("No printJobs updated.");
        res.status(500).send({ error: "No printJobs updated." });
      }
    } catch (updateError) {
      logger.error("Error updating printJob:", updateError);
      res.status(500).send({ error: updateError.message });
    }
    res.send("OK");
  } catch (fetchError) {
    logger.error("Error fetching printJob:", fetchError);
    res.status(500).send({ error: fetchError.message });
  }
};