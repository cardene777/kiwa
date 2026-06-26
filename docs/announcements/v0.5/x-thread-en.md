# x.com thread — English

> Account ... [@cardene777](https://x.com/cardene777)
> Voice ... maker-perspective ("I built this") in first person
> Video ... attach `assets/kiwa-promo-en.mp4` (9.1MB / 71s) to tweet [1/7]
> Limit ... ~280 chars per tweet
> Threads ... [1/7] … [7/7]

---

## [1/7] (attach mp4)

Just shipped kiwa v0.5 — an OSS test toolchain that generates contract tests, dApp e2e tests AND component tests for **7 SPA frameworks** (React/Vue/Svelte/Solid/Lit/Qwik/Angular) from a single Layer 1 spec.

71s overview ↓

https://github.com/cardene777/kiwa

#OSS #testing #web3

---

## [2/7]

Why does this matter? Writing tests is tedious. kiwa fuses spec-driven generation + Stryker mutation gates + 8 adapters + an AI skill chain into one toolchain.

Wires up Foundry, Hardhat, Playwright, Vitest, msw, axe-core, and pixelmatch through one spec.

---

## [3/7]

v0.5 headline: every one of the 11 npm packages now ships behind a **release-time mutation gate** with MSI ≥ 80 enforced by GitHub Actions:

• @kiwa-test/api → 96.06%
• @kiwa-test/a11y → 93.62%
• @kiwa-test/ui → 91.76%
• all 11 packages ≥ 80%

Coverage gate (Lines 90+ / Branches 80+) holds too.

---

## [4/7]

The component-test adapter (`@kiwa-test/ui`) covers **8 surfaces** out of one package:

React / Vue 3 / Svelte / SolidJS / Lit / Qwik / Angular + real Chromium via Playwright.

Same `mode + stop()` contract across `setup{Framework}ComponentEnv()`.

---

## [5/7]

Why bother covering every SPA framework? dApp UIs aren't React-only. ENS, wallet UIs, token explorers ship in Lit / Vue / Solid in the wild. kiwa keeps the test surface identical no matter which stack a team chose.

---

## [6/7]

Design decision worth calling out: per-package mutation thresholds. Pure-logic packages enforce 90 %; thin wrappers around third-party libs hold the line at 80 %. Lets you ship a tough gate without getting trapped by equivalent mutants.

---

## [7/7]

If you ship dApps, smart contracts, or rich SPAs, try kiwa:

📖 README https://github.com/cardene777/kiwa
💬 Discussions https://github.com/cardene777/kiwa/discussions
📦 `npm install @kiwa-test/core`

Issues / discussions / replies welcome 🌱
