import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/auth.controller.js";

const router = Router();

// POST /auth/register  — create account, returns tokens
router.post("/register", register);

// POST /auth/login     — verify credentials, returns tokens
router.post("/login", login);

// POST /auth/refresh   — rotate refresh token, returns new token pair
router.post("/refresh", refresh);

// POST /auth/logout    — revoke refresh token
router.post("/logout", logout);

export default router;