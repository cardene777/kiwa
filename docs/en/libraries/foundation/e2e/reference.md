# API reference

[日本語](/libraries/foundation/e2e/reference)

This page covers the public exports of `@kiwa-lab/e2e`. All types are TypeScript type exports.

## `setupE2eEnv`

```ts
function setupE2eEnv(options?: SetupE2eEnvOptions): Promise<E2eTestEnv>
```

Creates a local HTTP server, a Playwright browser, a context, and a page; opens the initial URL; then returns the environment. When neither an application nor `staticHtml` is provided, it throws `setupE2eEnv: provide either { app } or { staticHtml }`.

### `SetupE2eEnvOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `app` | `ApiHandlerSource \| NodeRequestHandler` | None | The server application under test. A function is treated as a Node.js handler. |
| `staticHtml` | `string` | None | Creates a small application that returns HTML when `app` is absent. An empty string is also valid. |
| `browser` | `"chromium" \| "firefox" \| "webkit"` | `"chromium"` | The Playwright engine to start. |
| `headless` | `boolean` | `true` | The headless flag passed to Playwright's `launch`. |
| `initialPath` | `string` | `"/"` | The path or `http` URL to open after startup. A relative path gains a leading `/`. |

### `E2eTestEnv`

`E2eTestEnv` extends `TestEnvBase<"live">` from `@kiwa-lab/core`. Its returned `mode` is always `"live"`.

| Property | Type | Description |
| --- | --- | --- |
| `baseUrl` | `string` | The local URL of the started server, in the form `http://127.0.0.1:<port>`. |
| `page` | `BrowserPageHandle` | The started browser page. |
| `browser` | `"chromium" \| "firefox" \| "webkit"` | The engine actually started. |
| `stop` | `() => Promise<void>` | Closes the page, context, browser, and server. |

## `startServer`

```ts
function startServer(source: ApiHandlerSource | NodeRequestHandler): Promise<ServerHandle>
```

Use this when you only need to start an HTTP server. It listens on an automatically assigned port at `127.0.0.1`.

### `ApiHandlerSource`

```ts
type ApiHandlerSource =
  | { kind: "fetch"; handler: (request: Request) => Promise<Response> | Response }
  | { kind: "node"; handler: NodeRequestHandler };
```

For a Fetch handler response, the status and headers are carried through to the HTTP response. A handler exception becomes HTTP 500. A Node.js handler turns both synchronous exceptions and asynchronous rejections into HTTP 500.

### `NodeRequestHandler`

```ts
type NodeRequestHandler = (
  request: import("node:http").IncomingMessage,
  response: import("node:http").ServerResponse,
) => void | Promise<void>;
```

### `ServerHandle`

| Property | Type | Description |
| --- | --- | --- |
| `baseUrl` | `string` | The URL of the started server. |
| `port` | `number` | The automatically assigned port. |
| `close` | `() => Promise<void>` | Stops the server. |

## Browser handle

`E2eTestEnv.page` does not expose the complete Playwright page. It is limited to the following `BrowserPageHandle` operations.

| Method | Result | Purpose |
| --- | --- | --- |
| `goto(url, options?)` | `Promise<unknown>` | Navigates to a URL. `waitUntil` accepts `load`, `domcontentloaded`, and `networkidle`. |
| `setContent(html, options?)` | `Promise<void>` | Replaces page content with HTML. |
| `getByTestId(id)` | `BrowserLocator` | Finds an element by `data-testid`. |
| `getByRole(role, options?)` | `BrowserLocator` | Finds an element by role and optional name. |
| `getByText(text)` | `BrowserLocator` | Finds an element by text. |
| `fill(selector, value)` | `Promise<void>` | Enters a value with a CSS selector. |
| `click(selector)` | `Promise<void>` | Clicks an element with a CSS selector. |
| `evaluate(fn)` | `Promise<T>` | Evaluates a function in the page. |
| `screenshot(options?)` | `Promise<Buffer>` | Captures a screenshot. You can specify `path`. |
| `content()` | `Promise<string>` | Gets the current HTML. |
| `url()` | `string` | Gets the current URL. |
| `close()` | `Promise<void>` | Closes the page. |

`getByTestId`, `getByRole`, and `getByText` return a `BrowserLocator` with `textContent()`, `click()`, `fill(value)`, `isVisible()`, and `count()`.

## Related pages

- A runnable minimal example: [Quickstart](./quickstart)
- Ways to connect an application: [Fetch handler](./guides/fetch-handler) and [Node.js HTTP handler](./guides/node-handler)
