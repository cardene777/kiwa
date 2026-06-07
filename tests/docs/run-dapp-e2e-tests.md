# Running dApp e2e tests (Playwright + viem)

> [🇬🇧 English](./run-dapp-e2e-tests.md) • [🇯🇵 日本語](./run-dapp-e2e-tests.ja.md)

Procedure to run dApp e2e tests using Playwright + viem (`@kiwa/core` fixture) against the ERC721 mint flow in `examples/mint-nft`. Two routes are supported.

- **Route A — Run the completed reference**: execute the canonical spec at `tests/fixtures/mint-nft/e2e-test/mint.spec.ts` via pnpm and verify the expected counts (8/8) and behavior.
- **Route B — Walk the retrofit from scratch**: with `examples/mint-nft/tests/` left as an empty workbench, regenerate the spec via the `/kiwa-design` + `/kiwa-play` skill chain and diff against the fixtures.

## Prerequisites

Make sure the following are available from the repo root.

```bash
# 1. Install dependencies
pnpm install

# 2. Install Playwright browsers (first time + after Playwright updates)
pnpm --dir tests/fixtures/mint-nft exec playwright install chromium

# 3. Foundry (anvil) on PATH
anvil --version    # anvil x.y.z

# 4. Node.js 22+
node --version     # v22.x.x
```

Confirm `@kiwa/core` is built (the fixture is consumed by the dApp tests).

```bash
pnpm -F @kiwa/core build      # build packages/core
```

## Route A — Run the completed reference

`tests/fixtures/mint-nft/` is an isolated pnpm workspace that runs without touching the example side.

### A-1. Run the Playwright suite (expect 8/8)

```bash
pnpm --dir tests/fixtures/mint-nft test:e2e
```

Expected tail.

```text
  ✓  1 [chromium] › e2e-test/mint.spec.ts:156:3 › mint-nft e2e (ERC721 mint flow) › T-MN-001 contract deploy + connect shows account (X.Xs)
  ✓  2 [chromium] › e2e-test/mint.spec.ts:165:3 › ... T-MN-002 mint increments totalSupply by 1 and emits Transfer ...
  ✓  3 [chromium] › e2e-test/mint.spec.ts:199:3 › ... T-MN-003 batchMint(addr, 3) mints 3 NFTs with sequential owner enumeration ...
  ✓  4 [chromium] › e2e-test/mint.spec.ts:241:3 › ... T-MN-004 mint → transfer leaves minter balance=0 / recipient balance=1 ...
  ✓  5 [chromium] › e2e-test/mint.spec.ts:261:3 › ... T-MN-005 mint after MAX_SUPPLY reverts with MaxSupplyReached(uint256) ...
  ✓  6 [chromium] › e2e-test/mint.spec.ts:297:3 › ... T-MN-006 royaltyInfo(1, 1 ether) returns the deployer receiver with 5% royalty ...
  ✓  7 [chromium] › e2e-test/mint.spec.ts:314:3 › ... T-MN-007 supportsInterface returns ERC165 / ERC721 / ERC721Enumerable / EIP-2981 ...
  ✓  8 [chromium] › e2e-test/mint.spec.ts:331:3 › ... T-MN-008 batchMint with extreme count reverts with MaxSupplyReached(uint256) ...

  8 passed (10.4s)
```

### A-2. Flaky check (4 consecutive rounds)

```bash
for r in 1 2 3 4; do
  echo "=== Round $r ==="
  pnpm --dir tests/fixtures/mint-nft test:e2e 2>&1 | tail -3
done
```

If all 4 rounds show `8 passed` with `failing 0`, flakiness is zero. If even one round fails, inspect the failing test (timing dependency, leaked anvil state, port collision).

### A-3. Headed mode for debugging

```bash
pnpm --dir tests/fixtures/mint-nft exec playwright test --headed
```

Chromium opens so you can watch clicks and form input. Add `await page.pause()` just before the spot you want to inspect to launch the Playwright inspector.

### A-4. Run a specific test

```bash
# Filter by test name
pnpm --dir tests/fixtures/mint-nft exec playwright test --grep "T-MN-002"

# Target a single file/line
pnpm --dir tests/fixtures/mint-nft exec playwright test e2e-test/mint.spec.ts:165
```

