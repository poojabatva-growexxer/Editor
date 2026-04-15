import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  listBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  splitBlock,
  moveBlock,
} from "../controllers/block.controller.js";

const router = Router({ mergeParams: true }); // inherits :documentId from parent

router.use(requireAuth);

// GET    /api/v1/documents/:documentId/blocks
router.get("/", listBlocks);

// POST   /api/v1/documents/:documentId/blocks
// Body: { type, content, orderIndex?, parentId? }
router.post("/", createBlock);

// PATCH  /api/v1/documents/:documentId/blocks/:blockId
// Body: any subset of { type, content, properties }
router.patch("/:blockId", updateBlock);

// DELETE /api/v1/documents/:documentId/blocks/:blockId
router.delete("/:blockId", deleteBlock);

// POST   /api/v1/documents/:documentId/blocks/:blockId/split
// Body: { beforeContent, afterContent }
// Splits one block into two — cursor mid-block action
router.post("/:blockId/split", splitBlock);

// PATCH  /api/v1/documents/:documentId/blocks/:blockId/move
// Body: { newPosition, newParentId? }
router.patch("/:blockId/move", moveBlock);

export default router;
