import { Router } from "express";
import authRoutes from "./auth.routes.js";
import documentRoutes from "./document.routes.js";
import blockRoutes from "./block.routes.js"

const router = Router();

router.use("/auth", authRoutes);
router.use("/documents", documentRoutes);
router.use("/documents/:documentId/blocks", blockRoutes);

export default router;
