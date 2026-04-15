import { Router } from "express";
import authRoutes from "./auth.routes.js";
import documentRoutes from "./document.routes.js";
import blockRoutes from "./block.routes.js";
import { getSharedDocument } from "../controllers/document.controller.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/documents", documentRoutes);
router.use("/documents/:documentId/blocks", blockRoutes);

// Public share route (no auth required)
router.get("/share/:token", getSharedDocument);

export default router;
