# Mock Design Spec (日本語)

> [🇬🇧 English](./MOCK-DESIGN.md) • [🇯🇵 日本語](./MOCK-DESIGN.ja.md)

dapp-e2e がサードパーティ wallet / AA SDK (WalletConnect / Safe / thirdweb / Privy / Biconomy ...) に対して **何をどこまで mock するか** を決める仕様書。 Phase D-3 の実装 PR が参照する SSOT。

## TL;DR

各 wallet / SDK は 5 観点のスコアリングに基づいて **3 段階の mock 精度 level** に分類する。 分類によって実 SDK を採用 (Level A)、 compatible mock を出す (Level B)、 behavioral pattern だけ示す (Level C) かを判定する。

| Level | アプローチ | SDK 依存 | 精度 | 維持コスト |
|---|---|---|---|---|
| **A — Real SDK Integration** | `peerDependencies` + 選択的 stub (relay / bundler / paymaster) | あり | 高 | 高 (SDK breaking change 追従) |
| **B — Compatible Mock** | SDK の public interface を模倣、 内部実装は mock | なし | 中 | 中 |
| **C — Behavioral Pattern** | 抽象的振る舞い pattern のみ提示 (multi-sig / embedded wallet 等) | なし | 低 | 低 |

---

## なぜこの仕様書が必要か

実 dApp 利用者は MetaMask 以外に Safe / thirdweb inAppWallet / Biconomy / WalletConnect v2 を多用する。 「全部を忠実に mock する」 が一見良さげに見えるが以下の問題が起きる:

- SDK の breaking change で fixture が四半期ごとに腐る
- install size が爆発する (Web3Auth / Pimlico 等は数 100 KB)
- mock と実 SDK の挙動差で偽陽性混入

維持可能性を保つため、 新 wallet / SDK の要望が来るたびに **判断プロトコル** が必要。

## 5 観点スコアリング

新 wallet / SDK 候補ごとに以下 5 観点で 0/1 をスコア。 **合計値が精度 level を決める**。

| # | 観点 | +1 条件 |
|---|---|---|
| 1 | SDK API stability | minor 改修が四半期に 1 回以下 |
| 2 | 利用者数 | 月間 active dApp > 10k |
| 3 | SDK 自体の test mode | SDK が公式に test fixture / sandbox を提供 |
| 4 | install size 影響 | peerDeps 追加で gzipped < 500 KB |
| 5 | use case 数 | dApp test で意味のある pattern 3+ (sign / send / multi-account / paymaster ...) |

**合計** → 精度 level:

- **3+** → Level A (Real SDK Integration)
- **1–2** → Level B (Compatible Mock)
- **0** → Level C (Behavioral Pattern)

境界 case (ちょうど 3 点) は install size の重さが主リスクなら Level B を推奨。

## Wallet / SDK 分類 (初期配分)

| Wallet / SDK | API stability | 利用者数 | test mode | size | use case | **合計** | **Level** | 根拠 |
|---|---|---|---|---|---|---|---|---|
| **WalletConnect v2** | +1 | +1 | +1 | +1 | +1 | **5** | **A** | 利用者最多、 spec 安定、 公式 test wallet あり、 size 中 |
| **Safe (Gnosis Safe)** | +1 | +1 | 0 | +1 | 0 | **3** | **B** (境界) | API 安定だが SDK が重い、 mock contract で等価カバー可 |
| **thirdweb inAppWallet** | 0 | +1 | 0 | 0 | +1 | **2** | **B** | API 進化中、 bundle 大、 behavioral mock の方が安全 |
| **Privy / Dynamic** | 0 | +1 | 0 | 0 | 0 | **1** | **B** | embedded-wallet pattern が SDK 仕様より重要 |
| **Biconomy / ZeroDev / Alchemy AA** | 0 | +1 | 0 | 0 | +1 | **2** | **B** | bundler / paymaster 挙動を SDK 依存なしで mock 可 |
| **Coinbase Wallet** | +1 | +1 | +1 | +1 | 0 | **4** | **A** | 既に EIP-6963 announce で対応済、 追加作業不要 |
| **Ledger / Trezor** | +1 | 0 | 0 | 0 | 0 | **1** | **対応外** | HID / Bluetooth mock は非実用、 実 device test 別ツールへ |
| **Phantom (EVM mixed)** | 0 | 0 | 0 | 0 | 0 | **0** | **対応外** | Solana primary、 EVM scope 限定維持 |

## Level A — Real SDK Integration

### dapp-e2e が提供するもの

- 該当 wallet / SDK を `peerDependencies` に追加 (利用者は自分で install)
- dapp-e2e fixture が SDK の標準 entry point を wrap
- 外部 infra (relay / bundler / paymaster) 依存部だけ stub 化

### dapp-e2e が提供しないもの

- SDK の public API の再実装
- SDK を別名で隠蔽

### 例フロー (WalletConnect v2)

1. 利用者が自分で `@walletconnect/web3wallet` を install
2. dapp-e2e が in-memory relay stub を提供 (実 WalletConnect cloud project 不要)
3. 利用者は test 内で `walletKit.pair(...)` を実 wallet 接続と同じ書き方で呼ぶ
4. dapp-e2e が session proposal / response を stub 経由でルーティング

