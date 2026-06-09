# examples/nextjs-zk-verifier

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

Lightweight zk-proof verifier (`CommitmentVerifier` + `RangeProofVerifier`) verified through Playwright. Drives the typical proof construction → on-chain verify flow on top of the kiwa fixture.

## What you can try

- Build a commitment-style proof and verify on-chain
- Verify a range proof (value within a stated range)
- Custom-error revert for invalid proofs or out-of-range values
- Submit a proof via the verifier address
- Match proof payload against the resulting event

## How to run

```bash
pnpm -F examples-nextjs-zk-verifier test
```

Next.js dev server runs on port 3046.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/zk.spec.ts` | commitment build → verify, range proof build → verify, invalid-proof detection, 7 cases |

## Related cookbook entries

- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)

## Where to go next

- Multi-wallet signing → [examples/basic-connect](../basic-connect/README.md) (via EIP-6963)
- Smart Account → [examples/nextjs-aa-smart-account](../nextjs-aa-smart-account/README.md)
