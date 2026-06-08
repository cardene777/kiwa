# Metamask Extension Fixture PoC (Issue #237)

Real Metamask 拡張機能を Playwright + chromium に load し、 anvil network 追加 → ConnectButton 接続まで自動化する PoC。
4 機能 (extension load / seed onboarding / network 追加 / connect flow) の Go/No-Go 判定材料を作る。

## 判定 — 🔧 No-Go (2026-06-09)

MetaMask v13.34.0 の onboarding flow に **Pin extension wizard が強制挿入** され、 「Open wallet」 button が `disabled = H && q` (H=wizard 表示 mode、 q=loading state) で永続 disabled になる。
DOM 操作で disabled 属性を剥がして click を通しても navigation dispatch が発火せず home 到達せず。
詳細解析と試行ログは [Issue #237 コメント](https://github.com/cardene777/kiwa/issues/237#issuecomment-4654411626) を参照。

成果物は **将来 wizard 突破手段が見つかった際の出発点として残置** する (selector / step は v13.34.0 で全て identify 済)。

## 前提

- macOS (本 PC 環境で検証)
- Node.js 20+ / pnpm 10+
- Foundry の `anvil` が PATH に存在
- Playwright chromium がインストール済 (`pnpm exec playwright install chromium`)

## scope

| scope | 内容 |
|---|---|
| 含む | extension load / seed setup / network 追加 / 最小 dApp の connect flow |
| 含まない | tx 承認 popup / account switch / chain switch / multi-wallet / CI workflow / 公式 docs |

## license note

Metamask は非 OSS で、 非商用 (< 10K MAU) 用途のみ自動化 test での利用が許諾される。
crx / zip / unpacked extension の再配布は禁止のため、 `.gitignore` で commit 対象外にし、 PoC 起動時に都度 download する。

## 実行手順

```bash
cd packages/core/poc/metamask-extension

# 1) Metamask zip を download + 展開 (初回のみ、 約 60s)
pnpm exec tsx download-metamask.ts

# 2) PoC を 1 回実行
pnpm exec playwright test --config playwright.config.ts

# 3) 5 回連続 PASS で安定性 verify
pnpm exec playwright test --config playwright.config.ts --repeat-each=5
```

## file 構成

```
packages/core/poc/metamask-extension/
├── README.md                  # 本 file
├── .gitignore                 # extension/ + *.zip + .user-data/ 除外
├── playwright.config.ts       # PoC 専用 playwright config (headless: false 必須)
├── download-metamask.ts       # crx zip download + unpack
├── metamask-fixture-poc.ts    # extension load + onboarding + network + connect の helper
├── poc-test.spec.ts           # 4 機能 end-to-end spec
└── dapp-page.html             # 最小 dApp page (Connect button のみ)
```

## Go/No-Go 判定基準

| 判定 | 条件 |
|---|---|
| ✅ Go | 5 回連続 PASS + 1 round の実行時間 < 90s + selector flake なし |
| 🟡 条件付 Go | 5 回中 4 回以上 PASS + 失敗時のリトライ戦略が明確 |
| ❌ No-Go | 安定 PASS < 80% or 公式 selector が変動する症状 |

## 既知の課題候補

- `headless: false` 制約 — CI で xvfb が必要、 macOS GUI 必須
- selector drift — Metamask の minor version up で testId が変わる事例あり (dappwright も version 固定で対応)
- onboarding flow の version 依存 — v13.34.0 では `onboarding-terms-checkbox` が追加されている (v13.17.0 にはない)
