# PostgreSQL Database Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a PostgreSQL 16 development database, Prisma 7 data layer, strict Zod request schemas, deterministic fixture seeding, and database integration tests to the existing Fastify application.

**Architecture:** Use Prisma 7's `prisma-client` generator with a single `pg.Pool` and `PrismaPg` adapter exported from `server/db/client.js`. Register one Fastify `onClose` hook for Prisma and pool cleanup, keep request validation as standalone strict schemas, and seed normalized fixture records with ordered idempotent upserts.

**Tech Stack:** PostgreSQL 16, Prisma 7.9.1, `@prisma/adapter-pg` 7.9.1, `pg` 8.23.0, Zod 4.4.3, Fastify 5, Node 24 ESM.

**Spec:** `docs/superpowers/specs/2026-08-16-postgresql-database-layer-design.md`

## Global Constraints

- Use Prisma datasource provider `postgresql`.
- Use `String @id @default(cuid())` for generated IDs and preserve fixture IDs explicitly during seeding.
- Use `Float` for `SupplyItem.price` and `Rfq.budget` because the requested contract names those types.
- Keep the existing frontend source, generated CSS, generated frontend bundle, and current server behavior unchanged except for database shutdown registration.
- Use the current ESM package configuration and Node 24 native TypeScript stripping for generated Prisma client files.
- Use strict Zod objects so unknown request keys fail validation.
- Use the named `comment_recipe_created_at_idx` index for the required comment query path.
- Run database commands with PostgreSQL available at the documented local `DATABASE_URL`.

---

### Task 1: Install Prisma and Configure PostgreSQL

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.env.example`
- Modify: `docker-compose.yml`
- Modify: `.gitignore`
- Create: `prisma.config.js`
- Create: `prisma/schema.prisma`

**Interfaces:**
- Produces `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`, and `npm run db:studio` commands.
- Produces the generated client at `generated/prisma/` for `server/db/client.js`.

- [ ] **Step 1: Install the runtime and CLI dependencies**

Run:

```bash
npm install @prisma/client@7.9.1 @prisma/adapter-pg@7.9.1 pg@8.23.0 dotenv@17.4.2 zod@4.4.3
npm install --save-dev prisma@7.9.1
```

Expected: `package.json` and `package-lock.json` contain the Prisma client,
PostgreSQL adapter/driver, dotenv, Zod, and Prisma CLI packages.

- [ ] **Step 2: Add database scripts and generated-client regeneration**

Add these exact script entries while preserving every existing script:

```json
"postinstall": "prisma generate",
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev --name init",
"db:seed": "prisma db seed",
"db:studio": "prisma studio"
```

- [ ] **Step 3: Configure local environment and database health**

Keep the existing local credentials and add:

```dotenv
PORT=3000
HOST=0.0.0.0
DATABASE_URL="postgresql://meyar_user:meyar_password@localhost:5432/meyar_db?schema=public"
DB_POOL_MAX=10
```

Add a PostgreSQL healthcheck to the existing `postgres` compose service:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U meyar_user -d meyar_db"]
  interval: 5s
  timeout: 5s
  retries: 10
```

Add `generated/` to `.gitignore`; generated Prisma client output is recreated
by `postinstall` and `db:generate`, not hand-maintained source.

- [ ] **Step 4: Add Prisma CLI configuration**

Create `prisma.config.js`:

```js
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js'
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://meyar_user:meyar_password@localhost:5432/meyar_db?schema=public'
  }
});
```

- [ ] **Step 5: Add the Prisma schema**

Create `prisma/schema.prisma` with the Prisma 7 generator and these exact
relationships/indexes:

