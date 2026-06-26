# 🌱 kiwa v0.5 — release-time mutation gate + 8 component adapters

Just merged the v0.5 chain. **Highlights**:

## 1. `@kiwa-test/ui` covers 8 surfaces from one package

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

## 2. Release-time mutation gate

`scripts/check-mutation-gates.mjs` runs inside `.github/workflows/release.yml` and **blocks publish** if any package's [Mutation Score Indicator (MSI)](https://stryker-mutator.io/docs/mutation-testing-elements/mutation-score-indicator/) regresses below its per-package threshold.

| Package | MSI | Threshold |
|---|---|---|
| `@kiwa-test/api` | **96.06 %** | 90 |
| `@kiwa-test/a11y` | **93.62 %** | 90 |
| `@kiwa-test/ui` | **91.76 %** | 80 |
| `@kiwa-test/cli-test` | 89.69 % | 80 |
| `@kiwa-test/data` | 86.93 % | 80 |
| `@kiwa-test/spec` | 85.51 % | 80 |
| `@kiwa-test/core` | 85.09 % | 80 |
| `@kiwa-test/cli` | 84.44 % | 80 |
| `@kiwa-test/e2e` | 84.21 % | 80 |
| `@kiwa-test/observability` | 84.12 % | 80 |
| `@kiwa-test/visual` | 83.02 % | 80 |

Thresholds intentionally non-uniform: pure-logic packages enforce 90, thin wrappers around third-party libs hold at 80 to avoid getting trapped by equivalent mutants.

## 3. Coverage gate stays in place

`scripts/check-coverage-gates.mjs` continues to enforce Lines ≥ 90 / Branches ≥ 80 / Functions ≥ 90 / Statements ≥ 90 across all 11 packages.

## Try it

```bash
npm install @kiwa-test/core
# or
pnpm dlx @kiwa-test/cli init
```

- 📖 README · <https://github.com/cardene777/kiwa>
- 📦 npm · <https://www.npmjs.com/package/@kiwa-test/core>
- 🎬 71s overview · `assets/kiwa-promo-en.mp4` (see README inline)

## How can you help?

- Try it on your dApp / smart contract / SPA repo and file an Issue / Discussion if anything breaks.
- Adapter contributions welcome — `@kiwa-test/ui` is purpose-built for new framework adapters (the SolidJS adapter took 1 PR and 100 lines).
- Ideas for new test types (gRPC mock / Pact contract test / Storybook visual diff) — let's discuss in this thread or an Idea Discussion.

Thanks for reading 🌱

— @cardene777
