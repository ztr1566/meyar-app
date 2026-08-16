# Fastify Backend Design

## Scope

Add a small Fastify ESM server alongside the existing standalone frontend.
The server will serve the built frontend and expose a health endpoint, without
changing the existing esbuild, Tailwind v4, HTML, or frontend test setup.

## Architecture

```text
server/server.js                 Process entrypoint and listener
server/app.js                    Fastify application factory
server/plugins/cors.js           CORS registration
server/plugins/static.js         Frontend static-file registration
server/routes/health.routes.js   Health route registration
server/controllers/health.controller.js
                                  HTTP handler for health requests
server/services/health.service.js
                                  Health response data
```

`server/app.js` will export a factory that creates and configures a Fastify
instance without opening a port. This keeps route and static-serving behavior
testable with Fastify injection. `server/server.js` will read `PORT` and `HOST`
from the environment, defaulting to port `3000` and host `0.0.0.0`, then start
the application.

The health flow will be:

```text
GET /api/health -> route -> controller -> service -> JSON response
```

The health response will be a stable JSON object with `status: "ok"`.

## Frontend Serving

The static plugin will use the repository root as its static root and will
serve only the frontend assets needed by the existing pages:

- `/` maps to `index.html`.
- Root-level `*.html` pages remain directly addressable.
- `/js/bundle.js` serves the existing esbuild output.
- `/css/output.css` serves the existing Tailwind output.

Unlisted project files will not be exposed through the static handler. The
server will not run frontend builds implicitly; `npm run build` remains the
explicit build command and all existing frontend scripts remain unchanged.

The CORS plugin will use the standard public-server configuration from
`@fastify/cors`, allowing browser requests to the health endpoint and future
API routes.

## Package Scripts and Dependencies

Add runtime dependencies for `fastify`, `@fastify/cors`, and
`@fastify/static`. Add these scripts without changing existing script values:

```json
"dev:server": "node --watch server/server.js",
"start": "node server/server.js"
```

## Verification

Add `tests/server.test.mjs` to the existing `node --test tests/*.test.mjs`
glob. The server tests will use the application factory and Fastify injection
to verify:

- `GET /api/health` returns HTTP 200 and the health JSON.
- CORS headers are present for browser requests.
- `/`, an HTML page, `js/bundle.js`, and `css/output.css` are served.
- A non-frontend project file is not served by the static handler.
- The existing 246 frontend tests continue to pass through `npm run test`.

No existing frontend source, generated asset, HTML page, Tailwind configuration,
esbuild command, or test helper will be modified.
