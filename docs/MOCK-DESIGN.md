# Mock Design Spec

> [🇬🇧 English](./MOCK-DESIGN.md) • [🇯🇵 日本語](./MOCK-DESIGN.ja.md)

How dapp-e2e decides **what to mock and at what fidelity** for third-party wallets and AA SDKs (WalletConnect, Safe, thirdweb, Privy, Biconomy, …). This document is the single source of truth referenced by Phase D-3 implementation PRs.

## TL;DR

Each wallet / SDK is classified into one of **3 mock fidelity levels** based on a 5-criterion score. The classification determines whether dapp-e2e adopts the real SDK (Level A), ships a compatible mock (Level B), or only exposes a behavioral pattern (Level C).

| Level | Approach | SDK dependency | Fidelity | Maintenance cost |
|---|---|---|---|---|
| **A — Real SDK Integration** | `peerDependencies` + selective stubs (relay / bundler / paymaster) | Yes | High | High (track SDK breaking changes) |
| **B — Compatible Mock** | Mimic the SDK's public interface, internal mock | No | Medium | Medium |
| **C — Behavioral Pattern** | Expose only the abstract pattern (multi-sig, embedded wallet, …) | No | Low | Low |

---

## Why this spec exists

Real dApp users adopt smart wallets (Safe, thirdweb inAppWallet, Biconomy, …) and connectors (WalletConnect v2) far beyond plain MetaMask. A naïve dapp-e2e response would be "mock everything as faithfully as possible", but that path leads to:

- SDK breaking changes silently rotting fixtures every quarter
- Install size bloat (Web3Auth, Pimlico, etc. each weigh hundreds of KB)
- False-positive risk when the mock and the real SDK diverge

To stay sustainable, dapp-e2e needs a **decision protocol** for each new wallet / SDK request.

## 5-criterion scoring

For each candidate wallet / SDK, score 0 / 1 for the following five criteria. The **total score selects the fidelity level**.

| # | Criterion | +1 condition |
|---|---|---|
| 1 | SDK API stability | Minor refactors land at most once per quarter |
| 2 | User base size | Monthly active dApps > 10k |
| 3 | SDK-provided test mode | The SDK officially ships a test fixture / sandbox |
| 4 | Install size impact | Adding the SDK to peerDeps costs < 500 KB gzipped |
| 5 | Distinct use-case count | The SDK exposes 3+ patterns relevant to dApp tests (sign / send / multi-account / paymaster / …) |

**Total** → fidelity level:

- **3+** → Level A (Real SDK Integration)
- **1–2** → Level B (Compatible Mock)
- **0** → Level C (Behavioral Pattern)

Border cases (exactly 3) prefer Level B when install size is the main risk.

## Wallet / SDK classification (initial allocation)

| Wallet / SDK | API stability | Users | Test mode | Size | Use cases | **Total** | **Level** | Rationale |
|---|---|---|---|---|---|---|---|---|
| **WalletConnect v2** | +1 | +1 | +1 | +1 | +1 | **5** | **A** | High user base, stable spec, official test wallet, manageable size |
| **Safe (Gnosis Safe)** | +1 | +1 | 0 | +1 | 0 | **3** | **B** (border) | API stable but heavy SDK; mock contracts give equivalent coverage |
| **thirdweb inAppWallet** | 0 | +1 | 0 | 0 | +1 | **2** | **B** | API still evolves, large bundle; behavioral mock is safer |
| **Privy / Dynamic** | 0 | +1 | 0 | 0 | 0 | **1** | **B** | Embedded-wallet pattern is more important than SDK specifics |
| **Biconomy / ZeroDev / Alchemy AA** | 0 | +1 | 0 | 0 | +1 | **2** | **B** | Bundler / paymaster behavior mockable without SDK |
| **Coinbase Wallet** | +1 | +1 | +1 | +1 | 0 | **4** | **A** | Already covered by EIP-6963 announce, no further work needed |
| **Ledger / Trezor** | +1 | 0 | 0 | 0 | 0 | **1** | **Out of scope** | HID / Bluetooth mocking impractical; defer to real-device test tools |
| **Phantom (EVM mixed)** | 0 | 0 | 0 | 0 | 0 | **0** | **Out of scope** | Solana primary; EVM scope only |

## Level A — Real SDK Integration

### What dapp-e2e ships

- The wallet / SDK is added to `peerDependencies` (the user must install it)
- dapp-e2e fixture wraps the SDK's standard entry points
- Only the parts that depend on remote infra (relay / bundler / paymaster) are stubbed

### What dapp-e2e does NOT do

- Reimplement the SDK's public API
- Hide the SDK behind a different name

### Example flow (WalletConnect v2)

1. The user installs `@walletconnect/web3wallet` themselves
2. dapp-e2e provides an in-memory relay stub so no real WalletConnect cloud project is required
3. The user calls `walletKit.pair(...)` in their test as if connecting a real wallet
4. dapp-e2e routes session proposals / responses through the stub

