import { expect } from '@playwright/test';
import { decodeEventLog, type Abi, type TransactionReceipt } from 'viem';

export function expectEvent<TAbi extends Abi>(
  receipt: TransactionReceipt,
  abi: TAbi,
  eventName: string,
  expectedArgs?: Record<string, unknown>,
): void {
  const matching = receipt.logs
    .map((log) => {
      try {
        return decodeEventLog({ abi, data: log.data, topics: log.topics });
      } catch {
        return null;
      }
    })
    .filter((decoded): decoded is NonNullable<typeof decoded> => decoded?.eventName === eventName);

  expect(matching.length).toBeGreaterThan(0);

  if (expectedArgs) {
    const args = matching[0]!.args as Record<string, unknown>;
    for (const [key, value] of Object.entries(expectedArgs)) {
      expect(args[key]).toEqual(value);
    }
  }
}
