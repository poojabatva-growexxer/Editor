# Editor

A block-based document editor with real-time content management, public sharing, and a clean React frontend — inspired by Notion's block model.

**Live demo:** 
- https://editor-1-sgyp.onrender.com
> **Note:** Your free instance will spin down with inactivity, which can delay requests by 50 seconds or more.

---

## Table of Contents

1. [Setup Instructions](#1-setup-instructions)
2. [Environment Variables](#2-environment-variables)
3. [Architecture Decisions](#3-architecture-decisions)
4. [Known Issues](#4-known-issues)
5. [Edge Case Decisions](#5-edge-case-decisions)

---

## 1. Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL (local or remote)
- npm or yarn

### Clone the repo

```bash
git clone https://github.com/poojabatva-growexxer/Editor.git
cd Editor
```

### Backend

```bash
cd backend
cp ../.env.example .env
# Fill in .env
npm install
npx prisma migrate dev
npm run dev
```

The backend will start on the port defined in your `.env` (default: `8080`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server typically runs on `http://localhost:5173` (Vite default).

### Running both together (without Docker)

Open two terminals and run the backend and frontend steps above in parallel. Make sure the frontend's API base URL points to `http://localhost:<PORT>/api/v1`.

> **Note:** There is no `docker-compose.yml` in this project. If you prefer Docker, you can run PostgreSQL via `docker run --name pg -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres` and point `DATABASE_URL` at it.

---

## 2. Environment Variables

Reference: `.env.example`

```
PORT=
DATABASE_URL=
JWT_REFRESH_EXPIRES_DAYS=
JWT_ACCESS_EXPIRES_IN=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLIENT_ORIGIN=
VITE_API_URL=
```

| Variable       | Description                                                                                     |
|----------------|-------------------------------------------------------------------------------------------------|
| `PORT`         | The port the Express backend server listens on. Example: `8080`.                               |
| `DATABASE_URL` | Full PostgreSQL connection string used by Prisma. Example: `postgresql://user:pass@localhost:5432/editor`. |
| `JWT_ACCESS_SECRET` | JWT access token secret. Example: `your-access-secret`. |
| `JWT_REFRESH_SECRET` | JWT refresh token secret. Example: `your-refresh-secret`. |
| `JWT_ACCESS_EXPIRES_IN` | JWT access token expiry time. Example: `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | JWT refresh token expiry time. Example: `7d`. |

> JWT secrets and any other runtime config are currently hardcoded or not yet externalised — see [Known Issues](#4-known-issues).

---

## 3. Architecture Decisions

### Stack

| Layer     | Choice                   | Reason                                                                                          |
|-----------|--------------------------|-------------------------------------------------------------------------------------------------|
| Backend   | Node.js + Express        | Lightweight, widely understood, fast to prototype REST APIs with.                               |
| ORM       | Prisma + PostgreSQL      | Prisma's type-safe client and migration tooling made it straightforward to model the block/document hierarchy. PostgreSQL's JSON column support handles block `content` cleanly. |
| Auth      | JWT (access + refresh)   | Stateless auth suits a single-page app. Tokens are stored in **cookies** (not Authorization headers) for improved security against XSS attacks. |
| Frontend  | React + Tailwind CSS v4  | React's component model maps naturally to the block tree. Tailwind v4 was chosen for utility-first styling without a heavy design system. |
| Deployment | Render        | Instant deployment for Vite/React and backend apps with Render.                                                     |

### Block ordering with Float `orderIndex`

Rather than using integer positions (which require renumbering every sibling on a reorder), `orderIndex` is stored as a `FLOAT`. When a block is moved, its new index is set to the **average of its new neighbours** — no other rows need to be updated. Edge cases:

- No previous sibling: `newIndex = nextSibling.orderIndex - 1.0`
- No next sibling: `newIndex = prevSibling.orderIndex + 1.0` 

### Document sharing

Documents carry a `shareToken` (UUID) and an `isPublic` boolean. The public read-only endpoint `GET /share/:token` requires neither authentication nor knowledge of the document ID, making links shareable without exposing internal IDs.

### Cookie-based tokens

The initial AI-generated code used the `Authorization` header for JWTs. This was changed to **httpOnly cookies** to reduce the risk of token theft via XSS in the browser.

---

## 4. Known Issues

- **Come with previous properties**
when we enter from para or heading previous properties apply on next block.
- **No email verification:** Registration accepts any well-formed email address without sending a confirmation. A custom `utils/email.js` validates format only.
- **Float precision drift:** The midpoint strategy for `orderIndex` will eventually produce values too close together to distinguish (after many repeated splits/reorders in the same position). No re-normalisation step exists yet.
- **No rate limiting or input sanitisation on block `content`:** The `content` field accepts arbitrary JSON with no schema enforcement at the API layer.
- **Refresh token blacklisting is in-memory only:** On server restart, all blacklisted tokens are cleared and previously logged-out tokens become valid again.

---

## 5. Edge Case Decisions

**Mid-block Enter (split):** When the user presses Enter mid-block, the block is split into two at the cursor; the new block receives `orderIndex = original.orderIndex + avg(original.orderIndex, nextSibling.orderIndex)` — specifically the average of the original and its next sibling — so insertion never collides with an existing index.

**Block at the start of the list (no previous sibling):** The new block's `orderIndex` is set to `nextSibling.orderIndex - 1.0`, placing it before the current first block without requiring any other row to change.

**Block appended at the end (no next sibling):** The new block's `orderIndex` is `prevSibling.orderIndex + 1.0`, giving it a clean integer step that is always greater than every existing index.

**Float precision exhaustion:** No explicit handling exists yet; this is acknowledged as a known issue and a re-normalisation pass (resetting all `orderIndex` values to integers) would be needed if it manifests.

**Cross-account document access:** Every document-scoped endpoint verifies that the authenticated user's `id` matches the document's `user_id` before performing any read or write operation; a mismatch returns a `403 Forbidden`.

**Public share token:** If `isPublic` is `false` or the `shareToken` does not exist in the database, the `GET /share/:token` endpoint returns `404` — it does not leak whether the document exists.

**Block type validation:** Only the seven defined types (`paragraph`, `heading_1`, `heading_2`, `divider`, `code`, `image`, `to_do`) are accepted; any other value is rejected with a `400` at the controller level, defaulting to `paragraph` when the type field is omitted entirely.

**Concurrent reorder collisions:** Last-write-wins; there is no optimistic locking. Concurrent edits from two sessions can overwrite each other silently.