const { RedisStore } = require("rate-limit-redis");
const { rateLimit } = require("express-rate-limit");
const Redis = require("ioredis");
const logger = require("../utils/logger");
require("dotenv").config();

const redisClient = new Redis(process.env.REDIS_URL);

// Middleware for rate limiting sensitive endpoints
const sensitiveEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes, specifies the time frame for which requests are checked
  max: 15, // limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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
