# @kiwa-lab/e2e

[日本語](/libraries/foundation/e2e/)

`@kiwa-lab/e2e` is an adapter for verifying web applications end-to-end from Vitest. It starts a real HTTP server and a Playwright browser. A single call to `setupE2eEnv` manages server startup, browser startup, navigation to the first page, and cleanup.

## What this library verifies

Use this library when you want to verify browser interaction and an HTTP-served page together—for example, a DOM update after a form submission. It targets general web applications. For tests centred on dApps and Anvil, use [`@kiwa-lab/dapp`](../dapp/) instead.

`@kiwa-lab/e2e` is not a test runner. Vitest runs tests and assertions; Playwright provides the browser implementation.

## Choose an input

| Test target | Pass to `setupE2eEnv` | Best for |
| --- | --- | --- |
| Small HTML and browser interactions | `staticHtml` | Verifying DOM interaction with the smallest setup |
| An application in Fetch API form | `app: { kind: "fetch", handler }` | Running a handler that uses `Request` and `Response` |
| A Node.js HTTP handler | `app: (req, res) => { ... }` or `kind: "node"` | Working directly with `IncomingMessage` and `ServerResponse` |

`staticHtml` works as a Fetch handler that returns HTML instead of an application. If you specify neither an application nor static HTML, `setupE2eEnv` throws an error.

## Values available during a test

`setupE2eEnv` returns an `E2eTestEnv`. You will mainly use these four values.

| Value | Description |
| --- | --- |
| `env.page` | A thin Playwright page handle. Use `getByTestId`, `getByRole`, `fill`, `click`, `evaluate`, and similar methods. |
| `env.baseUrl` | The URL of the started server, in the form `http://127.0.0.1:<port>`. |
| `env.browser` | The started engine name. The default is `chromium`. |
| `env.stop()` | An async function that closes the page, context, browser, and server in that order. |

## Start here

Begin with the [Quickstart](./quickstart), which tests a form interaction and a visible update. To pass an application as a Fetch handler, see [Test a Fetch handler](./guides/fetch-handler). To pass a Node.js handler, see [Test a Node.js HTTP handler](./guides/node-handler).

All public types and options are collected in the [API reference](./reference).
