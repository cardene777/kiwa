# examples/vite-react-wagmi

Vite 5 + React 18 + wagmi v2 SPA exercising the kiwa fixture. Deploys `MintNft` and runs the connect → mint flow in an SPA shape.

## What you can try

- SPA on the Vite dev server (port 5180) + `window.ethereum` injection
- wagmi v2's `useAccount` / `useReadContract` / `useWriteContract`
- `MintNft` mint flow in an SPA layout
- prepare-env / fixture override shape when Next.js is not in play

## How to run

```bash
pnpm -F examples-vite-react-wagmi test
```

Vite dev server runs on port 5180 (bound to 127.0.0.1).

## Reading the tests

| File | What it covers |
|---|---|
| `tests/connect-and-mint.spec.ts` | wagmi connect → `MintNft.mint` → `useReadContract` balanceOf check, 3 cases |

## Related cookbook entries

- [Connect button test](../../docs/en/cookbook/connect-button.md)
- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)

## Where to go next

- Next.js + wagmi + RainbowKit → [examples/nextjs-wagmi-rainbow](../nextjs-wagmi-rainbow/README.md)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
