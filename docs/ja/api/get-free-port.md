# getFreePort

> [🇬🇧 English](../../en/api/get-free-port.md) • [🇯🇵 日本語](./get-free-port.md)

OS allocate された free port を取得する helper。

## Signature

~~~ts
export async function getFreePort(): Promise<number>;
~~~

## Returns

`number` — 利用可能な TCP port (`net.createServer` で reserve 済み)

## Example

~~~ts
import { getFreePort, startAnvil } from '@kiwa/core';

const port = await getFreePort();
const anvil = await startAnvil({ port });
~~~

## 注意

`startAnvil({ port: undefined })` は内部で `getFreePort` を呼ぶため、明示的に port を制御したい場合のみ使ってください。

## 関連

- [`startAnvil`](./start-anvil.md)