```prisma
generator client {
  provider               = "prisma-client"
  output                 = "../generated/prisma"
  moduleFormat           = "esm"
  generatedFileExtension = "ts"
  importFileExtension    = "ts"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  CHEF
  SUPPLIER
  USER
}

model User {
  id                    String             @id @default(cuid())
  email                 String             @unique
  passwordHash          String
  name                  String
  handle                String             @unique
  role                  Role               @default(USER)
  avatar                String?
  bio                   String?
  location              String?
  verified              Boolean            @default(false)
  createdAt             DateTime           @default(now())
  recipes               Recipe[]
  comments              Comment[]          @relation("CommentAuthor")
  supplyItems           SupplyItem[]
  rfqs                  Rfq[]              @relation("RfqRequester")
  sentConversations     ChatConversation[] @relation("ConversationSender")
  receivedConversations ChatConversation[] @relation("ConversationReceiver")
  sentMessages          ChatMessage[]      @relation("MessageSender")
  receivedMessages      ChatMessage[]      @relation("MessageReceiver")
  notifications         Notification[]

  @@index([role])
  @@map("users")
}

model Recipe {
  id          String    @id @default(cuid())
  title       String
  description String
  prepTime    Int
  cookTime    Int
  servings    Int
  difficulty  String
  ingredients Json
  steps       Json
  tags        String[]
  authorId    String
  likesCount  Int       @default(0)
  createdAt   DateTime  @default(now())
  author      User      @relation(fields: [authorId], references: [id])
  comments    Comment[]

  @@index([authorId, createdAt])
  @@map("recipes")
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  authorId  String
  recipeId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  author    User     @relation("CommentAuthor", fields: [authorId], references: [id])
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@index([authorId])
  @@index([recipeId, createdAt], map: "comment_recipe_created_at_idx")
  @@map("comments")
}

model SupplyItem {
  id         String @id @default(cuid())
  title      String
  category   String
  price      Float
  unit       String
  supplierId String
  stock      Int
  status     String
  supplier   User   @relation(fields: [supplierId], references: [id])

  @@index([supplierId])
  @@map("supply_items")
}

model Rfq {
  id          String   @id @default(cuid())
  title       String
  description String
  budget      Float
  deadline    DateTime
  status      String
  requesterId String
  requester   User     @relation("RfqRequester", fields: [requesterId], references: [id])

  @@index([requesterId, deadline])
  @@map("rfqs")
}

model ChatConversation {
  id         String        @id @default(cuid())
  senderId   String
  receiverId String
  createdAt  DateTime      @default(now())
  sender     User          @relation("ConversationSender", fields: [senderId], references: [id])
  receiver   User          @relation("ConversationReceiver", fields: [receiverId], references: [id])
  messages   ChatMessage[]

  @@unique([senderId, receiverId])
  @@index([senderId])
  @@index([receiverId])
  @@map("chat_conversations")
}

model ChatMessage {
  id             String           @id @default(cuid())
  conversationId String
  senderId       String
  receiverId     String
  content        String
  isRead         Boolean          @default(false)
  createdAt      DateTime         @default(now())
  conversation   ChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User             @relation("MessageSender", fields: [senderId], references: [id])
  receiver       User             @relation("MessageReceiver", fields: [receiverId], references: [id])

  @@index([conversationId, createdAt])
  @@index([senderId])
  @@index([receiverId])
  @@map("chat_messages")
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  content   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@map("notifications")
}
```

- [ ] **Step 6: Generate and validate the Prisma client**

Run:

```bash
npm run db:generate
npx prisma validate
```

Expected: Prisma reports a valid schema and creates `generated/prisma/`.

- [ ] **Step 7: Run the configuration check**

Run `git diff --check` and confirm no generated directory is staged.

### Task 2: Write Failing Database and Validation Tests

**Files:**
- Create: `tests/db.test.mjs`
- Create: `tests/schemas.test.mjs`

**Interfaces:**
- Consumes later `prisma`, `disconnectDatabase`, and named schema exports.
- Produces the executable red tests that define the Phase 2 behavior.

- [ ] **Step 1: Write strict-schema tests first**

Create tests that import `registerSchema`, `loginSchema`, `recipeCreateSchema`,
`commentCreateSchema`, and `rfqCreateSchema`, then assert valid data parses and
unknown keys or invalid values fail:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  commentCreateSchema,
  loginSchema,
  recipeCreateSchema,
  registerSchema,
  rfqCreateSchema
} from '../server/schemas/index.js';

test('auth schemas accept valid register and login payloads', () => {
  assert.equal(registerSchema.safeParse({
    email: 'chef@example.com',
    password: 'Secret123!',
    name: 'Chef Example',
    handle: '@chef_example',
    role: 'CHEF'
  }).success, true);
  assert.equal(loginSchema.safeParse({
    email: 'chef@example.com',
    password: 'Secret123!'
  }).success, true);
});

