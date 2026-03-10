const express = require("express");
const { searchedPostController } = require("../controllers/search-controller");
const { authenticateRequest } = require("../middlewares/authMiddleware");
const sensitiveEndpointLimiter = require("../middlewares/sensitiveRateLimiter");

const router = express.Router();

router.use(authenticateRequest, sensitiveEndpointLimiter);


router.get("/posts", searchedPostController)

module.exports = router