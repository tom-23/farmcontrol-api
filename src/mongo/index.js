import mongoose from "mongoose";
import dotenv from "dotenv";
import log4js from "log4js";

const logger = log4js.getLogger("MongoDB");
logger.level = process.env.LOG_LEVEL;

dotenv.config();

function dbConnect() {
  mongoose.connection.once("open", () => logger.info("Database connected."));
  return mongoose.connect(
    `mongodb://${process.env.DB_LINK}/farmcontrol?retryWrites=true&w=majority`,
    {  }
  );
}

export { dbConnect };