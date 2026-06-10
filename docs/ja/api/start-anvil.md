# startAnvil

> [🇬🇧 English](../../en/api/start-anvil.md) • [🇯🇵 日本語](./start-anvil.md)

anvil 子プロセスを spawn し `eth_chainId` 応答で起動完了を確認する helper。

## Signature

~~~ts
export async function startAnvil(
  opts?: { port?: number; chainId?: number }
): Promise<AnvilHandle>;
~~~

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `opts.port` | `number` | optional | 起動 port。省略時は OS allocate な free port |
| `opts.chainId` | `number` | optional | 起動時の `--chain-id` (`1` / `10` / `8453` 等)、省略時は anvil default 31337 |

## Returns

`AnvilHandle` — `{ port: number; stop: () => Promise<void> }`

## Throws

- `Error('anvil not found in PATH')` — `anvil` バイナリが見つからない
- `Error('anvil failed to listen within Nms')` — `eth_chainId` 応答が timeout

## Example

~~~ts
import { startAnvil } from '@kiwa-test/core';

const handle = await startAnvil({ port: 8545 });
// ... test 実行
await handle.stop();
~~~

## Example (multi-chain)

~~~ts
const l1 = await startAnvil({ port: 8554, chainId: 1 });
const l2 = await startAnvil({ port: 8555, chainId: 10 });
// L1 / L2 並走
await l1.stop();
await l2.stop();
~~~

## 関連

- [`AnvilHandle`](./anvil-handle.md)
- [`getFreePort`](./get-free-port.md)
