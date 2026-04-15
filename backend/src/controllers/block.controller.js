import { prisma } from "../../lib/prisma.js";
import { sendSuccess, sendError } from "../utils/response.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verifies the document exists and belongs to the requesting user.
 * Returns the document or null.
 */
async function getOwnedDocument(documentId, userId) {
  return prisma.document.findFirst({
    where: { id: documentId, userId },
  });
}

/**
 * Fetch a single block that belongs to a given document.
 */
async function getOwnedBlock(blockId, documentId) {
  return prisma.block.findFirst({
    where: { id: blockId, documentId },
  });
}

// ─── BLOCK_TYPES whitelist ────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set([
  "paragraph",
  "heading_1",
  "heading_2",
  "divider",
  "code",
  "image",
  "to_do",
]);

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /documents/:documentId/blocks
 * Returns all blocks for a document, ordered by `orderIndex`.
 */
export async function listBlocks(req, res, next) {
  try {
    const documentId = req.params.documentId?.trim();
    const doc = await getOwnedDocument(documentId, req.userId);
    if (!doc) return sendError(res, "Document not found.", 404);

    const blocks = await prisma.block.findMany({
      where: { documentId },
      orderBy: { orderIndex: "asc" },
    });

    return sendSuccess(res, blocks);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /documents/:documentId/blocks
 * Creates a new block.
 *
 * Body:
 *   type       {string}  — block type (defaults to "paragraph")
 *   content    {string}  — raw text/HTML content (defaults to "")
 *   orderIndex {number}  — order index (optional, defaults to last + 1)
 *   parentId   {string}  — parent block ID (optional, null for root)
 *
 * Editor behaviour covered:
 *   • Enter at end of block  → frontend sends orderIndex = last + 1
 *   • Slash command result   → frontend sends chosen type + orderIndex
 */
export async function createBlock(req, res, next) {
  try {
    const documentId = req.params.documentId?.trim();
    const {
      type = "paragraph",
      content = "",
      orderIndex,
      parentId = null,
    } = req.body;

    const doc = await getOwnedDocument(documentId, req.userId);
    if (!doc) return sendError(res, "Document not found.", 404);

    if (!ALLOWED_TYPES.has(type)) {
      return sendError(res, `Invalid block type: "${type}".`, 422);
    }

    if (parentId) {
      const parent = await getOwnedBlock(parentId, documentId);
      if (!parent) return sendError(res, "Parent block not found.", 404);
    }

    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined) {
      // Get the max orderIndex in the parent
      const maxOrder = await prisma.block.findFirst({
        where: { documentId, parentId },
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
      });
      finalOrderIndex = maxOrder ? maxOrder.orderIndex + 1 : 1;
    }

    const block = await prisma.block.create({
      data: {
        documentId,
        type,
        content,
        orderIndex: finalOrderIndex,
        parentId,
      },
    });

    return sendSuccess(res, block, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /documents/:documentId/blocks/:blockId
 * Partial update — only provided fields are changed.
 *
 * Body (all optional):
 *   type       {string}
 *   content    {string}
 *   properties {object}
 *
 * Editor behaviour covered:
 *   • Typing updates content in real-time (debounced from frontend)
 *   • Slash command changes type of existing block
 *   • Backspace at start of non-empty block → frontend may send type:"paragraph"
 */
export async function updateBlock(req, res, next) {
  try {
    const documentId = req.params.documentId?.trim();
    const blockId = req.params.blockId?.trim();
    const doc = await getOwnedDocument(documentId, req.userId);
    if (!doc) return sendError(res, "Document not found.", 404);

    const block = await getOwnedBlock(blockId, documentId);
    if (!block) return sendError(res, "Block not found.", 404);

    const { type, content } = req.body;

    if (type !== undefined && !ALLOWED_TYPES.has(type)) {
      return sendError(res, `Invalid block type: "${type}".`, 422);
    }

    const updated = await prisma.block.update({
      where: { id: blockId },
      data: {
        ...(type !== undefined && { type }),
        ...(content !== undefined && { content }),
      },
    });

    return sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /documents/:documentId/blocks/:blockId
 * Deletes a block.
 *
 * Editor behaviour covered:
 *   • Backspace at start of an EMPTY block → delete block,
 *     frontend moves cursor to end of previous block.
 */
export async function deleteBlock(req, res, next) {
  try {
    const documentId = req.params.documentId?.trim();
    const blockId = req.params.blockId?.trim();

    const doc = await getOwnedDocument(documentId, req.userId);
    if (!doc) return sendError(res, "Document not found.", 404);

    const block = await getOwnedBlock(blockId, documentId);
    if (!block) return sendError(res, "Block not found.", 404);

    await prisma.block.delete({ where: { id: blockId } });

    return sendSuccess(res, { deleted: blockId });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /documents/:documentId/blocks/:blockId/split
 * Splits one block into two at the cursor position.
 *
 * Body:
 *   beforeContent {string} — text that stays in the original block
 *   afterContent  {string} — text that goes into the newly created block
 *
 * Editor behaviour covered:
 *   • Enter mid-block → zero text lost, cursor lands at start of new block.
 *
 * Returns: { original: Block, created: Block }
 */
export async function splitBlock(req, res, next) {
  try {
    const documentId = req.params.documentId?.trim();
    const blockId = req.params.blockId?.trim();

    const { beforeContent = "", afterContent = "" } = req.body;

    const doc = await getOwnedDocument(documentId, req.userId);
    if (!doc) return sendError(res, "Document not found.", 404);

    const block = await getOwnedBlock(blockId, documentId);
    if (!block) return sendError(res, "Block not found.", 404);

    const [original] = await prisma.$transaction([
      // Keep original block, update its content to the "before" slice
      prisma.block.update({
        where: { id: blockId },
        data: { content: beforeContent },
      }),
    ]);

    // Create the new block
    // Find next sibling
    const nextSibling = await prisma.block.findFirst({
      where: {
        documentId,
        parentId: block.parentId,
        orderIndex: { gt: block.orderIndex },
      },
      orderBy: { orderIndex: "asc" },
      select: { orderIndex: true },
    });

    const newOrderIndex = nextSibling
      ? (block.orderIndex + nextSibling.orderIndex) / 2
      : block.orderIndex + 1;

    const createdBlock = await prisma.block.create({
      data: {
        documentId,
        // New block inherits the same type so heading stays heading etc.
        type: block.type,
        content: afterContent,
        orderIndex: newOrderIndex,
        parentId: block.parentId,
      },
    });

    return sendSuccess(res, { original, created: createdBlock }, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /documents/:documentId/blocks/:blockId/move
 * Moves a block to a new position within a new parent.
 *
 * Body:
 *   newPosition {number} — 1-based index within the new parent
 *   newParentId {string} — new parent block ID (optional, defaults to current)
 *
 * Editor behaviour covered:
 *   • Drag-and-drop reordering of blocks.
 */
export async function moveBlock(req, res, next) {
  try {
    const documentId = req.params.documentId?.trim();
    const blockId    = req.params.blockId?.trim();
    const { newPosition, newParentId } = req.body;

    if (typeof newPosition !== "number" || newPosition < 1) {
      return sendError(res, "newPosition must be a number >= 1.", 422);
    }

    const doc = await getOwnedDocument(documentId, req.userId);
    if (!doc) return sendError(res, "Document not found.", 404);

    const block = await getOwnedBlock(blockId, documentId);
    if (!block) return sendError(res, "Block not found.", 404);

    const targetParentId =
      newParentId !== undefined ? newParentId : block.parentId;

    if (targetParentId && targetParentId !== block.parentId) {
      const parent = await getOwnedBlock(targetParentId, documentId);
      if (!parent) return sendError(res, "Target parent block not found.", 404);
    }

    // Exclude the block itself — its current position must not affect the midpoint
    const siblings = await prisma.block.findMany({
      where: {
        documentId,
        parentId: targetParentId,
        id: { not: blockId },           // <-- fix: exclude self
      },
      orderBy: { orderIndex: "asc" },
    });

    // index is the slot we're inserting INTO (0-based)
    // newPosition=1 → insert before siblings[0]  → index=0
    // newPosition=2 → insert between [0] and [1] → index=1
    const index = newPosition - 1;

    const prevSibling = siblings[index - 1];  // undefined when inserting at head
    const nextSibling = siblings[index];      // undefined when inserting at tail

    let orderIndex;

    if (prevSibling !== undefined && nextSibling !== undefined) {
      // Middle: true fractional index between the two neighbours
      orderIndex = (prevSibling.orderIndex + nextSibling.orderIndex) / 2;

    } else if (prevSibling === undefined && nextSibling !== undefined) {
      // Head: place before the first sibling
      orderIndex = nextSibling.orderIndex - 1;

    } else if (prevSibling !== undefined && nextSibling === undefined) {
      // Tail: place after the last sibling
      orderIndex = prevSibling.orderIndex + 1;

    } else {
      // No siblings at all (or moving into an empty parent)
      orderIndex = 1;
    }

    const updated = await prisma.block.update({
      where: { id: blockId },
      data:  { parentId: targetParentId, orderIndex },
    });

    return sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}