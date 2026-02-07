require("dotenv").config();
const express = require("express");
const Redis = require("ioredis");
const helmet = require("helmet");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");
const postRoutes = require("./routes/post-routes");
const connectDB = require("./utils/db");

const app = express();
const PORT = process.env.PORT;

const redisClient = new Redis(process.env.REDIS_CLIENT);

app.use(express.json());
app.use(helmet());
app.use(cors());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request Body, ${req.body}`);

  next();
});

app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes,
);

app.use(errorHandler);

app.listen(PORT, async () => {
  await connectDB();
  logger.info(`Identity Service running on port ${PORT}`);
});

// unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
