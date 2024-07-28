import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import "./passport.js";
import { dbConnect } from "./mongo/index.js";
import { apiRoutes, authRoutes, printerRoutes, printJobRoutes, gcodeFileRoutes, fillamentRoutes } from "./routes/index.js";
import path from "path";
import * as fs from "fs";
import cron from "node-cron";
import ReseedAction from "./mongo/ReseedAction.js";
import log4js from "log4js";

dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();

const logger = log4js.getLogger("App");
logger.level = process.env.LOG_LEVEL;

app.use(log4js.connectLogger(logger, { level: "trace" }));

const whitelist = [process.env.APP_URL_CLIENT];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

dbConnect();

app.use(cors(corsOptions));
app.use(bodyParser.json({ type: "application/json", strict: false, limit: '50mb' }));
app.use(express.json());

app.get("/", function (req, res) {
  const __dirname = fs.realpathSync(".");
  res.sendFile(path.join(__dirname, "/src/landing/index.html"));
});

app.use("/auth", authRoutes);
app.use("/overview", apiRoutes);
app.use("/printers", printerRoutes);
app.use("/printjobs", printJobRoutes);
app.use("/gcodefiles", gcodeFileRoutes);
app.use("/fillaments", fillamentRoutes);

if (process.env.SCHEDULE_HOUR) {
  cron.schedule(`0 */${process.env.SCHEDULE_HOUR} * * *'`, () => {
    ReseedAction();
  });
}

app.listen(PORT, () => logger.info(`Server listening to port ${PORT}`));
