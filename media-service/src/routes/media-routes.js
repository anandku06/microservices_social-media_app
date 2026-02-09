const express = require("express");
const multer = require("multer");
const logger = require("../utils/logger");
const { authenticateRequest } = require("../middlewares/authMiddleware");
const { uploadMedia } = require("../controllers/mediaController");

const router = express.Router();

// configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error("Multer error while uploading", err);
        return res.status(400).json({
          message: "Multer error",
          error: err.message,
          stack: err.stack,
        });
      } else if (err) {
        logger.error("Unknown error while uploading", err);
        return res.status(500).json({
          message: "Unknown error",
          error: err.message,
          stack: err.stack,
        });
      }

      if (!req.file) {
        logger.error("File not found!", err);
        return res.status(404).json({
          message: "File not found",
        });
      }

      next();
    });
  },
  uploadMedia,
);

module.exports = router;
