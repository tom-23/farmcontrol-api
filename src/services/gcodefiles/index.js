import dotenv from "dotenv";
import { gcodeFileModel } from "../../schemas/gcodefile.schema.js"
import jwt from "jsonwebtoken";
import log4js from "log4js";

dotenv.config();

const logger = log4js.getLogger("GCodeFiles");
logger.level = process.env.LOG_LEVEL;

export const listGCodeFilesRouteHandler = async (
  req,
  res,) => {
  try {
    
    // Fetch gcode files and group
    const gcodeFiles = await gcodeFileModel.aggregate([
      {
        $group: {
          _id: "$status",
          totalQuantity: { $sum: "$quantity" },
          totalPrice: { $sum: "$price" },
          orders: { $push: "$$ROOT" }
        }
      }
    ]);

    logger.trace(`List of print jobs (Page ${page}, Limit ${limit}):`);
    res.send(gcodeFile);
  } catch (error) {
    logger.error("Error listing print jobs:", error);
    res.status(500).send({ error: error });
  }
};

export const getGCodeFileRouteHandler = async (req, res) => {
  try {
    // Get ID from params
    const id = new mongoose.Types.ObjectId(req.params.id);
    // Fetch the gcodeFile with the given remote address
    const gcodeFile = await gcodeFileModel.findOne({ 
      _id: id
    });
    
    if (!gcodeFile) {
      logger.warn(`GCodeFile not found with supplied id.`);
      return res.status(404).send({ error: "Print job not found." });
    }

    logger.trace(`GCodeFile with ID: ${id}:`, gcodeFile);
    res.send(gcodeFile);
    
  } catch (error) {
    logger.error("Error fetching GCodeFile:", error);
    res.status(500).send({ error: error.message });
  }
};

export const editGCodeFileRouteHandler = async (req, res) => {
  try {
    // Get ID from params
    const id = new mongoose.Types.ObjectId(req.params.id);
    // Fetch the gcodeFile with the given remote address
    const gcodeFile = await gcodeFileModel.findOne({ _id: id });

    if (!gcodeFile) { // Error handling
      logger.warn(`GCodeFile not found with supplied id.`);
      return res.status(404).send({ error: "Print job not found." });
    }

    logger.trace(`GCodeFile with ID: ${id}:`, gcodeFile);
    
    try {
      const { created_at, updated_at, started_at, status, ...updateData } = req.body;
      
      const result = await gcodeFileModel.updateOne(
        { _id: id },
        { $set: updateData }
      );
      if (result.nModified === 0) {
        logger.error("No gcodeFile updated.");
        res.status(500).send({ error: "No gcodeFiles updated." });
      }
    } catch (updateError) {
      logger.error("Error updating gcodeFile:", updateError);
      res.status(500).send({ error: updateError.message });
    }
    res.send("OK");
  } catch (fetchError) {
    logger.error("Error fetching gcodeFile:", fetchError);
    res.status(500).send({ error: fetchError.message });
  }
};