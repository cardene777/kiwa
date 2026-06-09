# AnvilHandle

> [🇬🇧 English](../../en/api/anvil-handle.md) • [🇯🇵 日本語](./anvil-handle.md)

`startAnvil` の戻り値型。port と stop helper を保持します。

## Signature

~~~ts
export interface AnvilHandle {
  port: number;
  stop: () => Promise<void>;
}
~~~

## Field

| Name | Type | Description |
|---|---|---|
| `port` | `number` | spawn した anvil が listen している port |
| `stop` | `() => Promise<void>` | SIGTERM → SIGKILL の段階的 graceful shutdown |

## Example

~~~ts
import { startAnvil, type AnvilHandle } from '@kiwa/core';

let handle: AnvilHandle | undefined;

export default async function globalSetup() {
  handle = await startAnvil({ port: 8545 });
}

export async function globalTeardown() {
  await handle?.stop();
}
~~~

## 関連

- [`startAnvil`](./start-anvil.md)