test('strict schemas reject unknown keys and invalid boundaries', () => {
  assert.equal(registerSchema.safeParse({
    email: 'chef@example.com',
    password: 'Secret123!',
    name: 'Chef Example',
    handle: '@chef_example',
    isAdmin: true
  }).success, false);
  assert.equal(recipeCreateSchema.safeParse({
    title: 'Too short',
    description: 'A recipe description long enough for the request.',
    prepTime: -1,
    cookTime: 10,
    servings: 2,
    difficulty: 'Hard',
    ingredients: [{ name: 'Salt' }],
    steps: [{ instruction: 'Season.' }],
    tags: ['savory']
  }).success, false);
  assert.equal(commentCreateSchema.safeParse({
    content: '',
    authorId: 'chef-1',
    recipeId: 'recipe-1'
  }).success, false);
  assert.equal(rfqCreateSchema.safeParse({
    title: 'Mixer',
    description: 'Need a commercial mixer.',
    budget: 0,
    deadline: '2026-09-01',
    requesterId: 'chef-1'
  }).success, false);
});
```

- [ ] **Step 2: Write database integration tests first**

Create tests with unique IDs, real Prisma queries, cleanup in `finally`, and a
single file-level disconnect:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { disconnectDatabase, prisma } from '../server/db/client.js';

test.after(async () => {
  await disconnectDatabase();
});

test('Prisma connects to PostgreSQL', async () => {
  await prisma.$connect();
  const rows = await prisma.$queryRaw`SELECT 1 AS ok`;
  assert.equal(rows[0].ok, 1);
});

test('CRUD works and deleting a recipe cascades to comments', async () => {
  const suffix = randomUUID();
  const userId = `test-user-${suffix}`;
  const recipeId = `test-recipe-${suffix}`;
  const commentId = `test-comment-${suffix}`;
  try {
    await prisma.user.create({
      data: {
        id: userId,
        email: `${suffix}@example.test`,
        passwordHash: 'test-only',
        name: 'Database Test User',
        handle: `@db_test_${suffix.replaceAll('-', '').slice(0, 16)}`,
        role: 'USER'
      }
    });
    await prisma.recipe.create({
      data: {
        id: recipeId,
        title: 'Database Test Recipe',
        description: 'Recipe used by the database integration test.',
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        difficulty: 'Medium',
        ingredients: [{ name: 'Salt', amount: 1 }],
        steps: [{ instruction: 'Season.' }],
        tags: ['test'],
        authorId: userId
      }
    });
    await prisma.comment.create({
      data: { id: commentId, content: 'Useful recipe.', authorId: userId, recipeId }
    });
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: 'Updated recipe comment.' }
    });
    assert.equal(updated.content, 'Updated recipe comment.');
    await prisma.recipe.delete({ where: { id: recipeId } });
    assert.equal(await prisma.comment.findUnique({ where: { id: commentId } }), null);
  } finally {
    await prisma.comment.deleteMany({ where: { id: commentId } });
    await prisma.recipe.deleteMany({ where: { id: recipeId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  }
});

test('the comment recipe and creation-time index exists', async () => {
  const rows = await prisma.$queryRaw`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'comments'
  `;
  assert.ok(rows.some(({ indexname }) => indexname === 'comment_recipe_created_at_idx'));
});
```

- [ ] **Step 3: Run the new tests to verify the expected red state**

Run:

```bash
node --test tests/schemas.test.mjs
node --test tests/db.test.mjs
```

Expected: both commands fail because the implementation exports and generated
client do not exist yet; fix only test typos before continuing.

### Task 3: Implement the Prisma Client Lifecycle

**Files:**
- Create: `server/db/client.js`
- Modify: `server/app.js`

**Interfaces:**
- Produces `prisma` as the singleton generated client.
- Produces `disconnectDatabase()` as an idempotent async cleanup function.
- Produces `registerDatabase(app)` for Fastify `onClose` registration.

- [ ] **Step 1: Implement the pooled client**

Create `server/db/client.js` with one `pg.Pool`, explicit pool limits, the
Prisma PostgreSQL adapter, and the generated `.ts` client import:

