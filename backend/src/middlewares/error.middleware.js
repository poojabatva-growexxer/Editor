/**
 * Global error handler — must be registered last in app.js.
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error."
      : err.message || "Internal server error.";

  console.error(`[${new Date().toISOString()}] ${statusCode} — ${err.message}`);

  res.status(statusCode).json({ success: false, error: message });
}