### Trade-offs

| 利点 | 欠点 |
|---|---|
| 実 SDK bug が再現できる | 四半期 SDK 更新で test 壊れる可能性 |
| test が production code と同じ書き方 | install size 増 |
| SDK 公式 docs と整合 | SDK 入れられない利用者には届かない |

## Level B — Compatible Mock

### dapp-e2e が提供するもの

- 実 SDK と **同じ TypeScript interface** を粗いレベルで提供する mock module
- 内部実装は dapp-e2e contributors が書く (mock contract deploy + deterministic data 返却)

### dapp-e2e が提供しないもの

- 上流 SDK の minor / patch release を逐一追従
- production tx との bit 単位互換性

### 例フロー (Safe)

1. dapp-e2e が `examples/nextjs-safe-multisig/` で Safe contract を自前 deploy (threshold + module + guard 振る舞いを再現)
2. fixture で `useSafe()` 風 hook を `@safe-global/safe-react-hooks` と同じ shape で提供
3. multi-sig threshold sign / module execution / guard reject を mock contract に対して test
4. production 移行時は import を実 `@safe-global/safe-react-hooks` に差し替えるだけ

### Trade-offs

| 利点 | 欠点 |
|---|---|
| SDK 依存なし、 install size 小 | mock と実 SDK が時間とともに乖離する可能性 |
| 維持コスト安定 | 実 SDK 固有 quirk が再現できないと偽陽性リスク |
| CI flake 解消には十分忠実 | production bug 再現は限定的 |

## Level C — Behavioral Pattern

### dapp-e2e が提供するもの

- wallet カテゴリの **形** を抽出した汎用 helper / pattern (例: 「multi-sig threshold sign」「embedded wallet with key escrow」)
- 特定 SDK 名は出さない

### dapp-e2e が提供しないもの

- 名前付き SDK との drop-in 互換性
- 実 SDK bug の検出保証

### 例フロー (Privy / Dynamic embedded wallet)

dapp-e2e は「embedded wallet」の汎用 pattern (private key を server-side 保管、 signature 要求は stub auth endpoint 経由で round-trip) を Privy / Dynamic と名指しせず documentation する。 利用者は自分の SDK に pattern を読み替える。

### Trade-offs

| 利点 | 欠点 |
|---|---|
| 維持負荷最低 | 利用者が自分の SDK に読み替える必要 |
| SDK 変動に強い | 実 SDK 固有挙動は見えない |
| 教材性も兼ねる | 「Safe drop-in 対応」より魅力低い |

## 偽陽性の境界

各 level で実環境との既知差分を documentation する。 利用者が「dapp-e2e で十分か、 実 infra での staging test も必要か」を判断できるようにする。

| 境界 | Level A | Level B | Level C |
|---|---|---|---|
| 実 relay network 失敗 (timeout / drop) | ❌ in-memory stub only | ❌ N/A | ❌ N/A |
| 実 bundler policy 違反 revert | ❌ stub bundler は全許可 | ❌ 同上 | ❌ 同上 |
| 実 paymaster gas 推定 error | ❌ paymaster 寛容に mock | ❌ 同上 | ❌ 同上 |
| smart account upgrade hook | ✅ 実 SDK 経由 | ⚠️ mock 精度依存 | ❌ pattern only |
| RPC provider rate limit | ❌ 再現不可 | ❌ 同上 | ❌ 同上 |

これらの境界を検証したい利用者は dapp-e2e CI に加えて **実 testnet での staging test** を実施する。

## 新 wallet / SDK 追加時の判定手順

1. 候補を 5 観点でスコア
2. 対応 level を選択 (A / B / C)
3. issue を `feat(wallet-support): <name> at Level <X>` タイトルで起票し `wallet-support` label
4. Phase D maintainer が 1 週間以内にスコアレビュー
5. 実装 PR は本仕様書を description で参照

## Roadmap

| Phase | Scope | 対象 |
|---|---|---|
| **D-3a** | WalletConnect v2 を Level A で | `examples/nextjs-walletconnect-v2/` |
| **D-3b** | Safe を Level B で | `examples/nextjs-safe-multisig/` |
| **D-3c** | thirdweb を Level B で | `examples/nextjs-thirdweb-aa/` |
| **D-3d** | Privy / Dynamic を Level C で | docs cookbook 章のみ |
| **D-3e** | Biconomy / ZeroDev / Alchemy を Level B で | `examples/nextjs-aa-paymaster/` |
| **D-4** | mainnet fork での AA full flow | `examples/nextjs-aa-mainnet-fork/` |

Phase 順は実装難易度ではなく **利用者数** で決める。 WalletConnect v2 が最初なのは最大母数を unlock するため。

## 関連

- [`docs/COMPARISON.md`](./COMPARISON.md) — Synpress / wallet-mock との使い分け
- [`.claude/skills/dapp-e2e-test/references/adversarial-pitfalls.md`](../.claude/skills/dapp-e2e-test/references/adversarial-pitfalls.md) — 偽陽性パターン 9 種 + self-check
- [`docs/ja/cookbook/smart-wallet-aa.md`](./ja/cookbook/smart-wallet-aa.md) — 既存 AA (ERC-4337) test pattern
