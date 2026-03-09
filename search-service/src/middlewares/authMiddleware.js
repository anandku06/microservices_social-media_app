const logger = require("../utils/logger");

const authenticateRequest = async (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    logger.warn("Access attempt without userId!!");
    return res.status(401).json({
      success: false,
      message: "Auth required!!",
    });
  }

  req.user = { userId };

  next();
};

module.exports = { authenticateRequest };
