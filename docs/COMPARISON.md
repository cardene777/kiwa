# Tool comparison

> [🇬🇧 English](./COMPARISON.md) • [🇯🇵 日本語](./COMPARISON.ja.md)

This document is intended for users who want to compare kiwa with existing wallet E2E companion tools.
The contents are organized based on kiwa's capabilities as of v0.1.0, that is, as of 2026-06,
and the roles described in each official repository / docs.
The conclusion first: kiwa is positioned for stable headless E2E operation using anvil.

## Comparison table

| Aspect | Synpress | dappwright | wallet-mock | kiwa |
|---|---|---|---|---|
| Primary target | E2E including real wallet integration | Real MetaMask / Coinbase Wallet extension automation | Headless wallet injection | dApp E2E assuming a local chain |
| Browser side | Playwright / Cypress + wallet extension integration | Playwright + extension download / unpack helpers | Inject a mock wallet into Playwright | Inject `window.ethereum` into Playwright |
| chain backend | Any backend paired with a real wallet | Any backend paired with a real wallet | Mock responses or arbitrary transport | Start anvil per test |
| Signing / transfers | Via the wallet UI | Via the wallet UI | Via mock or transport | Handled directly with anvil dev accounts |
| CI stability | Medium | Medium (depends on MetaMask version) | High | High |
| Best fit | Verifying wallet UX | Lightweight extension automation | Verifying provider replacement | Verifying connection flows on a local chain |

This is not a case where one tool is always superior.
They target different things.
In practice, it is best to choose based on whether your focus is wallet UI, provider mocking, or a local chain.

## Positioning of kiwa

kiwa prioritizes the following three points.

- The ability to start anvil directly per test
- The ability to run headlessly without bringing in a browser extension
- The ability to reuse the minimum EIP-1193 core as a fixture

In exchange, it does not cover checking wallet popup copy or reproducing extension UI interactions.
This is also why the top of the README says to separate real MetaMask UI verification into another tool.

## Selection guide

### When to choose Synpress

- You want to cover connection, approval, and rejection flows through a real wallet UI
- You want to catch rendering issues on the browser extension side as well as in the dApp
- You want to keep using a Playwright- or Cypress-based setup with a wallet extension

Synpress is a strong option when you want to bring in integration with a real wallet implementation.
On the other hand, because it adds browser setup and extension dependencies,
it often becomes more than you need when the goal is just to run headless tests quickly.

### When to choose dappwright

- You want a lightweight Playwright helper that automates MetaMask or Coinbase Wallet extensions
- You only need extension download / unpack / load helpers without the full Synpress stack
- You are comfortable pinning a specific MetaMask version that dappwright is known to support

dappwright sits between Synpress and wallet-mock in terms of scope.
It bundles extension automation as a thin Playwright helper rather than as a full E2E framework, which keeps the surface area smaller than Synpress.
On the other hand, real MetaMask extension automation as a whole has structural fragility with recent MetaMask versions (see the next section), so the same caveats around CI stability apply.

### When to choose wallet-mock

- You want to inject a provider headlessly
- You want fine-grained control over mocked responses
- You care more about verifying dApp-side branches than about connecting to a real chain

wallet-mock is close in spirit in that it injects a wallet into Playwright,
but it assumes the consumer will build anvil lifecycle management and local-chain isolation themselves.
It is a good fit for tests where you want full freedom to swap transports.

### When to choose kiwa

- You want to run dApp E2E against a local chain backed by anvil that you set up yourself
- The minimal provider surface is enough, and you do not need wallet UI
- You want to call `window.ethereum` requests / events directly from the page
- You want startup, injection, and teardown to stay contained within Playwright fixtures alone

kiwa is the best fit for the use case of headlessly testing the dApp itself on a local chain.
If you want to bundle the flow from `eth_requestAccounts` through `eth_sendTransaction` into one fixture,
`examples/basic-connect` in this repository is the shortest path to get started.

## Rules of thumb

1. Choose Synpress or dappwright if wallet UI fidelity matters
2. Choose wallet-mock if provider replacement and mock control are the main goal
3. Choose kiwa if you want both local-chain dApp behavior and CI stability

## Why kiwa does not own MetaMask extension automation

kiwa deliberately leaves real MetaMask extension automation to Synpress and dappwright rather than implementing it in-house.
This is the result of running ten different automation approaches end-to-end during the PoC phase and finding a common structural blocker that one OSS library cannot route around.

The shared root cause across all ten attempts is that the MetaMask `chrome.sidePanel` API is undefined under automated browsers, the click handler falls through a `catch` branch, and the wallet-ready component keeps `disabled` true via its `H && q` guard so the navigation dispatch never fires.
We tried the README onboarding flow, longer waits, bypassing `manage-default-settings`, stripping `disabled` attributes, headful Chromium, downgrading to v13.17.0, full Synpress install, vendoring the MetaMask official e2e flow, vendoring dappwright, and writing the encrypted vault straight into `chrome.storage` — all ten ran into the same blocker.

