const SearchPost = require("../models/Search");
const logger = require("../utils/logger");

const searchedPostController = async (req, res) => {
  logger.info("Handling search request with query");

  try {
    const { query } = req.query;

    const results = await SearchPost.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    res.json(results);
  } catch (e) {
    logger.error("Error occured while searching post!", e);
    res.status(500).json({
      success: false,
      message: "Error while searching the post!",
    });
  }
};

module.exports = { searchedPostController };
