/**
 * Sends a success JSON response.
 */
export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

/**
 * Sends an error JSON response.
 */
export function sendError(res, message, statusCode = 500) {
  return res.status(statusCode).json({ success: false, error: message });
}
