# @kiwa-lab/api

> [日本語](/libraries/foundation/api/)

`@kiwa-lab/api` is an adapter for testing HTTP handlers with Vitest. Its mock, live, and hybrid execution modes use the same `request` client, so you can change the scope of external communication and real application startup without changing the intent of your tests.

## What it solves

Test Fetch API-style handlers and Node.js `(req, res)` handlers as real HTTP requests. Mock mode uses MSW handlers, live mode starts a local HTTP server, and hybrid mode starts a live server while using MSW for selective overrides.

## Choose a mode

| Mode | Required input | Use it when |
| --- | --- | --- |
| `mock` | `mockHandlers` | You want to fix external responses and quickly verify application branches. |
| `live` | `app` | You want to test your own HTTP handler through a real local server. |
| `hybrid` | `app` and `mockHandlers` | You want to test a live handler by default while replacing only selected requests with MSW. |

`@kiwa-lab/api` is not an API framework. The application under test provides routes, authentication, and the database; this package starts, requests, and stops the HTTP boundary.

## Read next

- Start with a minimal live handler in the [Quickstart](./quickstart).
- Learn the required inputs and cleanup for each mode in [Choose mock, live, or hybrid](./guides/choose-a-mode).
- See public APIs and return values in the [API Reference](./reference).
