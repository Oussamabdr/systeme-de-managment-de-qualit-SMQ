const ApiError = require("../utils/apiError");
const { z } = require("zod");
const { formatZodErrors } = require("../utils/validation");

function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    const { fieldErrors, allErrors, summary } = formatZodErrors(err);
    return res.status(400).json({
      success: false,
      message: summary,
      fieldErrors,
      errors: allErrors,
    });
  }

  // Handle custom API errors
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}

module.exports = { notFound, errorHandler };
