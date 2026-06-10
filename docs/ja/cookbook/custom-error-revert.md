# Custom error revert を expectCustomError で検証する

> [🇬🇧 English](../../en/cookbook/custom-error-revert.md) • [🇯🇵 日本語](./custom-error-revert.md)

`@kiwa-test/core` v0.2 で追加された `expectCustomError` を使い、 Solidity custom error の revert を簡潔に assertion する pattern。

## 課題

viem の `simulateContract` は revert 時に `BaseError` を投げ、 中の `ContractFunctionRevertedError` に custom error 情報が入る。 直接 `error.message` を見ると internal 文字列が出るため正しく検証できず、 自前で chain walk を書くと 13 example で重複定義する事態になっていた。

## 解決パターン

```ts
import { test, expect } from './fixture';
import { expectCustomError } from '@kiwa-test/core';
import { parseAbi, type Address } from 'viem';

const PROTECTED_ABI = parseAbi([
  'function protectedFn(uint256 value)',
  'error NotOperator()',
  'error InvalidValue()',
]);

test('T-CE-001 非 operator から protectedFn を呼ぶと NotOperator() で revert', async ({ anvilPort }) => {
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

## 偽陽性対策

`adversarial-pitfalls.md` の **#3 access control の partial 検証** 対策:

- 1 entrypoint だけでなく **全 protected function** を for-loop で叩く
- happy path (正規 operator) と failure path (non-operator) の **両方** を test に含める

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

## 注意点

- `expectCustomError` は viem `BaseError` 以外を throw する (false positive 防止)
- error 名は contract の `error NotOperator()` 宣言と完全一致する必要あり (typo 注意)
- `simulateContract` は revert のみ。 実 tx を流したい場合は `writeContract` + `waitForTransactionReceipt` で receipt status を検証する

## 関連

- [API: expectCustomError](../api/test-helpers.md#expectcustomerror)
- [Concepts: error handling](../concepts/README.md)
