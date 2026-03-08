const Media = require("../models/Media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const handlePostDeleted = async (event) => {
  console.log("Received post.deleted event in Media Service:", event);

  const { postId, mediaIds } = event;

  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });
    if (mediaToDelete.length > 0) {
      for (const media of mediaToDelete) {
        // delete media from Cloudinary
        await deleteMediaFromCloudinary(media.publicId);

        // delete media document from MongoDB
        await Media.findByIdAndDelete(media._id);

        logger.info(
          `Deleted media with ID ${media._id} associated with deleted post ${postId}`,
        );
      }
    }

    logger.info(
      `Finished processing post.deleted event for post ${postId}. Deleted ${mediaToDelete.length} media items.`,
    );
  } catch (e) {
    logger.error("Error fetching media for the deleted post", e);
  }
};

module.exports = { handlePostDeleted };
