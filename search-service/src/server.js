require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const Redis = require("ioredis");
const errorHandler = require("./middlewares/errorHandler");
const connectDB = require("./utils/db");
const logger = require("./utils/logger");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const searchRoutes = require("./routes/search-routes");
const {
  handlePostCreated,
  handlePostDeleted,
} = require("./eventHandlers/searchEventHandler");

const redisClient = new Redis(process.env.REDIS_CLIENT);
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

app.use(
  "/api/search",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  searchRoutes,
);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectToRabbitMQ();

    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDeleted);

    app.listen(PORT, async () => {
      await connectDB();
      logger.info(`Search Service running on port ${PORT}`);
    });
  } catch (e) {
    logger.error("Failed to start Search service", e);
    process.exit(1);
  }
};

startServer();

// unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection, Reason:", reason);
});
