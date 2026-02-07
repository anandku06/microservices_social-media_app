const express = require("express");
const { authenticateRequest } = require("../middlewares/authMiddleware");
const {
  createPost,
  getAllposts,
  getPost,
  deletePost,
} = require("../controllers/post-controller");
const sensitiveEndpointLimiter = require("../middlewares/sensitiveRateLimiter");

const router = express.Router();

router.use(authenticateRequest); // this will work on all the routes ; middleware to auth all the request

router.all(["/create-post", "/get-posts", "/:id"], sensitiveEndpointLimiter); // Apply rate limiting to all routes

router.post("/create-post", createPost);
router.get("/get-posts", getAllposts);
router.get("/:id", getPost);
router.delete("/:id", deletePost);

module.exports = router;
