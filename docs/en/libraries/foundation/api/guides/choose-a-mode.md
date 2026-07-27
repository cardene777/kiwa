# Choose mock, live, or hybrid

> [日本語](/libraries/foundation/api/guides/choose-a-mode)

`setupApiServer` requires different inputs for each mode. Choose the boundary that the test needs to verify instead of mixing modes ambiguously.

## Mock mode

`mockHandlers` is required. The default base URL is `http://kiwa.mock`, and you can reset MSW handlers with `env.mocks.reset()`. Use this mode when you want to fix responses from network destinations and quickly test errors or edge cases.

## Live mode

`app` is required. Pass `{ kind: "fetch", handler }` or a Node.js handler to start a local server on an available port. `env.request` sends requests to that server, and `env.stop()` closes it.

## Hybrid mode

Both `app` and `mockHandlers` are required. The live server remains running, while unhandled MSW requests are bypassed and reach the app. Use this mode when you want to replace only external dependencies with MSW while testing the application's own routes live.

## Common errors

- No `mockHandlers` in mock mode — `setupApiServer({ mode: "mock" }) requires mockHandlers`.
- No `app` in live mode — `setupApiServer({ mode: "live" }) requires app`.
- One required value missing in hybrid mode — provide both `app` and `mockHandlers`.

For public types, see the [API Reference](../reference).
