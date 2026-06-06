# waitForChainState

contract view 関数を predicate が真になるまで poll する helper。

## Signature

~~~ts
export async function waitForChainState<TValue = unknown>(opts: {
  publicClient: PublicClient;
  address: `0x${string}`;
  abi: readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  predicate: (value: TValue) => boolean;
  timeoutMs?: number;        // default 10_000
  pollIntervalMs?: number;   // default 200
}): Promise<TValue>;
~~~

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `opts.publicClient` | `PublicClient` | ✓ | viem の public client |
| `opts.address` | `\`0x\${string}\`` | ✓ | contract address |
| `opts.abi` | `readonly unknown[]` | ✓ | contract ABI (`as const`) |
| `opts.functionName` | `string` | ✓ | 呼出 view 関数名 |
| `opts.args` | `readonly unknown[]` | optional | 関数引数 |
| `opts.predicate` | `(value: TValue) => boolean` | ✓ | true で終了 |
| `opts.timeoutMs` | `number` | optional | timeout (default 10_000) |
| `opts.pollIntervalMs` | `number` | optional | poll 間隔 (default 200) |

## Returns

`TValue` — predicate を最初に満たした値

## Throws

- `Error('waitForChainState timeout after Nms')` — 時間切れ

## Example

~~~ts
import { waitForChainState } from '@kiwa/core';
import { createPublicClient, defineChain, http } from 'viem';

const pub = createPublicClient({ chain: anvilChain, transport: http() });

const released = await waitForChainState<bigint>({
  publicClient: pub,
  address: VESTING,
  abi: vestingAbi,
  functionName: 'released',
  predicate: (v) => v === VEST_TOTAL,
  timeoutMs: 10_000,
});
~~~

## なぜ便利か

`page.waitForTimeout(N)` + UI text scraping は順序依存性が残ります。
`waitForChainState` は contract の確定状態を直接 read するため、polling timing 依存性を排除できます。

## 関連

- [Cookbook: 時間操作で test する](../cookbook/time-manipulation.md)
