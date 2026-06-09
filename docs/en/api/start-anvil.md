# startAnvil

> [🇬🇧 English](./start-anvil.md) • [🇯🇵 日本語](../../ja/api/start-anvil.md)

Spawn an anvil child process and verify it is ready via `eth_chainId`.

## Signature

~~~ts
export async function startAnvil(
  opts?: { port?: number; chainId?: number }
): Promise<AnvilHandle>;
~~~

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `opts.port` | `number` | optional | Port to bind. If omitted, an OS-allocated free port is used |
| `opts.chainId` | `number` | optional | `--chain-id` to pass to anvil (`1` / `10` / `8453` ...). Defaults to anvil's 31337 |

## Returns

`AnvilHandle` — `{ port: number; stop: () => Promise<void> }`

## Throws

- `Error('anvil not found in PATH')` — `anvil` binary is missing
- `Error('anvil failed to listen within Nms')` — `eth_chainId` response timed out

## Example

~~~ts
import { startAnvil } from '@kiwa/core';

const handle = await startAnvil({ port: 8545 });
// ... run tests
await handle.stop();
~~~

## Example (multi-chain)

~~~ts
const l1 = await startAnvil({ port: 8554, chainId: 1 });
const l2 = await startAnvil({ port: 8555, chainId: 10 });
// L1 / L2 in parallel
await l1.stop();
await l2.stop();
~~~

## Related

- [`AnvilHandle`](./anvil-handle.md)
- [`getFreePort`](./get-free-port.md)
