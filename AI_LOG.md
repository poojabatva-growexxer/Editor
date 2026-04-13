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
```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String     @id @default(uuid())
  email        String     @unique
  passwordHash String     @map("password_hash")
  createdAt    DateTime   @default(now()) @map("created_at")

  documents    Document[]

  @@map("users")
}

model Document {
  id          String   @id @default(uuid())
  title       String
  shareToken  String   @unique @default(uuid()) @map("share_token")
  isPublic    Boolean  @default(false) @map("is_public")
  updatedAt   DateTime @updatedAt @map("updated_at")

  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  blocks      Block[]

  @@index([userId])
  @@index([shareToken])
  @@map("documents")
}

model Block {
  id          String   @id @default(uuid())
  type        String
  content     Json
  orderIndex  Float    @map("order_index")
  createdAt   DateTime @default(now()) @map("created_at")

  documentId  String
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  parentId    String?
  parent      Block?   @relation("BlockChildren", fields: [parentId], references: [id])
  children    Block[]  @relation("BlockChildren")

  @@index([documentId])
  @@index([documentId, orderIndex])
  @@index([parentId])
  @@map("blocks")
}
```

**What was wrong or missing:**
- Nothing

**What I changed and why:**
- I used the generated schema as-is, no changes needed.
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