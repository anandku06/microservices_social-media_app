const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  generateUserTokens,
} = require("../controllers/identity-controller");
const sensitiveEndpointLimiter = require("../middlewares/sensitiveRateLimiter");

const router = express.Router();

router.use(sensitiveEndpointLimiter);

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/token", generateUserTokens);

module.exports = router;
