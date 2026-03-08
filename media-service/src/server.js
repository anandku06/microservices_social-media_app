require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middlewares/errorHandler");
const mediaRoutes = require("./routes/media-routes");
const logger = require("./utils/logger");
const connectDB = require("./utils/db");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { handlePostDeleted } = require("./eventHandlers/mediaEventHandler");

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

async function startServer() {
  try {
    await connectToRabbitMQ();

    // consume events from RabbitMQ with routing key "post.deleted", so that we can perform necessary actions like deleting associated media, etc. whenever a post is deleted
    await consumeEvent("post.deleted", handlePostDeleted);

    app.listen(PORT, async () => {
      await connectDB();
      logger.info(`Media Service running on port ${PORT}`);
    });
  } catch (e) {
    logger.error("Error starting the server", e);
    process.exit(1);
  }
}

startServer();

// unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection, Reason:", reason);
});