```js
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client.ts';

const databaseUrl = process.env.DATABASE_URL
  ?? 'postgresql://meyar_user:meyar_password@localhost:5432/meyar_db?schema=public';
const configuredPoolMax = Number.parseInt(process.env.DB_POOL_MAX ?? '10', 10);
const pool = new Pool({
  connectionString: databaseUrl,
  max: Number.isInteger(configuredPoolMax) && configuredPoolMax > 0 ? configuredPoolMax : 10,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 300_000
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

let disconnectPromise;

export function disconnectDatabase() {
  disconnectPromise ??= Promise.all([
    prisma.$disconnect(),
    pool.end()
  ]);
  return disconnectPromise;
}

export function registerDatabase(app) {
  app.addHook('onClose', async () => {
    await disconnectDatabase();
  });
}
```

- [ ] **Step 2: Register shutdown cleanup in the Fastify factory**

Import `registerDatabase` in `server/app.js` and call it after creating the
Fastify instance and before registering routes. Do not call `$connect()` while
building the app; connection remains lazy.

- [ ] **Step 3: Run the database test against PostgreSQL**

Start the service and apply the schema before running the test:

```bash
docker compose up -d postgres
npm run db:migrate
node --test tests/db.test.mjs
```

Expected: the connection, CRUD/cascade, and index tests pass.

- [ ] **Step 4: Run the existing server tests**

Run `node --test tests/server.test.mjs` and confirm all existing health, static,
error-policy, and signal-shutdown assertions still pass.

### Task 4: Implement Strict Zod Schemas

**Files:**
- Create: `server/schemas/auth.js`
- Create: `server/schemas/recipe.js`
- Create: `server/schemas/comment.js`
- Create: `server/schemas/rfq.js`
- Create: `server/schemas/index.js`

**Interfaces:**
- Produces `registerSchema` and `loginSchema`.
- Produces `recipeCreateSchema`, `commentCreateSchema`, and `rfqCreateSchema`.

- [ ] **Step 1: Implement auth schemas**

Use `z.strictObject` with email, password, name, handle, and role validation:

```js
import { z } from 'zod';

const handle = z.string().trim().min(3).max(30).regex(/^@?[A-Za-z0-9_]+$/);
const role = z.enum(['CHEF', 'SUPPLIER', 'USER']);

export const registerSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
  handle,
  role: role.optional().default('USER')
});

export const loginSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(1).max(128)
});
```

- [ ] **Step 2: Implement recipe, comment, and RFQ schemas**

Use strict nested objects for ingredient/step JSON, bounded integers, positive
RFQ budgets, and ISO dates:

```js
import { z } from 'zod';

const id = z.string().trim().min(1).max(128);
const recipeIngredient = z.strictObject({
  name: z.string().trim().min(1).max(200),
  amount: z.number().finite().positive(),
  unit: z.string().trim().min(1).max(40).optional()
});
const recipeStep = z.strictObject({
  instruction: z.string().trim().min(1).max(4000),
  durationMinutes: z.number().int().nonnegative().max(1440).optional()
});

export const recipeCreateSchema = z.strictObject({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(20).max(10_000),
  prepTime: z.number().int().nonnegative().max(1440),
  cookTime: z.number().int().nonnegative().max(1440),
  servings: z.number().int().min(1).max(100),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  ingredients: z.array(recipeIngredient).min(1).max(200),
  steps: z.array(recipeStep).min(1).max(100),
  tags: z.array(z.string().trim().min(1).max(50)).max(30)
});

export const commentCreateSchema = z.strictObject({
  content: z.string().trim().min(1).max(2_000),
  authorId: id,
  recipeId: id
});

export const rfqCreateSchema = z.strictObject({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(10_000),
  budget: z.number().finite().positive(),
  deadline: z.iso.date(),
  requesterId: id
});
```

- [ ] **Step 3: Export the schemas from the index**

Create `server/schemas/index.js`:

```js
export { loginSchema, registerSchema } from './auth.js';
export { commentCreateSchema } from './comment.js';
export { recipeCreateSchema } from './recipe.js';
export { rfqCreateSchema } from './rfq.js';
```

- [ ] **Step 4: Run the schema tests to verify green**

Run `node --test tests/schemas.test.mjs`; expected: all schema tests pass.

### Task 5: Implement Idempotent Fixture Seeding

**Files:**
- Create: `prisma/seed.js`

