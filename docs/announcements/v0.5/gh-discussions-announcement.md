# 🌱 kiwa v0.5 — polyglot test toolchain · Coverage + Mutation gates · 8 component adapters

A scattered test stack is the default. Contract tests live in Foundry, unit + API in Vitest, e2e in Playwright, components in Testing Library, a11y in axe-core, visual in pixelmatch, Python services in pytest. Every runner has its own conventions, fixtures, and gates — and **no single source of truth** ties them together.

kiwa v0.5 is the cut where I finally feel the toolchain solves that. **One Layer 1 spec → every test layer your stack actually needs, across TypeScript, Python, and Solidity.**

## 1. Six test surfaces, one spec

| Surface | Stacks |
|---|---|
| Contract | Foundry / Hardhat (Solidity) |
| API integration | msw / supertest / Vitest |
| Component | `@kiwa/ui` ships **8 adapters** (see § 2) |
| E2E | Playwright + anvil + viem + EIP-6963 + ERC-4337 |
| A11y + Visual | axe-core / pixelmatch |
| Data + CLI + Observability | queue / cron / shell IO / flaky detection |

dApps and smart contracts are first-class — but so is everything else.

## 2. `@kiwa/ui` covers 8 component surfaces from one package

| Framework | Helper |
|---|---|
| React | `setupComponentEnv` |
| Vue 3 | `setupVueComponentEnv` |
| Svelte | `setupSvelteComponentEnv` |
| SolidJS | `setupSolidComponentEnv` |
| Lit (Web Components) | `setupLitComponentEnv` |
| Qwik (resumable) | `setupQwikComponentEnv` |
| Angular | `setupAngularComponentEnv` |
| Browser (real Chromium) | `setupBrowserComponentEnv` |

All share the same `mode (render / interaction / snapshot) + stop()` contract. Optional peer deps mean you only install what you actually use.

## 3. Polyglot from day one

| Language | Packages | Notes |
|---|---|---|
| TypeScript | 11 npm packages | Primary surface — every adapter |
| Python | 1 PyPI package (`kiwa-test-py`) | `@kiwa/spec` Python port + requests / httpx adapter |
| Solidity | Foundry / Hardhat bridges | `/kiwa-forge` + `/kiwa-hardhat` from the same Layer 1 spec |

Rust / Go on the roadmap. The point: **spec once, generate test layers across the languages your stack actually uses.**

## 4. Release-time gates that actually fire

`scripts/check-coverage-gates.mjs` + `scripts/check-mutation-gates.mjs` run inside `.github/workflows/release.yml` and **block publish** if any package regresses below its threshold.

### Coverage gate

Lines / Statements / Functions ≥ 90 %, Branches ≥ 80 %, across all 11 packages.

### Mutation gate — [Mutation Score Indicator (MSI)](https://stryker-mutator.io/docs/mutation-testing-elements/mutation-score-indicator/)

| Package | MSI | Threshold |
|---|---|---|
| `@kiwa/api` | **96.06 %** | 90 |
| `@kiwa/a11y` | **93.62 %** | 90 |
| `@kiwa/ui` | **91.76 %** | 80 |
| `@kiwa/cli-test` | 89.69 % | 80 |
| `@kiwa/data` | 86.93 % | 80 |
| `@kiwa/spec` | 85.51 % | 80 |
| `@kiwa/core` | 85.09 % | 80 |
| `@kiwa/cli` | 84.44 % | 80 |
| `@kiwa/e2e` | 84.21 % | 80 |
| `@kiwa/observability` | 84.12 % | 80 |
| `@kiwa/visual` | 83.02 % | 80 |

Per-package thresholds are intentional — pure-logic packages enforce 90; thin wrappers around third-party libs hold at 80 to avoid getting trapped by equivalent mutants.

## Try it

```bash
npm install @kiwa/core
# or for Python services
pip install kiwa-test-py
# scaffold everything
pnpm dlx @kiwa/cli init
```

- 📖 README · <https://github.com/cardene777/kiwa>
- 📦 npm · <https://www.npmjs.com/package/@kiwa/core>
- 🐍 PyPI · <https://pypi.org/project/kiwa-test-py/>
- 🎬 80s overview · `assets/kiwa-promo-en.mp4` (see README inline)

## How can you help?

- Try it on a stack with **mixed test surfaces** (dApp + API + a11y, or Python service + REST contract, or a multi-framework UI). File an Issue / Discussion if anything breaks or feels awkward.
- Adapter contributions welcome — `@kiwa/ui` is purpose-built for new framework adapters (the SolidJS adapter took 1 PR and 100 LOC).
- Polyglot bridges are the most strategic contribution surface. Rust / Go ports of `@kiwa/spec` are on the roadmap — let's talk in this thread if you want to drive one.
- Ideas for new test surfaces (gRPC mock / Pact contract test / Storybook visual diff) — discuss in an Idea Discussion.

Thanks for reading 🌱

— @cardene777
