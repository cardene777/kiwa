# examples/nextjs-walletconnect-v2

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

WalletConnect v2 example using a Level B compatible mock as defined in [`docs/MOCK-DESIGN.md`](../../docs/MOCK-DESIGN.md). The mock mimics the `@walletconnect/sign-client` public surface (pairing, session lifecycle, request routing) without taking a runtime dependency on the real SDK.

## What you can try

- `wc:` URI generation with the same shape as the real SDK (`wc:{topic}@2?relay-protocol=irn&symKey={symKey}`)
- Pair → propose → approve session lifecycle driven entirely by an in-memory relay
- `personal_sign` / `eth_sendTransaction` / `eth_signTypedData_v4` request routing
- Disconnect cleanup that resets the dApp UI
- Approval timeout (`PROPOSAL_EXPIRED`) when the wallet side never responds

## Why a mock instead of the real SDK

The Level B classification in `docs/MOCK-DESIGN.md` notes that real WalletConnect SDK integration adds ~hundreds of KB and exposes the test suite to quarterly SDK breaking changes. The mock keeps the public surface stable so dApp authors can validate their pair / sign / disconnect flows without those costs. See [`docs/MOCK-DESIGN.md`](../../docs/MOCK-DESIGN.md) for the 5-criterion scoring rationale.

## How to run

```bash
pnpm install
pnpm -F examples-nextjs-walletconnect-v2 test
```

The Playwright config starts a Next.js dev server on port 3045 and runs the 7 specs in `tests/walletconnect.spec.ts`.

## Test coverage

| Test ID | What it covers |
|---|---|
| T-WC-001 | `wc:` URI generation matches the real SDK shape |
| T-WC-002 | Pairing transitions from `disconnected` → `pairing` → `connected` |
| T-WC-003 | Approve exposes session topic / account / chainId |
| T-WC-004 | `personal_sign` request routes through the active session |
| T-WC-005 | `eth_sendTransaction` request routes through the active session |
| T-WC-006 | Disconnect tears down the session and resets the UI |
| T-WC-007 | `PROPOSAL_EXPIRED` is surfaced when the wallet side never approves |

## Related

- [`docs/MOCK-DESIGN.md`](../../docs/MOCK-DESIGN.md) — Mock fidelity policy
- [`docs/COMPARISON.md`](../../docs/COMPARISON.md) — How kiwa positions itself vs Synpress / dappwright / wallet-mock
- [`examples/nextjs-wagmi-rainbow`](../nextjs-wagmi-rainbow/) — RainbowKit-based connect flow example
