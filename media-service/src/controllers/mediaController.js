const Media = require("../models/Media");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const uploadMedia = async (req, res) => {
  logger.info("Uploading the media!!");

  try {
    // console.log(req.file);
    if (!req.file) {
      logger.error("File not found!!");
      return res.status(400).json({
        success: false,
        message: "No file found!, Please try again!",
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    logger.info("Uploading to Cloudinary!");
    logger.info(`File Details:\n Name: ${originalname} ; Type : ${mimetype}`);

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      `Cloudinary upload successfully. Public Id: ${cloudinaryUploadResult.public_id}`,
    );

    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });
    await newlyCreatedMedia.save();
    // console.log(cloudinaryUploadResult)

    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media upload is successfull",
    });
  } catch (error) {
    logger.error("Error while uploading the media!", error);
    res.status(500).json({
      success: false,
      message: "Error while uploading the media!",
    });
  }
};

const getAllMedias = async (req, res) => {
  try {
    const result = await Media.find({ userId: req.user.userId });

    if (result.length === 0) {
      logger.info("No media found for the user!");
      return res.status(404).json({
        success: false,
        message: "No media found for the user!",
      });
    }

    res.json({ result });
  } catch (error) {
    logger.error("Error while fetching the media!", error);
    res.status(500).json({
      success: false,
      message: "Error while fetching the media!",
    });
  }
};

module.exports = { uploadMedia, getAllMedias };
