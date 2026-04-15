import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  listDocuments,
  createDocument,
  renameDocument,
  deleteDocument,
  toggleDocumentSharing,
} from "../controllers/document.controller.js";

const router = Router();

// All document routes require auth
router.use(requireAuth);

// GET    /documents        → list all user's documents
router.get("/", listDocuments);

// POST   /documents        → create new document
router.post("/", createDocument);

// PATCH  /documents/:id    → rename document
router.patch("/:id", renameDocument);

// PATCH  /documents/:id/share → toggle sharing
router.patch("/:id/share", toggleDocumentSharing);

// DELETE /documents/:id    → delete document
router.delete("/:id", deleteDocument);

export default router;