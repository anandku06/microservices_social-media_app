const SearchPost = require("../models/Search");
const logger = require("../utils/logger");

async function handlePostCreated(eventData) {
  try {
    const newSearchPost = new SearchPost({
      postId: eventData.postId,
      userId: eventData.userId,
      content: eventData.content,
      createdAt: eventData.createdAt,
    });

    await newSearchPost.save();

    logger.info(
      `Search post created! ${eventData.postId} and ${newSearchPost._id.toString()}`,
    );
  } catch (error) {
    logger.error("Error in Post creation event", error);
  }
}

module.exports = handlePostCreated;
