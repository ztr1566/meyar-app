# Fastify Backend Design

## Scope

Add a small Fastify ESM server alongside the existing standalone frontend.
The server will serve the built frontend and expose a health endpoint, without
changing the existing esbuild, Tailwind v4, HTML, or frontend test setup.

## Architecture

```text
server/server.js                 Process entrypoint, listener, and shutdown
server/app.js                    Fastify application factory and error policy
server/plugins/cors.js           CORS registration
server/plugins/static.js         Frontend static-file registration
server/routes/health.routes.js   Health route registration
server/controllers/health.controller.js
                                  HTTP handler for health requests
server/services/health.service.js
                                  Health response data
```

`server/app.js` will export a factory that creates and configures a Fastify
instance without opening a port. This keeps route, error, and static-serving
behavior testable with Fastify injection. The factory will accept Fastify logger
options, including `logger: false` for automated tests; the process entrypoint
will enable the built-in logger for normal server runs.

`server/server.js` will read `PORT` and `HOST` from the environment, defaulting
to port `3000` and host `0.0.0.0`, then start the application. It will register
one-time `SIGTERM` and `SIGINT` handlers that await `app.close()` before the
process exits, allowing active requests and Fastify plugins to shut down cleanly.

The health flow will be:

```text
GET /api/health -> route -> controller -> service -> JSON response
```

The health response will be a stable JSON object with `status: "ok"`.

## Error Contract

The application will define custom `setErrorHandler` and
`setNotFoundHandler` hooks. Requests under `/api/*`, including unknown routes,
will always receive JSON with this shape:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Route not found"
  }
}
```

Known client errors will preserve their HTTP status and safe message. Unknown
or server-side errors will return HTTP 500 with the generic message
`Internal Server Error`; stack traces and internal error details will only be
available to the server logger, never to the response body. Non-API 404 and
error responses will use the same JSON policy instead of Fastify's default
HTML or framework-specific response.

## Frontend Serving

The static plugin will use the repository root as its static root and will
serve only the frontend assets needed by the existing pages:

- `/` maps to `index.html`.
- Root-level `*.html` pages remain directly addressable.
- `/js/bundle.js` serves the existing esbuild output.
- `/css/output.css` serves the existing Tailwind output.
- `/images/*`, `/icons/*`, and `/fonts/*` are available for local frontend
  assets if those directories are referenced by an HTML page.

The static plugin will provide an explicit `allowedPath` guard in addition to
`@fastify/static`'s path handling. It will reject encoded or literal parent
segments, null bytes, hidden path segments, and every path outside the listed
frontend files/directories. This blocks `.env`, `.git`, `package.json`, test
files, source modules, and other project files while preserving the current
local asset references. The repository currently uses CDN URLs for images and
fonts, so no local image or font directory is added by this change.

The server will not run frontend builds implicitly; `npm run build` remains the
explicit build command and all existing frontend scripts remain unchanged.

The CORS plugin will use the standard public-server configuration from
`@fastify/cors`, allowing browser requests to the health endpoint and future
API routes.

## Package Scripts and Dependencies

Add runtime dependencies for `fastify`, `@fastify/cors`, and
`@fastify/static`. Add these scripts without changing existing script values:

```json
"dev:server": "node --env-file-if-exists=.env --watch server/server.js",
"start": "node server/server.js"
```

## Verification

Add `tests/server.test.mjs` to the existing `node --test tests/*.test.mjs`
glob. The server tests will use the application factory and Fastify injection
to verify:

- `GET /api/health` returns HTTP 200 and the health JSON.
- CORS headers are present for browser requests.
- `/`, an HTML page, `js/bundle.js`, and `css/output.css` are served.
- Sensitive root files and directories, including `.env`, `.git`,
  `package.json`, and `tests`, return 404.
- Literal and encoded directory traversal requests return 404.
- API 404 and error responses are JSON, use stable status/message fields, and
  do not include stack traces.
- The server process closes its Fastify application when terminated by
  `SIGTERM` or `SIGINT`.
- The existing 246 frontend tests continue to pass through `npm run test`.

No existing frontend source, generated asset, HTML page, Tailwind configuration,
esbuild command, or test helper will be modified.
