const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const { generateTokens } = require("../utils/generateToken");
const logger = require("../utils/logger");
const { validateRegistration, validateLogin } = require("../utils/validation");

const registerUser = async (req, res) => {
  logger.info("Registering new user");

  // Registration logic here
  try {
    const { error } = validateRegistration(req.body);

    if (error) {
      logger.warn("Validation failed during user registration");
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { username, email, password } = req.body;

    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      logger.warn("User already exists");
      return res
        .status(409)
        .json({ success: false, message: "Username or email already in use" });
    }

    user = new User({ username, email, password });
    await user.save();
    logger.warn("User registered successfully", user._id);

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      refreshToken,
      accessToken,
    });
  } catch (e) {
    logger.error("Error during user registration", e);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// login user
const loginUser = async (req, res) => {
  logger.info("Logging in user");

  try {
    const { error } = validateLogin(req.body);

    if (error) {
      logger.warn("Validation failed during user login");
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      logger.warn("Invalid email or password");
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      refreshToken,
      accessToken,
    });
  } catch (e) {
    logger.error("Error during user login", e);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// generate tokens for user
const generateUserTokens = async (req, res) => {
  logger.info("Generating tokens for user");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token not provided");
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required" });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    // Token not found or expired
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid refresh token");
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const user = await User.findById(storedToken.user);
    if (!user) {
      logger.warn("User not found for the provided refresh token");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);

    // delete old refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Error during token generation", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const logoutUser = async (req, res) => {
  logger.info("Logging out user");

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn("Refresh token not provided for logout");
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required" });
    }

    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("User logged out successfully");

    res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    logger.error("Error during logout", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  generateUserTokens,
  logoutUser,
};
