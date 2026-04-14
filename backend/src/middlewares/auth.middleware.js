import { verifyAccessToken } from "../utils/token.js";
import { sendError } from "../utils/response.js";

/**
 * Protects routes — attaches req.userId if the Bearer token is valid.
 */
export function requireAuth(req, res, next) {
  const token = req.cookies?.accessToken;
  if(!token){
    return sendError(res, "Access token is missing.", 401);
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload?.sub;
    next();
  } catch {
    return sendError(res, "Access token is invalid or expired.", 401);
  }
}