### Trade-offs

| Pro | Con |
|---|---|
| Real SDK bugs are reproducible | Quarterly SDK upgrades may break tests |
| Tests look identical to production code | Install size grows |
| Documentation matches official SDK docs | dapp-e2e cannot ship for users who can't install the SDK |

## Level B — Compatible Mock

### What dapp-e2e ships

- A mock module that **exposes the same TypeScript interface as the real SDK** (at a coarse level)
- Backing implementation written by dapp-e2e contributors (deploys mock contracts, returns deterministic data)

### What dapp-e2e does NOT do

- Track every minor / patch release of the upstream SDK
- Guarantee bit-for-bit compatibility with production transactions

### Example flow (Safe)

1. dapp-e2e ships `examples/nextjs-safe-multisig/` with stub Safe contracts (threshold + module + guard semantics)
2. The fixture exposes a `useSafe()`-style hook with the same shape as `@safe-global/safe-react-hooks`
3. Multi-sig threshold signing, module execution, and guard rejection are tested against the mock contracts
4. Users porting tests to production-grade Safe replace the import with the real `@safe-global/safe-react-hooks`

### Trade-offs

| Pro | Con |
|---|---|
| No SDK dependency, smaller install | Mock and real SDK may diverge over time |
| Stable maintenance cost | False-positive risk if a real-SDK quirk isn't reproduced |
| Behaviorally faithful enough for CI flake elimination | Production bug reproduction limited |

## Level C — Behavioral Pattern

### What dapp-e2e ships

- A generic helper / pattern that captures the **shape** of a wallet category (e.g. "multi-sig threshold signing", "embedded wallet with key escrow")
- No reference to any specific SDK by name

### What dapp-e2e does NOT do

- Provide drop-in compatibility with a named SDK
- Promise that real-SDK bugs surface

### Example flow (Privy / Dynamic embedded wallets)

dapp-e2e documents the general "embedded wallet" pattern (private key stored server-side, signature requests round-tripped via a stub auth endpoint) without referencing Privy or Dynamic by name. Users adapt the pattern to whichever SDK they use.

### Trade-offs

| Pro | Con |
|---|---|
| Lowest maintenance burden | Users must adapt the pattern to their SDK themselves |
| Future-proof against SDK shifts | Real-SDK-specific behavior is invisible |
| Doubles as teaching material | Less attractive than "drop-in Safe support" |

## False-positive boundaries

Each level has known divergences from real environments. We document them so users can decide whether dapp-e2e is enough or whether they also need staging tests on real infra.

| Boundary | Level A | Level B | Level C |
|---|---|---|---|
| Real relay network failure (timeouts, dropped sessions) | ❌ in-memory stub only | ❌ N/A | ❌ N/A |
| Real bundler revert on bundler-policy violations | ❌ stub bundler accepts everything | ❌ same | ❌ same |
| Real paymaster gas estimation errors | ❌ paymaster mocked permissive | ❌ same | ❌ same |
| Smart account upgrade hooks | ✅ via real SDK | ⚠️ depends on mock fidelity | ❌ pattern only |
| RPC provider rate limiting | ❌ never reproduced | ❌ same | ❌ same |

Users who need to verify these boundaries should run **staging tests against real testnets** in addition to dapp-e2e CI.

## Decision when adding a new wallet / SDK

1. Score the candidate against the 5 criteria
2. Pick the corresponding level (A / B / C)
3. Open an issue with the title `feat(wallet-support): <name> at Level <X>` and tag it with `wallet-support`
4. Phase D maintainers review the score within 1 week
5. Implementation PR cites this spec in the description

## Roadmap

| Phase | Scope | Target |
|---|---|---|
| **D-3a** | WalletConnect v2 at Level A | `examples/nextjs-walletconnect-v2/` |
| **D-3b** | Safe at Level B | `examples/nextjs-safe-multisig/` |
| **D-3c** | thirdweb at Level B | `examples/nextjs-thirdweb-aa/` |
| **D-3d** | Privy / Dynamic at Level C | docs cookbook chapter only |
| **D-3e** | Biconomy / ZeroDev / Alchemy at Level B | `examples/nextjs-aa-paymaster/` |
| **D-4** | Mainnet-fork AA full flow | `examples/nextjs-aa-mainnet-fork/` |

Phases are sequenced based on user-base size, not difficulty. WalletConnect v2 ships first because it unlocks the largest population.

## See also

- [`docs/COMPARISON.md`](./COMPARISON.md) — How dapp-e2e compares with Synpress / wallet-mock
- [`.claude/skills/dapp-e2e-test/references/adversarial-pitfalls.md`](../.claude/skills/dapp-e2e-test/references/adversarial-pitfalls.md) — 9 false-positive patterns + self-check
- [`docs/en/cookbook/smart-wallet-aa.md`](./en/cookbook/smart-wallet-aa.md) — Existing AA (ERC-4337) test pattern
