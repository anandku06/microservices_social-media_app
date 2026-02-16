const { RedisStore } = require("rate-limit-redis");
const { rateLimit } = require("express-rate-limit");
const Redis = require("ioredis");
const logger = require("../utils/logger");
require("dotenv").config();

const redisClient = new Redis(process.env.REDIS_URL);

const sensitiveEndpointLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too Many Requests on sensitive endpoint",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

module.exports = sensitiveEndpointLimiter;
