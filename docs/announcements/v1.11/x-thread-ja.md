1/ 🌱 kiwa v1.11 リリース — quality gate 補強。 6/6 sub-issues 全 resolved。

v1.10 の「provider 拡張」 直交軸から、 「release 品質を数値で判断可能にする」 縦軸への思想シフト。

全 provider が同 5 軸 score を出す統一 harness、 release gate SSOT 化、 dogfood 3 app で real-vs-mock の behavioural fidelity 実測、 docs 全部を CI 全面禁止規約に沿って GitHub Pages 公開まで land。

2/ @kiwa-test/quality-metrics v0.1 — 5 軸統一 harness。

5 軸: coverage / test count / fidelity / perf p95 / mutation kill rate。

default 閾値: line 85% / branch 80% / function 90% / fidelity 70% / perf p95 ≤ 100ms / mutation 60% / behavior tests ≥ 10。

SSOT = docs/quality/release-gate.md。

3/ Dogfood 3 app — real vs mock を並べて実測。

examples/dogfood-supabase-saas-app/ (Next.js + Supabase Auth の login / MFA / SSO / SIWE)。
examples/dogfood-rabbitmq-worker-app/ (worker + DLX / delayed / quorum / federation / reconnect)。
examples/dogfood-foundry-dapp/ (Solidity ERC20 + Rust adapter)。

「provider-neutral interface + KIWA_MODE=real|mock」 の共通 template を TypeScript + Rust の 2 言語で再利用。

4/ Release gate SSOT の実運用初検証 — v1.11-3 dogfood で perf p95 548ms が 100ms 上限を超過して FAIL。

閾値が机上ではなく実運用意味を持つことを実測データで実証。

5/ Docs 3 pillars — tutorial + migration + API reference。

5 本 tutorial (Supabase / RabbitMQ / Rust contract / Next.js Server Actions / multi-provider auth)。

full copy-pasteable、 「What you'll build / Prerequisites / Step-by-step / Explanation / Troubleshoot」 5 セクション統一。

migration guide v1.9→v1.10 + v1.10→v1.11 (additive-only、 diff 形式、 verification コマンド付)。

6/ VitePress + GitHub Pages — CI 全面禁止規約下の publication。

docs/.vitepress/config.ts が tutorial + migration + quality report + release gate + API reference を統一 nav + full-text search でまとめる。

/docs-publish-kiwa skill が pnpm docs:build → git worktree → gh-pages push を local 実行。 GitHub Actions 一切使わず。

7/ Roadmap: https://github.com/cardene777/kiwa/issues/680

v1.12 候補: Storybook integration、 Dragonfly (2025 新興 cache)、 Reth (Rust Ethereum client)、 Go Iris + Chi、 Realtime layer (Supabase Realtime + Ably)、 AI/LLM mock、 Payment (Stripe + Paddle)、 Search (Meilisearch + Algolia)。

release cadence 追いたい人は @cardene777 まで。
