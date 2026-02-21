require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middlewares/errorHandler");
const mediaRoutes = require("./routes/media-routes");
const logger = require("./utils/logger");
const connectDB = require('./utils/db')

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request Body, ${req.body}`);

  next();
});

app.use("/api/media", mediaRoutes);

app.use(errorHandler);

app.listen(PORT, async () => {
  await connectDB();
  logger.info(`Media Service running on port ${PORT}`);
});

// unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection, Reason:", reason);
});
