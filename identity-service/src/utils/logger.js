const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  // formatting the log output
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(), // for string interpolation, allows using %d, %s in logs
    winston.format.json()
  ),
  // identify the service name for easier log tracing
  defaultMeta: { service: "identity-service" },
  // define log output destinations
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // log errors to a separate file
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
}); // Create a logger instance


module.exports = logger; // Export the logger