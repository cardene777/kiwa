# API Reference

> [日本語](/libraries/foundation/api/reference)

The following APIs are public exports from `packages/api/src/index.ts`.

## `setupApiServer`

```ts
function setupApiServer<TMode extends TestMode>(
  options: SetupApiServerOptions<TMode>,
): Promise<ApiTestEnv>
```

Creates a test environment for the selected mode. Every return value includes `mode`, `baseUrl`, `request`, and `stop()`; mock and hybrid environments also include `mocks.reset()`.

## `ApiRequestClient`

`env.request` provides the following methods.

| Method | Description |
| --- | --- |
| `get(path, init?)` | Sends a GET request. |
| `post(path, body?, init?)` | Sends a POST request with a JSON body. |
| `put(path, body?, init?)` | Sends a PUT request. |
| `patch(path, body?, init?)` | Sends a PATCH request. |
| `delete(path, init?)` | Sends a DELETE request. |

Every method returns an `ApiResponseSnapshot`. A snapshot has `status`, `headers`, `bodyText`, and `json<T>()`.

## Server API

- `startLiveServer(source)` — Starts an `ApiHandlerSource` or Node handler as a local HTTP server.
- `startMockServer(options)` — Starts an MSW server.
- `createRequestClient(options)` — Creates a request client with a base URL and default headers.

## Types

`ApiHandlerSource` is `{ kind: "fetch", handler }` or `{ kind: "node", handler }`. `SetupApiServerOptions` accepts `mode`, `mockHandlers`, `app`, `baseUrl`, and `defaultHeaders`. For exact definitions, see [types.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts).
