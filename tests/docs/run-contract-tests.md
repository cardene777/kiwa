# Running contract tests (Foundry + Hardhat)

> [🇬🇧 English](./run-contract-tests.md) • [🇯🇵 日本語](./run-contract-tests.ja.md)

Procedure to run contract tests via Foundry and Hardhat against `examples/mint-nft`'s ERC721 contract (`MintNft.sol`). Two routes are supported.

- **Route A — Run the completed reference**: execute the canonical test suite in `tests/fixtures/mint-nft/` via pnpm and verify the expected counts (Foundry 27/27, Hardhat 24/24) and behavior.
- **Route B — Walk the retrofit from scratch**: with `examples/mint-nft/` left as an empty workbench, regenerate tests via the `/kiwa-design` → `/kiwa-forge` → `/kiwa-hardhat` skill chain and diff them against the fixtures.

## Prerequisites

Make sure the following are available from the repo root.

```bash
# 1. Install dependencies
pnpm install

# 2. Foundry on PATH (forge / anvil)
forge --version    # forge x.y.z
anvil --version    # anvil x.y.z

# 3. Node.js 22+ for Hardhat
node --version     # v22.x.x
```

If Foundry is not installed, follow the install steps at [foundry.paradigm.xyz](https://foundry.paradigm.xyz).

## Route A — Run the completed reference

`tests/fixtures/mint-nft/` is an isolated pnpm workspace that runs without touching the example side.

### A-1. Run Foundry tests (expect 27/27)

```bash
pnpm --dir tests/fixtures/mint-nft test:foundry
```

Expected final line.

```text
Ran 1 test suite in XXms: 27 tests passed, 0 failed, 0 skipped (27 total tests)
```

**Important — macOS panic workaround**. If `Attempted to create a NULL object` panics fire, you are hitting the Foundry `system_configuration` bug (the 4byte / openchain signature lookup path). The fixtures `package.json` ships `FOUNDRY_OFFLINE=true forge test` so the supplied script is safe, but if you call `forge test` directly and panic, use the env override.

```bash
FOUNDRY_OFFLINE=true forge test
```

### A-2. Run Hardhat tests (expect 24/24, with a 4-round flaky check)

```bash
# Single run
pnpm --dir tests/fixtures/mint-nft test:hardhat

# 4-round consecutive run (flaky 0 check)
for r in 1 2 3 4; do
  echo "=== Round $r ==="
  pnpm --dir tests/fixtures/mint-nft test:hardhat 2>&1 | grep -E "passing|failing"
done
```

Expected output per round.

```text
  24 passing (XXXms)
```

If all 4 rounds show `24 passing` with `failing 0`, flakiness is zero.

### A-3. Measure Hardhat coverage (optional)

```bash
pnpm --dir tests/fixtures/mint-nft test:hardhat:coverage
```

Coverage thresholds (achieved in PR #185).

| metric | threshold | mint-nft actual |
|---|---|---|
| Lines | 90% | 97.70% |
| Statements | 90% | 94.57% |
| Branches | 80% | 83.33% |
| Functions | 90% | 95.24% |

## Route B — Walk the retrofit from scratch

`examples/mint-nft/{test,hardhat-test}/` are listed in `.gitignore` and are empty right after a fresh clone. The skill chain regenerates the suite, then you compare against the fixtures reference.

### B-1. Confirm the workbench is empty

```bash
ls examples/mint-nft/test 2>/dev/null              # empty or "no such directory"
ls examples/mint-nft/hardhat-test 2>/dev/null      # empty or "no such directory"
git status --short examples/mint-nft/              # the dirs above are untracked / gitignored
```

### B-2. Layer 1 — generate the spec

```text
/kiwa-design --layer contract --module mint-nft --input examples/mint-nft/contracts/MintNft.sol
```

Output — `.context/spec/contract/test-spec-mint-nft.md`. A 9-column table lays out perspectives, case IDs, inputs, and expected outcomes.

### B-3. Layer 2 (Foundry) — generate `.t.sol` via `/kiwa-forge`

```text
/kiwa-forge --module mint-nft --gas-report
```

The skill performs the following.

- Reads `.context/spec/contract/test-spec-mint-nft.md`.
- Maps the 10 perspectives (happy path / exceptional / boundary / state transition / authorization / input validation / idempotency / concurrency / performance / security) onto Foundry helpers (`vm.prank`, `vm.expectRevert`, `vm.warp`, fuzz, invariant).
- Writes `examples/mint-nft/test/MintNft.t.sol`.
- Verifies the generated suite with `forge build` and `forge test --gas-report`.

### B-4. Layer 2 (Hardhat) — generate `.test.cjs` via `/kiwa-hardhat`

```text
/kiwa-hardhat --module mint-nft --gas-report
```

The skill performs the following.

- Reads the same `.context/spec/contract/test-spec-mint-nft.md`.
- Maps the 10 perspectives onto chai matchers, `fast-check`, and `hardhat-toolbox`.
- Writes `examples/mint-nft/hardhat-test/MintNft.test.cjs`.
- Verifies via `npx hardhat test --config hardhat.config.cjs`.

### B-5. Run the generated tests

```bash
# Foundry (set FOUNDRY_OFFLINE if the env requires it)
cd examples/mint-nft && FOUNDRY_OFFLINE=true forge test

# Hardhat
pnpm -F examples-mint-nft test:hardhat
```

### B-6. Diff against the fixtures reference

```bash
# Foundry tests
diff -r examples/mint-nft/test tests/fixtures/mint-nft/contract-test

# Hardhat tests
diff -r examples/mint-nft/hardhat-test tests/fixtures/mint-nft/hardhat-test
```

A perfect match is not expected — generated test order, names, and helper choices vary per run. What matters is the following.

- All 10 perspectives are covered.
- All tests pass.
- Coverage clears the thresholds (Lines 90% / Branches 80% / Funcs 90%).

### B-7. Coverage evaluation

```bash
# Foundry
cd examples/mint-nft && FOUNDRY_OFFLINE=true forge coverage --report summary

# Hardhat
pnpm -F examples-mint-nft test:hardhat:coverage
```

If you miss the threshold, add uncovered error paths / events / perspectives to the "missing spec" section of `.context/spec/contract/test-spec-mint-nft.md`, then re-run `/kiwa-forge` or `/kiwa-hardhat` to extend the suite.

## Troubleshooting

| Symptom | Cause | Action |
|---|---|---|
| `Attempted to create a NULL object` panic (Foundry) | macOS `system_configuration` bug | use `FOUNDRY_OFFLINE=true forge test` to skip the signature lookup |
| `forge-std/Test.sol` not found | `lib/forge-std` submodule missing | `cd examples/mint-nft && git submodule update --init` |
| Hardhat `Cannot find module` | pnpm install missing or workspace not recognized | re-run `pnpm install` from the repo root |
| Hardhat passes 3/4 rounds | flaky test (time / concurrency sensitive) | move `vm.warp` / `time.increaseTo` into a fixture under `setUp` |
| Coverage stays below 80% | uncovered branch | inspect `solidity-coverage` output for `I = if-path-not-taken` and add tests for the else / revert path |

## Related docs

- Provenance for the completed reference: `tests/fixtures/mint-nft/README.md`
- End-to-end retrofit walkthrough (token-gating subject): `tests/docs/retrofit-existing-dapp.md`
- Skill chain tutorial: `tests/docs/skill-chain-tutorial.md`
- dApp e2e test procedure: `tests/docs/run-dapp-e2e-tests.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Foundry skill: `.claude/skills/kiwa-forge/SKILL.md`
- Layer 2 Hardhat skill: `.claude/skills/kiwa-hardhat/SKILL.md`
