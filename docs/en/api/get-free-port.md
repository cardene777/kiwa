# getFreePort

> [🇬🇧 English](./get-free-port.md) • [🇯🇵 日本語](../../ja/api/get-free-port.md)

Obtain an OS-allocated free port.

## Signature

~~~ts
export async function getFreePort(): Promise<number>;
~~~

## Returns

`number` — An available TCP port (reserved via `net.createServer`)

## Example

~~~ts
import { getFreePort, startAnvil } from '@kiwa/core';

const port = await getFreePort();
const anvil = await startAnvil({ port });
~~~

## Note

`startAnvil({ port: undefined })` already calls `getFreePort` internally, so use this only when you explicitly need to control port allocation.

## Related

- [`startAnvil`](./start-anvil.md)
