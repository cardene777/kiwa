import type { PublicClient } from 'viem';

export interface WaitForChainStateOptions<TValue> {
  publicClient: PublicClient;
  address: `0x${string}`;
  abi: readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  predicate: (value: TValue) => boolean;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

/**
 * Poll a contract view function until `predicate` returns true.
 *
 * Replaces `await page.waitForTimeout(N)` + UI text scraping by direct on-chain
 * read with a deterministic stop condition. Used by examples to remove
 * order-dependent assertion timing.
 *
 * @throws {Error} if the predicate is not satisfied within `timeoutMs`.
 */
export async function waitForChainState<TValue = unknown>(
  opts: WaitForChainStateOptions<TValue>,
): Promise<TValue> {
  const {
    publicClient,
    address,
    abi,
    functionName,
    args,
    predicate,
    timeoutMs = 10_000,
    pollIntervalMs = 200,
  } = opts;

  const start = Date.now();
  let lastValue: TValue | undefined;

  while (Date.now() - start < timeoutMs) {
    lastValue = (await publicClient.readContract({
      address,
      abi: abi as never,
      functionName,
      args: args as never,
    })) as TValue;

    if (predicate(lastValue)) {
      return lastValue;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(
    `waitForChainState timeout after ${timeoutMs}ms: ${functionName} did not satisfy predicate (last value: ${String(lastValue)})`,
  );
}
