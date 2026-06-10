# examples/nextjs-safe-multisig

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

[`docs/MOCK-DESIGN.md`](../../docs/MOCK-DESIGN.md) で Level B (compatible mock) と分類された Safe (Gnosis Safe) multi-sig の example。 Safe v1.4 contract semantics (owners + threshold + execTransaction + nonce + module + guard) を TypeScript で viem の EIP-712 helper を使って再現し、 `@safe-global/safe-react-hooks` SDK への runtime 依存を持たない。

## 何が試せるか

- `SafeProxyFactory.deploy(owners, threshold, salt)` の CREATE2 相当の deterministic address 計算
- 現在 nonce に lock した SafeTx を返す `propose(to, value, data)`
- viem `signTypedData` 経由の EIP-712 typed-data signing
- 厳格 signer check (threshold / uniqueness / canonical ordering) 付き `execTransaction(safeTx, signatures[])`
- owner signature を skip するが guard hook は通る module path (`execTransactionFromModule`)
- guard が `checkTransaction` を throw して exec を revert させる経路
- 同じ SafeTx の再利用を防ぐ nonce replay protection (`INVALID_NONCE`)

## 実 SDK ではなく mock を使う理由

初回実装試行は Safe contract を 1:1 で複製したが、 critical bug を見逃した — 1-of-2 signature が threshold=2 を満たしているかのように silent に accept された (本 example の T-SAFE-003 spec がこの regression を固定する)。 中途半端な Safe mock を OSS user に publish すると、 dApp 開発者の signature 検証の誤りを覆い隠してしまう。 `lib/safe-mock.ts` の TS mock は threshold / uniqueness / canonical signer ordering を厳格に enforce、 この regression を構造的に再発不能にする。

`docs/MOCK-DESIGN.md` の Level B 分類は Safe を score 3 (border case) で評価 — API は安定だが heavy SDK + contract 側 opaque signature recovery で fidelity gain が install cost を上回らないと判断。

## 動かす

```bash
pnpm install
pnpm -F examples-nextjs-safe-multisig test
```

Playwright が port 3046 で Next.js dev server を起動し、 `tests/safe.spec.ts` の 7 spec を実行する。

## test cover 範囲

| Test ID | 何を検証するか |
|---|---|
| T-SAFE-001 | Deploy + 初期 state (owners / threshold / nonce = 0) |
| T-SAFE-002 | 2 owner sig で exec 成功 + nonce 増加 |
| T-SAFE-003 | 1-of-2 sig で `THRESHOLD_NOT_MET` revert (初回試行で見逃した regression) |
| T-SAFE-004 | 重複 signature で `DUPLICATE_SIGNER` revert |
| T-SAFE-005 | module 経由で owner sig なしで exec 成功 |
| T-SAFE-006 | guard が `checkTransaction` を throw → `GUARD_REJECTED` で revert |
| T-SAFE-007 | nonce 再利用で `INVALID_NONCE` revert |

## 関連

- [`docs/MOCK-DESIGN.md`](../../docs/MOCK-DESIGN.md) — mock fidelity 方針
- [`docs/COMPARISON.md`](../../docs/COMPARISON.md) — kiwa の Synpress / dappwright / wallet-mock との立ち位置
- [`examples/nextjs-walletconnect-v2`](../nextjs-walletconnect-v2/) — 同じ Level B 系列の WalletConnect v2 example