**Interfaces:**
- Consumes fixture exports from `js/data/fixtures/index.js`.
- Uses the shared `prisma` client and `disconnectDatabase()`.
- Produces deterministic users, recipes, supplies, RFQs, conversations,
  messages, and notifications.

- [ ] **Step 1: Add fixture normalization helpers**

Implement small local functions in `prisma/seed.js`:

```js
function roleFromFixture(role) {
  return { chef: 'CHEF', supplier: 'SUPPLIER', enthusiast: 'USER', user: 'USER' }[role] ?? 'USER';
}

function parseDate(value, fallback) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function fixturePasswordHash(id) {
  return `fixture:${createHash('sha256').update(`meyar-fixture:${id}`).digest('hex')}`;
}
```

Merge `USER_FIXTURES`, `CHEF_FIXTURES`, `DEMO_USERS`, nested supply suppliers,
and chat partners by ID. Preserve existing email/handle values and derive
`${id}@meyar.local`/`@${id}` only when a fixture omits them.

- [ ] **Step 2: Upsert users before dependent records**

Within an interactive transaction, upsert each normalized user by `id`, writing
the profile fields and deterministic fixture-only password hash. Map lowercase
fixture roles to the Prisma `Role` enum.

- [ ] **Step 3: Upsert recipes and supplies**

Upsert recipes by fixture `id`, mapping `title_en`, `description_en`,
`prep_time`, `cook_time`, `base_servings`, `difficulty`, `ingredients`,
`steps`, `tags`, `likes_count`, `author_id`, and parsed `created_at`.

Upsert supplies by fixture `id`, mapping `name_en`, `category`, `price`,
`unit_en`, `stock_count`, `in_stock ? 'IN_STOCK' : 'OUT_OF_STOCK'`, and nested
supplier ID.

- [ ] **Step 4: Upsert RFQs, conversations, messages, and notifications**

Map RFQ fixture cards to requester `chef-1`, using `item_name_en` as title,
item/quantity/destination as a useful description, `total_price` or
`target_price` as budget, `target_date` as deadline, and fixture status.

Create each chat conversation by fixture ID with active user `chef-1` as
sender and the partner as receiver. Upsert each nested message by message ID,
set sender/receiver from the `me`/`partner` marker, and preserve English text.
Attach all notifications to `USER_FIXTURES.id`, preserving type, English
message, read flag, and timestamp.

- [ ] **Step 5: Add explicit cleanup in the seed entrypoint**

Use this shape so Prisma and the `pg.Pool` always close:

```js
main()
  .then(async () => {
    await disconnectDatabase();
  })
  .catch(async (error) => {
    console.error(error);
    await disconnectDatabase();
    process.exitCode = 1;
  });
```

- [ ] **Step 6: Run migration and seed twice**

Run:

```bash
npm run db:migrate
npm run db:seed
npm run db:seed
```

Expected: both seed runs complete without unique-constraint errors. Verify
counts with Prisma Studio or SQL and confirm fixture IDs remain unchanged.

### Task 6: Complete Integration Verification

**Files:**
- Modify: `tests/db.test.mjs` only if a real Prisma/PostgreSQL behavior exposes a test defect.

**Interfaces:**
- Consumes the migration, seed, client lifecycle, and schema exports from the
  preceding tasks.
- Produces a passing complete `npm test` run and a clean reviewable diff.

- [ ] **Step 1: Run the focused checks**

Run:

```bash
npm run db:generate
npx prisma validate
node --test tests/schemas.test.mjs
node --test tests/db.test.mjs
node --test tests/server.test.mjs
```

- [ ] **Step 2: Run the complete test suite**

Run the required command exactly:

```bash
npm run test
```

Expected: all existing frontend/server tests plus the new schema/database tests
pass with no unhandled rejection or open-handle warnings.

- [ ] **Step 3: Review production changes**

Run:

```bash
```

Confirm generated Prisma output is ignored, no `.env` or database secret is
tracked, and only the planned files changed.

- [ ] **Step 4: Run the clean-code review gate**

Inspect the changed production files for duplicate normalization logic,
unbounded database input, unclosed pool paths, accidental frontend changes,
and unnecessary abstractions. Keep the implementation minimal and retain only
comments that explain the fixture-only password shortcut or lifecycle choice.
