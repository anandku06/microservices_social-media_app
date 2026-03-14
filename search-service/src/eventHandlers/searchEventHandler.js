const SearchPost = require("../models/Search");
const logger = require("../utils/logger");

const invalidateSearchCache = async () => {
  const keys = await SearchPost.redisClient.keys("search:*");
  if (keys.length > 0) {
    await SearchPost.redisClient.del(keys);
    logger.info("Search cache invalidated!");
  }
};

async function handlePostCreated(eventData) {
  try {
    const newSearchPost = new SearchPost({
      postId: eventData.postId,
      userId: eventData.userId,
      content: eventData.content,
      createdAt: eventData.createdAt,
    });

    await newSearchPost.save();
    await invalidateSearchCache();

    logger.info(
      `Search post created! ${eventData.postId} and ${newSearchPost._id.toString()}`,
    );
  } catch (error) {
    logger.error("Error in Post creation event", error);
  }
}

async function handlePostDeleted(eventData) {
  try {
    await SearchPost.findOneAndDelete({ postId: eventData.postId });
    await invalidateSearchCache();
    logger.info(`Search post deleted! ${eventData.postId}`);
  } catch (error) {
    logger.error("Error in Post deletion event", error);
  }
}

module.exports = { handlePostCreated, handlePostDeleted };
