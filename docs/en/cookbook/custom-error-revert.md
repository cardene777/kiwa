# Assert custom-error reverts with expectCustomError

> [🇬🇧 English](./custom-error-revert.md) • [🇯🇵 日本語](../../ja/cookbook/custom-error-revert.md)

Use `expectCustomError` added in `@kiwa/core` v0.2 to concisely assert Solidity custom-error reverts.

## Problem

viem's `simulateContract` throws a `BaseError` on revert, with the custom error information nested inside `ContractFunctionRevertedError`. Inspecting `error.message` directly returns internal strings that can't be reliably matched, and writing the chain walk manually has historically led to duplicated helpers across 13 examples.

## Solution pattern

```ts
import { test, expect } from './fixture';
import { expectCustomError } from '@kiwa/core';
import { parseAbi, type Address } from 'viem';

const PROTECTED_ABI = parseAbi([
  'function protectedFn(uint256 value)',
  'error NotOperator()',
  'error InvalidValue()',
]);

test('T-CE-001 protectedFn from a non-operator reverts with NotOperator()', async ({ anvilPort }) => {
  const contract = process.env.NEXT_PUBLIC_PROTECTED_CONTRACT as Address;
  const { account, pub } = makeClients(anvilPort, NON_OPERATOR_PK);

  try {
    await pub.simulateContract({
      account: account.address,
      address: contract,
      abi: PROTECTED_ABI,
      functionName: 'protectedFn',
      args: [42n],
    });
    throw new Error('expected NotOperator revert');
  } catch (error) {
    expectCustomError(error, 'NotOperator');
  }
});
```

## Avoiding false positives

Mitigates `adversarial-pitfalls.md` **#3 (partial access-control checks)**:

- Iterate over **all protected functions** in a for-loop, not just one entrypoint
- Cover both happy path (legitimate operator) and failure path (non-operator)

```ts
const protectedFunctions = ['unlock', 'relayMint', 'setValue'];
for (const fn of protectedFunctions) {
  try {
    await pub.simulateContract({
      account: nonOperator.address,
      address: contract,
      abi: ABI,
      functionName: fn,
      args: [...],
    });
    throw new Error(`expected ${fn} revert`);
  } catch (error) {
    expectCustomError(error, 'NotOperator');
  }
}
```

## Notes

- `expectCustomError` re-throws if the input is not a viem `BaseError` (false-positive guard)
- Error name must exactly match the contract's `error NotOperator()` declaration (watch for typos)
- `simulateContract` only checks revert behavior. To assert on an actual tx, use `writeContract` + `waitForTransactionReceipt` and inspect receipt status.

## See also

- [API: expectCustomError](../api/test-helpers.md#expectcustomerror)
- [Concepts: error handling](../concepts/README.md)
