const logger = require("./utils/logger");
const express = require("express");
const connectDB = require("./utils/db");
const helmet = require("helmet");
const Redis = require("ioredis");
const cors = require("cors");
const identityRoutes = require("./routes/identity-service");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const errorHandler = require("./middlewares/errorHandler");

require("dotenv").config();

const PORT = process.env.PORT;
const redisUrl = process.env.REDIS_CLIENT;
const redisClient = new Redis(redisUrl);

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request Body, ${req.body}`);

  next();
});

// DDoS Protection using rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient, // tells rate limiter to use redis
  keyPrefix: "middleware", // prefix for all keys stored in redis
  points: 10, // 10 requests
  duration: 1, // per second
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too Many Requests" });
    });
});

app.use("/api/auth", identityRoutes);

app.use(errorHandler);

app.listen(PORT, async () => {
  await connectDB();
  logger.info(`Identity Service running on port ${PORT}`);
});

// unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
