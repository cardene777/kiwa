# examples/nextjs-safe-multisig

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

Safe (Gnosis Safe) multi-sig example using a Level B compatible mock as defined in [`docs/MOCK-DESIGN.md`](../../docs/MOCK-DESIGN.md). The mock reproduces the Safe v1.4 contract semantics (owners + threshold + execTransaction + nonce + module + guard) in TypeScript with viem's EIP-712 helpers, without taking a runtime dependency on the real `@safe-global/safe-react-hooks` SDK.

## What you can try

- `SafeProxyFactory.deploy(owners, threshold, salt)` with CREATE2-equivalent deterministic addressing
- `propose(to, value, data)` returning a SafeTx locked to the current nonce
- EIP-712 typed-data signing via viem `signTypedData`
- `execTransaction(safeTx, signatures[])` with strict signer checks (threshold, uniqueness, canonical ordering)
- Module path (`execTransactionFromModule`) bypassing owner signatures but still running guard hooks
- Guard rejection path (`checkTransaction` throwing → exec reverts)
- Nonce replay protection (`INVALID_NONCE` on second use of the same SafeTx)

## Why a mock instead of the real SDK

The first implementation attempt cloned the Safe contracts 1:1 but missed a critical bug: 1-of-2 signatures were silently accepted as if threshold = 2 was met (T-SAFE-003 spec encodes this regression). Shipping a half-working Safe mock to OSS users would mask real signature-verification mistakes in their dApps. The TypeScript mock in `lib/safe-mock.ts` enforces threshold, uniqueness, and canonical signer ordering strictly so the regression cannot recur.

The Level B classification in `docs/MOCK-DESIGN.md` covers Safe at score 3 (border case) — API stable but the heavy SDK + opaque signature recovery on the contract side outweigh the fidelity gain.

## How to run

```bash
pnpm install
pnpm -F examples-nextjs-safe-multisig test
```

Playwright starts a Next.js dev server on port 3046 and runs the 7 specs in `tests/safe.spec.ts`.

## Test coverage

| Test ID | What it covers |
|---|---|
| T-SAFE-001 | Deploy + initial state (owners, threshold, nonce = 0) |
| T-SAFE-002 | Exec with 2 owner sigs succeeds + nonce increments |
| T-SAFE-003 | 1-of-2 sigs reverts with `THRESHOLD_NOT_MET` (regression from first attempt) |
| T-SAFE-004 | Duplicate signatures revert with `DUPLICATE_SIGNER` |
| T-SAFE-005 | Module path executes without owner sigs |
| T-SAFE-006 | Guard rejecting `checkTransaction` reverts exec with `GUARD_REJECTED` |
| T-SAFE-007 | Nonce reuse reverts with `INVALID_NONCE` |

## Related

- [`docs/MOCK-DESIGN.md`](../../docs/MOCK-DESIGN.md) — Mock fidelity policy
- [`docs/COMPARISON.md`](../../docs/COMPARISON.md) — How kiwa positions itself vs Synpress / dappwright / wallet-mock
- [`examples/nextjs-walletconnect-v2`](../nextjs-walletconnect-v2/) — Companion Level B example for WalletConnect v2
