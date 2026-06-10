# examples/nextjs-walletconnect-v2

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

[`docs/MOCK-DESIGN.md`](../../docs/MOCK-DESIGN.md) で Level B (compatible mock) と分類された WalletConnect v2 の example。 `@walletconnect/sign-client` の public surface (pairing / session lifecycle / request routing) を runtime 依存なしで mock し、 dApp 開発者が WC SDK breaking change の影響を受けずに connect / sign / disconnect flow を検証できるようにする。

## 何が試せるか

- `wc:` URI 生成 (実 SDK と同じ shape: `wc:{topic}@2?relay-protocol=irn&symKey={symKey}`)
- in-memory relay で完結する pair → propose → approve session lifecycle
- `personal_sign` / `eth_sendTransaction` / `eth_signTypedData_v4` request routing
- dApp UI を reset する disconnect cleanup
- wallet 側が応答しない時の approval timeout (`PROPOSAL_EXPIRED`)

## 実 SDK ではなく mock を使う理由

`docs/MOCK-DESIGN.md` の Level B 分類は「実 WalletConnect SDK 統合は数百 KB を install size に追加し、 四半期ごとの SDK breaking change で test suite が壊れる」 と評価している。 mock は public surface を安定保持するので、 dApp 開発者はこれらコストなしで pair / sign / disconnect flow を検証できる。 5 軸 scoring の根拠は [`docs/MOCK-DESIGN.md`](../../docs/MOCK-DESIGN.md) を参照。

## 動かす

```bash
pnpm install
pnpm -F examples-nextjs-walletconnect-v2 test
```

Playwright config が port 3045 で Next.js dev server を起動し、 `tests/walletconnect.spec.ts` の 7 spec を実行する。

## test cover 範囲

| Test ID | 何を検証するか |
|---|---|
| T-WC-001 | `wc:` URI 生成が実 SDK と同じ shape を持つ |
| T-WC-002 | pairing が `disconnected` → `pairing` → `connected` に遷移 |
| T-WC-003 | approve で session topic / account / chainId が露出 |
| T-WC-004 | `personal_sign` request が active session 経由で routing |
| T-WC-005 | `eth_sendTransaction` request が active session 経由で routing |
| T-WC-006 | disconnect で session が破棄され UI が reset |
| T-WC-007 | wallet 側が応答しないと `PROPOSAL_EXPIRED` が表示 |

## 関連

- [`docs/MOCK-DESIGN.md`](../../docs/MOCK-DESIGN.md) — mock fidelity 方針
- [`docs/COMPARISON.md`](../../docs/COMPARISON.md) — kiwa の Synpress / dappwright / wallet-mock との立ち位置
- [`examples/nextjs-wagmi-rainbow`](../nextjs-wagmi-rainbow/) — RainbowKit ベースの connect flow example