The takeaway is not that any single library is broken, but that the structural blocker lives in MetaMask itself.
A library that wants to fully automate the real MetaMask extension has to track upstream changes closely and accept brittleness against new MetaMask versions, which is a sustained maintenance cost.
kiwa instead focuses on contract and UI logic testing on top of anvil and a minimal `window.ethereum` injection, and points users at Synpress or dappwright when they need to verify the real wallet UX.

Using more than one is also realistic.
For example, using kiwa for everyday regression coverage and Synpress only for wallet UX checks before release is a perfectly reasonable split.
The more a team wants to test the wallet layer and the dApp layer separately, the more this split pays off.

## Cases where kiwa is not a good fit

- You want to verify the exact copy or placement of buttons in an extension popup
- You want to observe conflicts between multiple wallet extensions or differences between browser profiles
- You want to fully mock the provider and decouple it from chain connectivity

In this area, kiwa's design as a minimum provider centered on anvil becomes a constraint directly.
If reproducing wallet UI is the main goal, Synpress is a better fit.
If transport-swapping flexibility is the main goal, wallet-mock aligns better with the design intent.

## Things to confirm before choosing kiwa

- Whether you have an environment where anvil is available
- Whether you can structure tests around a local anvil chain
- Whether you can separate wallet extension UI checks into another layer
- Whether you want to manage `viem` and Playwright on the host project side

If these four points are acceptable, there is a good chance kiwa's design will fit well.

## AI / spec-driven test generation comparison

The sections above compare kiwa with other dApp E2E fixtures, but kiwa also includes Claude Code skills (`/kiwa-design`, `/kiwa-forge`, `/kiwa-hardhat`, `/kiwa-play`, `/kiwa-vitest`, `/kiwa-api`, `/kiwa-review`, `/kiwa-test`) that design and generate tests across four layers (contract / unit / integration / e2e) from a single specification. This section compares that side of kiwa.

| Aspect | hardhat-test-suite-generator | Foundry / Hardhat AI plugins (2026) | Claude Code spec-driven dev | kiwa skill chain |
|---|---|---|---|---|
| Approach | Static template scaffold from contract ABI | LLM fuzz seed / invariant suggestion as plugin | Free-form spec → test → code iteration | 11-viewpoint spec → 4-layer test code |
| Scope | Hardhat contract test only | Contract layer (fuzz + invariant) only | General-purpose, language-agnostic | Contract + dApp e2e + unit + integration |
| Spec format | None (ABI-driven) | None (heuristic) | Free-form markdown | Fixed 9-section / 9-column markdown |
| Layer coverage | 1 (Hardhat) | 1 (fuzz / invariant on Foundry or Hardhat) | Determined per project | 4 (contract / unit / integration / e2e) |
| Review loop | None | None | Manual | `/kiwa-review` checks 11 viewpoints + spec drift |
| Best fit | Boilerplate scaffold for Hardhat | Fuzz / invariant augmentation | General LLM-assisted dev | dApp project covering contract + e2e simultaneously |

### When kiwa's skill chain shines

- You want spec → test → review → coverage report flowing in one command (`/kiwa-test --example {name}`)
- You want a single 9-column spec table to drive Foundry, Hardhat, Playwright, and Vitest in parallel
- You want the 11 viewpoints (happy / failure / boundary / state-transition / authorization / input-validation / idempotency / concurrency / performance / security / regression) explicitly applied to a dApp test suite

### When other tools fit better

- You only need Hardhat contract test scaffolding → `hardhat-test-suite-generator` is lighter
- You only need fuzz seed augmentation on an existing Foundry repo → Foundry AI plugins fit
- You want a general LLM-assisted dev loop with no dApp specifics → use Claude Code spec-driven dev as-is

## What kiwa uniquely owns

After comparing both axes (dApp E2E fixture and spec-driven test generation), kiwa's unique surface is the **4-layer chain in one entry point**:

```
/kiwa-design (Layer 1)
  ├─ /kiwa-forge        → Foundry .t.sol
  ├─ /kiwa-hardhat      → Hardhat .test.ts
  ├─ /kiwa-play         → Playwright .spec.ts (uses @kiwa-test/core fixture)
  ├─ /kiwa-vitest       → Vitest .test.ts (unit)
  ├─ /kiwa-api          → Vitest + msw / supertest (integration)
  └─ /kiwa-review       → spec vs implementation drift + 11 viewpoint coverage
```

No competitor in either axis covers all four layers (contract + unit + integration + e2e) from a single spec at the time of writing.

## Related

- [Synpress repository](https://github.com/Synthetixio/synpress)
- [dappwright repository](https://github.com/TenKeyLabs/dappwright)
- [wallet-mock repository](https://github.com/johanneskares/wallet-mock)
- [hardhat-test-suite-generator](https://github.com/ahmedali8/hardhat-test-suite-generator)
- [Claude Code spec-driven development](https://www.augmentcode.com/guides/claude-code-spec-driven-development)
- [Foundry anvil docs](https://book.getfoundry.sh/anvil/)
- [RPC.md](./RPC.md)
- [README.md](../README.md)
