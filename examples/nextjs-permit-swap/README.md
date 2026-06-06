# examples/nextjs-permit-swap

Gasless approve + swap built on EIP-2612 permit. Two contracts (`PermitToken` + `PermitSwap`) give you a permit signature → swap single-step flow.

## What you can try

- EIP-2612 permit (signed approve) typed-data signing
- `permit + swap` combined in a single tx (gasless flow)
- Permit nonce management + `InvalidSignature` revert past the deadline
- Verify a permit cannot be reused by a different spender (signature address check)

## How to run

```bash
pnpm -F examples-nextjs-permit-swap test
```

Next.js dev server runs on port 3036.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/permit-swap.spec.ts` | Permit sign → combined swap tx → balance check, plus deadline / nonce / spender boundaries, 7 cases |

## Related cookbook entries

- [Token approve flow](../../docs/en/cookbook/token-approve-flow.md)
- [Multi-wallet signature](../../docs/en/cookbook/multi-wallet-signature.md)
- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)

## Where to go next

- Plain-approve swap → [examples/defi-swap](../defi-swap/README.md)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
