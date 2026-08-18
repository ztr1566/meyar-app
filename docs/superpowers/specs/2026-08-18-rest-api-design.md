# Meyar REST API Design

## Scope

Add the first REST API surface to the existing Fastify, Prisma, and PostgreSQL
application. The API covers authentication and CRUD operations for users,
recipes, comments, supply items, and RFQs. Existing frontend behavior, static
serving, database schema, and health endpoint behavior remain unchanged.

## Architecture

```text
server/app.js                    Shared error policy and route registration
server/routes/*.routes.js        HTTP method/path registration
server/controllers/*.controller.js HTTP request/response handlers
server/services/*.service.js     Prisma operations and domain-level checks
server/auth/*.js                  Password hashing and signed Bearer tokens
server/validation/*.js            Zod request validation helpers
server/errors.js                  Public application errors and Prisma mapping
server/schemas/*.js               Strict body, params, and query schemas
```

Routes stay explicit by resource. Route pre-handlers validate and controllers
delegate; services own persistence and ownership checks. A generic CRUD factory or repository
layer is intentionally not introduced because the resources have different
relations and authorization rules.

## Endpoint Contract

All endpoints use the `/api` prefix and return JSON.

### Authentication and Users

- `POST /api/auth/register` creates a user and returns a public user object and
  a signed Bearer token.
- `POST /api/auth/login` verifies credentials and returns a public user object
  and a signed Bearer token.
- `GET /api/auth/me` returns the authenticated public user.
- `GET /api/users` lists public users.
- `GET /api/users/:id` returns one public user.
- `PATCH /api/users/:id` updates the authenticated user's profile.
- `DELETE /api/users/:id` deletes the authenticated user's account.

### Recipes and Comments

- `GET /api/recipes` lists recipes.
- `GET /api/recipes/:id` returns a recipe with its public author and comments.
- `POST /api/recipes` creates a recipe for the authenticated user.
- `PATCH /api/recipes/:id` updates an owned recipe.
- `DELETE /api/recipes/:id` deletes an owned recipe and its comments through
  the existing database cascade.
- `GET /api/recipes/:recipeId/comments` lists comments for a recipe.
- `POST /api/recipes/:recipeId/comments` creates a comment for the
  authenticated user.
- `GET /api/comments/:id` returns one comment.
- `PATCH /api/comments/:id` updates an owned comment.
- `DELETE /api/comments/:id` deletes an owned comment.

### Supply Items and RFQs

- `GET /api/supply-items` lists supply items.
- `GET /api/supply-items/:id` returns one supply item.
- `POST /api/supply-items` creates an item for the authenticated supplier.
- `PATCH /api/supply-items/:id` updates an owned item.
- `DELETE /api/supply-items/:id` deletes an owned item.
- `GET /api/rfqs` lists RFQs.
- `GET /api/rfqs/:id` returns one RFQ.
- `POST /api/rfqs` creates an RFQ for the authenticated requester.
- `PATCH /api/rfqs/:id` updates an owned RFQ.
- `DELETE /api/rfqs/:id` deletes an owned RFQ.

Collection reads are public. All mutations and `auth/me` require a valid
`Authorization: Bearer <token>` header. A mutation may only affect the
authenticated user's own record or owned resource. Request identity fields
such as `authorId` and `requesterId` must match the authenticated user rather
than being trusted as authorization.

Successful responses use the resource directly: `200` for reads and updates,
`201` for creates, and `204` for deletes.

## Authentication

Passwords are hashed with Node's built-in `crypto.scrypt` using a random salt.
Tokens are stateless signed payloads containing the user ID and an expiry,
authenticated with an HMAC secret. The secret is configurable through
`AUTH_SECRET`, with a development fallback so local tests and startup do not
require another setup step. Tokens expire after one day.

Authentication is deliberately limited to registration, login, current-user
lookup, and Bearer verification. Refresh tokens, password reset, email
verification, OAuth, and persisted sessions are out of scope.

## Validation and Errors

Every request body, route-parameter object, and supported query object is
parsed by a strict Zod schema before controller logic runs. Parsed values are
attached to the request so controllers never consume unvalidated input.

The application error handler maps public application errors and known Prisma
errors to this stable shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed"
  }
}
```

Expected status/code pairs are `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`,
`403 FORBIDDEN`, `404 NOT_FOUND`, and `409 CONFLICT`. Unknown failures log the
server-side error and return `500 INTERNAL_SERVER_ERROR` without stack traces,
database details, or credentials.

User responses select public fields only; `passwordHash` never leaves the
service boundary. Prisma unique-constraint and missing-record errors are
converted centrally instead of being duplicated in controllers.

## Data Flow

```text
HTTP request
  -> route pre-handlers: Zod parsing, optional Bearer authentication
  -> controller: status code and response shape
  -> service: ownership checks and Prisma query
  -> centralized error handler: stable public JSON
```

Existing Prisma models and the singleton database client are reused. No schema
migration is needed for this API phase.

## Testing

Add a native `node:test` integration suite using `buildApp({ logger: false })`
and Fastify injection against the configured PostgreSQL database. The suite
will create uniquely named users and resources, clean them up in `finally`
blocks, and close the application once after all tests.

Coverage will include:

- registration, login, Bearer authentication, and public-user responses;
- successful CRUD for recipes, comments, supply items, RFQs, and user profiles;
- strict body/params/query validation and rejected unknown keys;
- unauthenticated and cross-owner mutation rejection;
- missing-resource, duplicate-user, and malformed-request errors;
- no password hashes or internal database details in responses;
- the existing health, static-serving, database, and frontend test suites via
  `npm run test`.

## Non-Goals

- No pagination contract beyond a small validated collection limit if needed by
  the existing list queries.
- No frontend migration from fixtures to API calls.
- No new runtime dependency for authentication, validation, or test execution.
- No CRUD endpoints for chat conversations, messages, or notifications in this
  phase; their persistence models remain available for a later endpoint set.
