1/ 🌱 kiwa v1.11 shipped — quality gate 補強. 6/6 sub-issues resolved.

Focus shift from "add more providers" (v1.10) to "measure release quality with numbers" (v1.11).

Every provider now reports the same 5-axis score. Release gate has SSOT thresholds. 3 dogfood apps run real-vs-mock fidelity checks.

2/ @kiwa-lab/quality-metrics v0.1 — the unified harness.

5 axes: coverage / test count / fidelity / perf p95 / mutation kill rate.

Default thresholds: line 85% / branch 80% / function 90% / fidelity 70% / perf p95 ≤ 100ms / mutation 60% / behavior tests ≥ 10.

SSOT lives at docs/quality/release-gate.md.

3/ Dogfood 3 apps — real vs mock, side by side.

examples/dogfood-supabase-saas-app/ (Next.js + Supabase Auth).
examples/dogfood-rabbitmq-worker-app/ (worker + DLX/delayed/quorum/federation/reconnect).
examples/dogfood-foundry-dapp/ (Solidity ERC20 + Rust adapter).

Same "provider-neutral interface + KIWA_MODE=real|mock" template, in both TypeScript and Rust.

4/ Real-world release-gate discovery — v1.11-3 dogfood FAILED the gate with perf.p95Ms = 548ms (threshold 100ms).

Proof that SSOT thresholds have teeth, not just paperwork.

5/ Docs 3 pillars — tutorials + migrations + API reference.

5 self-contained tutorials (Supabase / RabbitMQ / Rust contract / Next.js Server Actions / multi-provider auth).

Each pastes directly into an empty repo and runs. Fixed 5-section template.

Migration guides for v1.9→v1.10 + v1.10→v1.11, additive-only.

6/ VitePress + GitHub Pages — CI-free publication.

docs/.vitepress/config.ts builds tutorials + migrations + quality reports + release gate + API refs into one navigable site with full-text search.

/docs-publish-kiwa skill runs pnpm docs:build → git worktree → gh-pages push. Zero GitHub Actions.

7/ Full changelog: https://github.com/cardene777/kiwa/issues/680

Next up: v1.12 candidates include Storybook integration, Dragonfly (2025 cache), Reth (Rust Ethereum client), Go Iris + Chi, Realtime layer (Supabase Realtime + Ably), AI/LLM mocks, Payment (Stripe + Paddle), Search (Meilisearch + Algolia).

Follow @cardene777 for release cadence.