## Route B — Walk the retrofit from scratch

`examples/mint-nft/tests/` is listed in `.gitignore` and is empty right after a fresh clone. The skill chain regenerates the spec, then you compare against the fixtures reference.

### B-1. Confirm the workbench is empty

```bash
ls examples/mint-nft/tests 2>/dev/null              # empty or "no such directory"
git status --short examples/mint-nft/               # tests/ is untracked / gitignored
```

### B-2. Layer 1 — generate the e2e spec

```text
/kiwa-design --layer e2e --module mint-nft --input examples/mint-nft/
```

The skill performs the following.

- Cross-references `examples/mint-nft/contracts/MintNft.sol` with `app/page.tsx` (or the inline HTML fixture).
- Maps contract events to UI display elements.
- Generates test cases grouped by perspective (UI rendering / wallet connection / contract call / state reflection / error display).

Output — `.context/spec/e2e/test-spec-mint-nft.md`.

### B-3. Layer 2 — generate the spec via `/kiwa-play`

```text
/kiwa-play --mode new --example mint-nft
```

The skill performs the following.

- Reads `.context/spec/e2e/test-spec-mint-nft.md`.
- Translates perspectives into Playwright + `@kiwa/core` fixture (anvil auto-start, wallet injection, contract deployment).
- Writes `examples/mint-nft/tests/mint.spec.ts`.
- Runs `pnpm test:e2e` 4 times in a row to confirm flakiness is zero.

### B-4. Run the generated spec

```bash
cd examples/mint-nft && pnpm test
```

`prepare-env.ts` starts anvil and deploys the contract, then Playwright drives the UI flow with chromium.

### B-5. Diff against the fixtures reference

```bash
diff -r examples/mint-nft/tests tests/fixtures/mint-nft/e2e-test
```

A perfect match is not expected — test ID order and assertion strings vary per run. What matters is the following.

- All 8 cases (T-MN-001 through T-MN-008) are covered.
- All tests pass.
- 4 rounds in a row pass (flaky 0).

### B-6. Extend mode — append tests to an existing spec

If the retrofit subject already has an e2e suite (for example `nextjs-token-gating`), `/kiwa-play --mode extend` adds tests **without overwriting** the existing ones.

```text
/kiwa-play --mode extend --example mint-nft
```

The skill treats the existing 8 cases as "already covered" and appends new tests (TC-NNN) for missing perspectives such as partial authorization checks, multi-tab races, or event re-emission.

## Troubleshooting

| Symptom | Cause | Action |
|---|---|---|
| `Executable doesn't exist at .../chrome-headless-shell` | Playwright bundled Chromium missing | `pnpm --dir tests/fixtures/mint-nft exec playwright install chromium` |
| `ReferenceError: require is not defined in ES module scope` | `"type": "module"` missing in package.json | already fixed on the fixtures side; if you hit it in your own workspace, add it |
| `Cannot find module '@kiwa/core'` | `@kiwa/core` not built | `pnpm -F @kiwa/core build` |
| anvil port collision (`EADDRINUSE: 8545`) | another anvil daemon is running | `pkill -f anvil` or `lsof -ti :8545 \| xargs kill` |
| Playwright timeout (test hangs) | wrong UI selector / anvil tx stuck | use `--debug` to launch the inspector and add `page.pause()` |
| Flaky test (only one round fails) | timing dependency / state leak | use `test.describe.serial` or reset state in a fixture `beforeEach` |
| `Error: connect ECONNREFUSED 127.0.0.1:8545` | anvil failed to start (`prepare-env.ts` failed) | run `node --import tsx tests/prepare-env.ts` standalone to see the error log |

## Related docs

- Provenance for the completed reference: `tests/fixtures/mint-nft/README.md`
- End-to-end retrofit walkthrough (token-gating subject): `tests/docs/retrofit-existing-dapp.md`
- Skill chain tutorial: `tests/docs/skill-chain-tutorial.md`
- Contract test procedure (Foundry + Hardhat): `tests/docs/run-contract-tests.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Playwright skill: `.claude/skills/kiwa-play/SKILL.md`
- `@kiwa/core` fixture: `packages/core/src/fixture.ts`
