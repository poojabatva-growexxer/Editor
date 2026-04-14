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