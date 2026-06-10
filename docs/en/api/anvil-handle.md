# AnvilHandle

> [🇬🇧 English](./anvil-handle.md) • [🇯🇵 日本語](../../ja/api/anvil-handle.md)

Return type of `startAnvil`. Carries the port and a stop helper.

## Signature

~~~ts
export interface AnvilHandle {
  port: number;
  stop: () => Promise<void>;
}
~~~

## Fields

| Name | Type | Description |
|---|---|---|
| `port` | `number` | Port the spawned anvil is listening on |
| `stop` | `() => Promise<void>` | Graceful SIGTERM → SIGKILL shutdown |

## Example

~~~ts
import { startAnvil, type AnvilHandle } from '@kiwa-test/core';

let handle: AnvilHandle | undefined;

export default async function globalSetup() {
  handle = await startAnvil({ port: 8545 });
}

export async function globalTeardown() {
  await handle?.stop();
}
~~~

## Related

- [`startAnvil`](./start-anvil.md)
