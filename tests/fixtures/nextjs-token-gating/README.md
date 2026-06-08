# tests/fixtures/nextjs-token-gating

Reference fixture that preserves the finished `examples/nextjs-token-gating` test suite outside the retrofit walkthrough workspace.

## Provenance

- Moved from `examples/nextjs-token-gating/{test,hardhat-test,tests}/`
- Baseline: PR #196, later relocated under issue #217

## Layout

- `contract-test/GatedContent.t.sol` - Foundry test
- `hardhat-test/GatedContent.test.cjs` - Hardhat test
- `e2e-test/gating.spec.ts` plus helper files - Playwright e2e test
- `contracts/` and `lib/` - copied from `examples/nextjs-token-gating/` via `cp -r`; sync them manually when the example contracts or libs change

## Run

```bash
pnpm --dir tests/fixtures/nextjs-token-gating test:foundry
pnpm --dir tests/fixtures/nextjs-token-gating test:hardhat
pnpm --dir tests/fixtures/nextjs-token-gating test:e2e
```

## Retrofit Relationship

`examples/nextjs-token-gating/{test,hardhat-test,tests}/` is the retrofit workbench and stays gitignored. Rebuild or compare regenerated tests there, and use this fixture as the preserved finished reference.
