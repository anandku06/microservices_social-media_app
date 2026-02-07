const Post = require("../models/Post");
const logger = require("../utils/logger");
const { validatePost } = require("../utils/validation");

const invalidatePostsCache = async (req, input) => {
  const cacheKey = `post:${input}`;
  await req.redisClient.del(cacheKey);

  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
};

const createPost = async (req, res) => {
  logger.info("/create-post endpoint hit!");
  try {
    const { error } = validatePost(req.body);

    if (error) {
      logger.warn("Validation failed during user registration");
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { content, mediaIds } = req.body;

    const newPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newPost.save();
    await invalidatePostsCache(req, newPost._id.toString());

    logger.info("Post created successfully!");
    res.status(201).json({
      success: true,
      message: "Post created successfully",
    });
  } catch (e) {
    logger.error("Error creating the post", e);
    res.status(500).json({
      success: false,
      message: "Error creating the post!",
    });
  }
};

const getAllposts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNumberOfPosts = await Post.countDocuments();

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalNumberOfPosts / limit),
      totalPosts: totalNumberOfPosts,
    };

    //save your posts to cache
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    res.json(result);
  } catch (e) {
    logger.error("Error fetching all posts", e);
    res.status(500).json({
      success: false,
      message: "Error fetching all posts!",
    });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const cacheKey = `posts:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }

    const postById = await Post.findById(postId);
    if (!postById) {
      return res.status(404).json({
        success: false,
        message: "Error in fetching the post!",
      });
    }

    await req.redisClient.setex(cachedPost, 3600, JSON.stringify(postById));

    res.json(postById);
  } catch (e) {
    logger.error("Error fetching the post", e);
    res.status(500).json({
      success: false,
      message: "Error fetching the post!",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found!!!",
      });
    }

    await invalidatePostsCache(req, req.params.id);
    res.json({
      message: "Post deleted successfully!",
    });
  } catch (e) {
    logger.error("Error deleting the post", e);
    res.status(500).json({
      success: false,
      message: "Error deleting the post!",
    });
  }
};

module.exports = { createPost, getAllposts, getPost, deletePost };
