const Media = require("../models/Media");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const uploadMedia = async (req, res) => {
  logger.info("Uploading the media!!");

  try {
    if (!req.file) {
      logger.error("File not found!!");
      return res.status(400).json({
        success: false,
        message: "No file found!, Please try again!",
      });
    }

    const { orgName, mimeType, buffer } = req.file;
    const userId = req.user.userId;

    logger.info(`File Details:\n Name: ${orgName} ; Type : ${mimeType}`);
    logger.info("Uploading to Cloudinary!");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      `Cloudinary upload successfully. Public Id: ${cloudinaryUploadResult.public_id}`,
    );

    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: orgName,
      mimeType,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });
    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media upload is successfull",
    });
  } catch (error) {
    logger.error("Error while uploading the media!");
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

module.exports = { uploadMedia };
