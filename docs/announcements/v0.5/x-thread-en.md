# x.com thread — English (polyglot voice)

> Account ... [@cardene777](https://x.com/cardene777)
> Voice ... maker first-person ("I built this")
> Video ... attach `assets/kiwa-promo-en.mp4` (7.0MB / 80s) to tweet [1/8]
> Limit ... ~280 chars per tweet
> Threads ... [1/8] … [8/8]

---

## [1/8] (attach mp4)

Just shipped kiwa v0.5 — a **polyglot test toolchain** that turns one Layer 1 spec into every test layer your stack actually needs: contract, API, component, e2e, a11y, visual.

Release-time Coverage + Mutation gates enforced by GitHub Actions.

80s overview ↓

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

The pain point: your test stack is **scattered across mismatched runners** — Foundry / Hardhat for contracts, Vitest for unit + API, Playwright for e2e, Testing Library for components, axe-core for a11y, pixelmatch for visual, pytest for Python services.

kiwa fuses them into one chain.

---

## [3/8]

Six test surfaces, one toolchain:

1. Contract (Foundry / Hardhat)
2. API integration (msw / supertest)
3. Component (8 framework adapters)
4. E2E (Playwright + anvil + viem)
5. A11y + Visual (axe-core / pixelmatch)
6. Data / CLI / Observability

dApps and smart contracts are first-class — but so is everything else.

---

## [4/8]

Polyglot from day one:

- **TypeScript** — 11 npm packages
- **Python** — 1 PyPI package (`kiwa-test-py`)
- **Solidity** — Foundry / Hardhat bridges

Rust / Go on the roadmap. The whole point: spec **once**, generate test layers across the languages your stack actually uses.

---

## [5/8]

v0.5 headline: every one of the 11 npm packages now ships behind a **release-time mutation gate** with MSI ≥ 80 enforced by GitHub Actions.

• @kiwa-lab/api → 96.06%
• @kiwa-lab/a11y → 93.62%
• @kiwa-lab/ui → 91.76%
• all 11 packages ≥ 80%

Coverage gate (Lines 90+ / Branches 80+) holds too.

---

## [6/8]

The component-test adapter (`@kiwa-lab/ui`) covers **8 surfaces from one package**:

React / Vue 3 / Svelte / SolidJS / Lit / Qwik / Angular + real Chromium via Playwright.

Same `mode + stop()` contract. Thin wrapper design = new adapters land in ~100 LOC.

---

## [7/8]

Design call worth flagging: per-package mutation thresholds. Pure-logic packages enforce 90 %; thin wrappers around third-party libs hold the line at 80 %. Lets you ship a tough gate without getting trapped by equivalent mutants.

---

## [8/8]

If your stack feels like it has too many runners and too few specs, try kiwa:

📖 README · https://github.com/cardene777/kiwa
💬 Discussions · https://github.com/cardene777/kiwa/discussions/451
📦 `npm install @kiwa-lab/core`
🐍 `pip install kiwa-test-py`

Issues / discussions / replies welcome 🌱
