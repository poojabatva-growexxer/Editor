import { prisma } from "../../lib/prisma.js";
import {
  validatePassword,
  hashPassword,
  comparePassword,
} from "../utils/password.js";
import {
  signAccessToken,
  generateRefreshToken,
  refreshTokenExpiresAt,
} from "../utils/token.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { validateEmail } from "../utils/email.js";

// ── helpers ────────────────────────────────────────────────────────────────

async function issueTokenPair(userId) {
  const accessToken = signAccessToken(userId);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: refreshTokenExpiresAt(),
    },
  });

  return { accessToken, refreshToken };
}

// Define cookie options once, reuse for all auth-related cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

// ── register ───────────────────────────────────────────────────────────────

export async function register(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required.", 400);
    }

    validateEmail(email); // throws 400 if invalid
    validatePassword(password); // throws 400 if invalid

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, "Email already in use.", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    const tokens = await issueTokenPair(user.id);

    res.cookie("refreshToken", tokens.refreshToken, cookieOptions);
    res.cookie("accessToken", tokens.accessToken, cookieOptions);

    return sendSuccess(res, { user }, 201);
  } catch (err) {
    next(err);
  }
}

// ── login ──────────────────────────────────────────────────────────────────

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required.", 400);
    }

    validateEmail(email); // throws 400 if invalid

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user && (await comparePassword(password, user.passwordHash));

    // Generic message — never leak whether email exists
    if (!valid) {
      return sendError(res, "Invalid email or password.", 401);
    }

    const tokens = await issueTokenPair(user.id);

    res.cookie("refreshToken", tokens.refreshToken, cookieOptions);
    res.cookie("accessToken", tokens.accessToken, cookieOptions);

    return sendSuccess(
      res,
      {
        user: { id: user.id, email: user.email, createdAt: user.createdAt },
      },
      200,
    );
  } catch (err) {
    next(err);
  }
}

// ── refresh ────────────────────────────────────────────────────────────────

export async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return sendError(res, "Refresh token is required.", 400);
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored) {
      return sendError(res, "Invalid refresh token.", 401);
    }

    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
      return sendError(res, "Refresh token expired. Please log in again.", 401);
    }

    // Rotate: delete old token, issue a fresh pair
    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const tokens = await issueTokenPair(stored.userId);

    res.cookie("refreshToken", tokens.refreshToken, cookieOptions);
    res.cookie("accessToken", tokens.accessToken, cookieOptions);

    return sendSuccess(res, null, 200);
  } catch (err) {
    next(err);
  }
}

// ── logout ─────────────────────────────────────────────────────────────────

export async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.clearCookie("refreshToken", cookieOptions);
    res.clearCookie("accessToken", cookieOptions);
    return sendSuccess(res, null, 200);
  } catch (err) {
    next(err);
  }
}
