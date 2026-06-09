# waitForChainState

> [🇬🇧 English](./wait-for-chain-state.md) • [🇯🇵 日本語](../../ja/api/wait-for-chain-state.md)

Poll a contract view function until a predicate returns true.

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
| `opts.publicClient` | `PublicClient` | ✓ | viem public client |
| `opts.address` | `\`0x\${string}\`` | ✓ | Contract address |
| `opts.abi` | `readonly unknown[]` | ✓ | Contract ABI (`as const`) |
| `opts.functionName` | `string` | ✓ | View function to call |
| `opts.args` | `readonly unknown[]` | optional | Function arguments |
| `opts.predicate` | `(value: TValue) => boolean` | ✓ | Stop polling when this returns true |
| `opts.timeoutMs` | `number` | optional | Timeout (default 10_000) |
| `opts.pollIntervalMs` | `number` | optional | Poll interval (default 200) |

## Returns

`TValue` — The first value that satisfied the predicate

## Throws

- `Error('waitForChainState timeout after Nms')` — Timeout exceeded

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

## Why this helps

`page.waitForTimeout(N)` + UI text scraping leaves ordering dependencies in your test.
`waitForChainState` reads contract state directly, eliminating polling-timing flakiness.

## Related

- [Cookbook: Time manipulation](../cookbook/time-manipulation.md)
