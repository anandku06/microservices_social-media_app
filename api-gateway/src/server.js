const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const proxy = require("express-http-proxy");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const validateToken = require("./middleware/authMiddleware");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(express.json());
app.use(helmet());
app.use(cors());

const ratelimit = rateLimit({
  windowMs: 15 * 60 * 1000,
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

app.use(ratelimit);

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request Body, ${req.body}`);

  next();
});

// Initialize proxy options
const proxyOptions = {
  // this function rewrites the request path
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },

  // this function handles errors from the proxy
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(502).json({
      success: false,
      message: "Bad Gateway",
    });
  },
};

// setting up the proxy middleware for identity service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    // additional options specific to identity service
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["content-type"] = "application/json";
      return proxyReqOpts;
    },
    // used to decorate the response from the proxy
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(`Response from Identity Service: ${proxyRes.statusCode}`);
      return proxyResData;
    },
  }),
);

// setting up proxy for post-service
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["content-type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(`Response from Post Service: ${proxyRes.statusCode}`);
      return proxyResData;
    },
  }),
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(
    `Identity Service running on ${process.env.IDENTITY_SERVICE_URL}`,
  );
  logger.info(
    `Post Service running on ${process.env.POST_SERVICE_URL}`,
  );
  logger.info(`Redis running on ${process.env.REDIS_URL}`);
});
