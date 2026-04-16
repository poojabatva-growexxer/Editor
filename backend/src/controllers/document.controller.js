import { prisma } from "../../lib/prisma.js";
import { sendSuccess, sendError } from "../utils/response.js";

// ── List all documents for the logged-in user ──────────────────────────────

export async function listDocuments(req, res, next) {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: req.userId },
      select: { id: true, title: true, isPublic: true, shareToken: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    return sendSuccess(res, { documents });
  } catch (err) {
    next(err);
  }
}

// ── Create a new document ──────────────────────────────────────────────────

export async function createDocument(req, res, next) {
  try {
    const { title = "Untitled" } = req.body;

    if (typeof title !== "string" || title.trim().length === 0) {
      return sendError(res, "Title must be a non-empty string.", 400);
    }

    const document = await prisma.document.create({
      data: {
        title: title.trim(),
        userId: req.userId,
      },
      select: { id: true, title: true, isPublic: true, updatedAt: true },
    });

    return sendSuccess(res, { document }, 201);
  } catch (err) {
    next(err);
  }
}

// ── Rename a document ──────────────────────────────────────────────────────

export async function renameDocument(req, res, next) {
  try {
    const id = req.params.id?.trim();
    const { title } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return sendError(res, "Title must be a non-empty string.", 400);
    }

    // Verify ownership
    const existing = await prisma.document.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return sendError(res, "Document not found.", 404);
    }

    const document = await prisma.document.update({
      where: { id },
      data: { title: title.trim() },
      select: { id: true, title: true, isPublic: true, updatedAt: true },
    });

    return sendSuccess(res, { document });
  } catch (err) {
    next(err);
  }
}

// ── Delete a document ──────────────────────────────────────────────────────

export async function deleteDocument(req, res, next) {
  try {
    const id = req.params.id?.trim();

    const existing = await prisma.document.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return sendError(res, "Document not found.", 404);
    }

    await prisma.document.delete({ where: { id } });

    return sendSuccess(res, null, 201);
  } catch (err) {
    next(err);
  }
}

// ── Toggle document sharing ────────────────────────────────────────────────

export async function toggleDocumentSharing(req, res, next) {
  try {
    const id = req.params.id?.trim();
    const { isPublic } = req.body;

    if (typeof isPublic !== "boolean") {
      return sendError(res, "isPublic must be a boolean.", 400);
    }

    // Verify ownership
    const existing = await prisma.document.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return sendError(res, "Document not found.", 404);
    }

    const document = await prisma.document.update({
      where: { id },
      data: { isPublic },
      select: {
        id: true,
        title: true,
        isPublic: true,
        shareToken: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, { document });
  } catch (err) {
    next(err);
  }
}

// ── Get shared document (public) ───────────────────────────────────────────

export async function getSharedDocument(req, res, next) {
  try {
    const token = req.params.token?.trim();

    if (!token) {
      return sendError(res, "Share token is required.", 400);
    }

    const document = await prisma.document.findFirst({
      where: { shareToken: token, isPublic: true },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        blocks: {
          select: {
            id: true,
            type: true,
            content: true,
            orderIndex: true,
            parentId: true,
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!document) {
      return sendError(
        res,
        "Shared document not found or sharing disabled.",
        404,
      );
    }

    return sendSuccess(res, { document });
  } catch (err) {
    next(err);
  }
}
