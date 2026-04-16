Create a file called AI_LOG.md in your repo root.
For every significant AI interaction, write an entry:

## 2026-04-13

**Tool:** Claude

**What I asked for:**

- give me prisma orm postgres schema for Data Model
  user id, email, password_hash, created_at
  document id, user_id, title, share_token, is_public, updated_at
  block id, document_id, type, content (JSON), order_index (FLOAT), parent_id, created_at
  this data model.

**What it generated:**

- prisma/schema.prisma file

**What was wrong or missing:**

- Nothing

**What I changed and why:**

- I used the generated schema as-is, no changes needed.

## 2026-04-14

**Tool:** Claude

**What I asked for:**

- You need to implement auth feature
  Register with email + password (min 8 chars, at least 1 number)
  Login, JWT with refresh token

**What it generated:**

- controllers/auth.controller.js
- middlewares/auth.middleware.js
- middlewares/error.middleware.js
- routes/auth.routes.js
- routes/index.js
- utils/password.js
- utils/response.js
- utils/token.js

**What was wrong or missing:**

- it uses authorization header for token which is less secure.
- no email validation

**What I changed and why:**

- instead of authorization header I use cookie for more security
- add utils/email.js for email formate validation

## 2026-04-15

**Tool:** Copilot

**What I asked for:**

- I want to make block apis like we can create block (types allowed only "paragraph",
  "heading_1",
  "heading_2",
  "divider",
  "code",
  "image",
  "to_do",) default is paragraph , read update and delete . I also want to split block and reorder block but keep in mind that we have orderIndex as Float so if any reorder occures no need to change every just change its to avg of before and after. but if befor not exist than take after/2 and if its at last than befor\*0.5

**What it generated:**

- src/block.controller.js
- src/block.routes.js

**What was wrong or missing:**

- in split after orderIndex

**What I changed and why:**

- i change afterblock orderIndex so any index not repeat first its just +0.5 but i add avg(nextSibling.orderIndex,original.orderIndex)

## 2026-04-16

**Tool:** Claude + Copilot + codex 

**What I asked for:**
- ### **General Setup**
- **Base URL**: `http://localhost:8080/api/v1` (adjust for production)
- **Authentication**: JWT 
- **Content-Type**: `application/json` for requests
- **CORS**: Enabled for frontend origin
- **Errors**: Standard JSON `{ success: false, error: "message" }` with HTTP status codes
- **Tokens**: Store `accessToken` in cookies; use `refreshToken` for renewal
- **Block Types**: `"paragraph"`, `"heading_1"`, `"heading_2"`, `"divider"`, `"code"`, `"image"`, `"to_do"`
- **Content Format**: JSON object (e.g., `{ text: "..." }` for text, `{ url: "...", alt: "..." }` for images)

---

### **Authentication Endpoints**

#### **POST /auth/register**
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepass"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "email": "user@example.com" },
      "tokens": {
        "accessToken": "jwt...",
        "refreshToken": "jwt..."
      }
    }
  }
  ```
- **Errors**: 400 (invalid data), 409 (email exists)

#### **POST /auth/login**
- **Auth Required**: No
- **Request Body**: Same as register
- **Response**: Same as register
- **Errors**: 401 (invalid credentials)

#### **POST /auth/refresh**
- **Auth Required**: No (send refreshToken)
- **Request Body**:
  ```json
  { "refreshToken": "jwt..." }
  ```
- **Response**: New tokens object
- **Errors**: 401 (invalid token)

#### **POST /auth/logout**
- **Auth Required**: Yes
- **Request Body**: None (blacklists refreshToken)
- **Response**: `{ success: true }`

---

### **Document Endpoints**

#### **GET /documents**
- **Auth Required**: Yes
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "documents": [
        {
          "id": "uuid",
          "title": "My Doc",
          "isPublic": false,
          "updatedAt": "2026-04-15T..."
        }
      ]
    }
  }
  ```

#### **POST /documents**
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "title": "New Document" }
  ```
- **Response**: Document object (same as list item)

#### **PATCH /documents/:id**
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "title": "Updated Title" }
  ```
- **Response**: Updated document object

#### **PATCH /documents/:id/share**
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "isPublic": true }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "document": {
        "id": "uuid",
        "title": "...",
        "isPublic": true,
        "shareToken": "uuid-for-link"
      }
    }
  }
  ```
- **Notes**: Use `shareToken` to build public link: `/share/:token`

#### **DELETE /documents/:id**
- **Auth Required**: Yes
- **Response**: `{ success: true }`

---

### **Block Endpoints**

#### **GET /documents/:documentId/blocks**
- **Auth Required**: Yes
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "blocks": [
        {
          "id": "uuid",
          "type": "paragraph",
          "content": { "text": "Hello" },
          "orderIndex": 1.0,
          "parentId": null
        }
      ]
    }
  }
  ```
- **Notes**: Blocks ordered by `orderIndex` (Float). Supports hierarchy via `parentId`.

#### **POST /documents/:documentId/blocks**
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "type": "paragraph",
    "content": { "text": "" },
    "orderIndex": 2.5,  // Optional, defaults to max + 1
    "parentId": null    // Optional
  }
  ```
- **Response**: Created block object
- **Notes**: `orderIndex` is Float; client can calculate or let server default.

#### **PATCH /documents/:documentId/blocks/:blockId**
- **Auth Required**: Yes
- **Request Body**: Partial update (e.g., `{ "content": { "text": "Updated" } }`)
- **Response**: Updated block object

#### **DELETE /documents/:documentId/blocks/:blockId**
- **Auth Required**: Yes
- **Response**: `{ success: true, data: { deleted: "uuid" } }`

#### **POST /documents/:documentId/blocks/:blockId/split**
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "beforeContent": { "text": "First part" },
    "afterContent": { "text": "Second part" }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "original": { ... },
      "created": { ... }
    }
  }
  ```
- **Notes**: New block gets `orderIndex = original + 0.5`

#### **PATCH /documents/:documentId/blocks/:blockId/move**
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "newPosition": 2,  // 1-based index within parent
    "newParentId": "uuid"  // Optional
  }
  ```
- **Response**: Updated block object
- **Notes**: Server calculates `orderIndex` as average of prev/next siblings.

---

### **Public Share Endpoint**

#### **GET /share/:token**
- **Auth Required**: No
- **Response**: Same as GET /documents/:id/blocks but read-only
- **Errors**: 404 if invalid token or sharing disabled

- use this endpoint and generate editor frontend in React + Tailwind^4

**What it generated:**
- it generate whole frontend 

**What was wrong or missing:**
- style

**What I changed and why:**
- dark/light mode not working . there are some style flows. change css

## YYYY-MM-DD

**Tool:** Claude / Copilot / Cursor / ChatGPT / other

**What I asked for:**
...

**What it generated:**
...

**What was wrong or missing:**
...

**What I changed and why:**
...
Minimum: one entry per working day.
Required entries:
• How you implemented Enter mid-block split — what AI gave you, what broke, what you fixed
• How you handled the order_index — did AI use integers first? What did you change?
• How you protected against cross-account document access
• Every time you chose to write code manually instead of using AI — explain why
