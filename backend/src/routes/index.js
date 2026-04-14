import { Router } from "express";
import authRoutes from "./auth.routes.js";

const router = Router();

router.use("/auth", authRoutes);

// Add more resource routes here:
// router.use("/documents", documentRoutes);
// router.use("/blocks", blockRoutes);

export default router;