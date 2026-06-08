# How to generate and run tests for a contract set with the skills (Foundry + Hardhat)

`examples/nft-marketplace` (2 contracts: `MarketNft.sol` + `SimpleMarketplace.sol`) is used to walk through generating contract tests from scratch, running them, and comparing the result against the finished fixtures.

## Step 0 — Prerequisites (+ reset if you already started partway through)

Run this at the root of your cloned kiwa repo.

```bash
pnpm install && forge --version && anvil --version && node --version
```

Reset when you want to rerun from the middle (delete all generated tests / specs / cache). This works from any cwd.

```bash
ROOT=$(git rev-parse --show-toplevel) && rm -rf "$ROOT/examples/nft-marketplace"/{test,hardhat-test,forge-out,hardhat-cache,hardhat-artifacts,cache,coverage,coverage.json} "$ROOT/tests/spec/contract/test-spec-nft-marketplace.md"
```

## Step 1 — Move into the target dApp dir + confirm the test dirs are empty

```bash
cd examples/nft-marketplace && ls test hardhat-test 2>&1
# Expected: "No such file" or empty
```

## Step 2 — Start Claude Code in that dir

```bash
claude
```

## Step 3 — Generate the test spec with `/kiwa-design`

Run this in the Claude prompt.

```text
/kiwa-design --layer contract --module nft-marketplace --input contracts/
```

Output: `tests/spec/contract/test-spec-nft-marketplace.md` (a 9-column table covering both contracts' functions / events / errors plus cross-contract scenarios).

## Step 4 — Generate Foundry tests with `/kiwa-forge`

```text
/kiwa-forge --module nft-marketplace --gas-report
```

Output:

```text
test/
├── MarketNft.t.sol
└── SimpleMarketplace.t.sol   (cross-contract scenarios also deploy MarketNft in setUp and live in this file)
```

## Step 5 — Generate Hardhat tests with `/kiwa-hardhat`

```text
/kiwa-hardhat --module nft-marketplace --gas-report
```

Output:

```text
hardhat-test/
├── MarketNft.test.cjs
└── SimpleMarketplace.test.cjs
```

## Step 6 — Run the full test suite (including flaky checks)

Exit Claude (`Ctrl+D`) and run this at the repo root.

```bash
# Foundry - all contracts at once
(cd examples/nft-marketplace && FOUNDRY_OFFLINE=true forge test)

# Hardhat - 4 consecutive rounds (check flaky=0)
for r in 1 2 3 4; do echo "=== Round $r ==="; pnpm -F examples-nft-marketplace test:hardhat 2>&1 | grep -E "passing|failing"; done
```

Pass when every round shows `failing 0`.

## Step 7 — Evaluate coverage (loop until complete)

```bash
# Foundry
(cd examples/nft-marketplace && FOUNDRY_OFFLINE=true forge coverage --report summary)

# Hardhat
pnpm -F examples-nft-marketplace test:hardhat:coverage
```

Target: **reach 100% on the production target (`contracts/`) or prove that "nothing more can be covered"**. One of two exit conditions must be met.

1. All 4 metrics (Lines / Statements / Branches / Functions) for the production target reach 100%
2. Every remaining uncovered branch is already classified as unreachable branch / defensive code / external dependency (`block.timestamp`, etc. that cannot be reproduced in tests), so "no more tests can be added" is justified

If neither 1 nor 2 is true:

```text
Restart Claude, add the uncovered paths back into the /kiwa-design spec, rerun /kiwa-forge --module nft-marketplace, then run coverage again
```

Keep looping until you hit 100% or a justified "impossible" decision. If the coverage delta is 0 for two consecutive rounds, treat that as stagnation and switch to manual review.

> Note — Even if the Total value (including tests / mocks) is below 100%, this still PASSes when the production target is at 100%. test/helper/mock files are outside the denominator. See the next step (Step 8) for the detailed report interpretation.

> Note — Automatic coverage loops (the skill extracts uncovered lines, classifies them, adds tests, and reruns coverage) and automatic coverage report generation (writing `tests/reports/contract/coverage-report-{module}.md` in a 4-section format) are planned as a skill extension in [Issue #222](https://github.com/cardene777/kiwa/issues/222). Once that lands, Step 7 + Step 8 will be automated. Until then, use the manual loop above and consult the manual report format in the next step.

## Step 8 — Check the coverage report (auto-generated after the skill extension lands)

After skill extension #222 is complete, the following file will be generated automatically at the end of Step 7.

```text
tests/reports/contract/coverage-report-nft-marketplace.md
```

4-section structure:

| section | content |
|---|---|
| 1. Decision summary | Show all 4 metrics in two columns (production target / Total) plus a ✅PASS / ❌FAIL decision |
| 2. Per-file breakdown | Category column for production / test itself / mock helper, plus threshold-scope column |
| 3. Unreached-line classification | 5 buckets: deletion candidate / defensive / external dependency / excluded from measurement / truly untested, plus the reason |
| 4. Proposed Layer 1 spec write-back | Suggestions for reflecting tests added during implementation and newly discovered knowledge back into the spec (the skill does not rewrite the spec itself) |

Until that extension ships, you can manually create the same sections and save them under `tests/reports/contract/` if you want.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Attempted to create a NULL object` panic (Foundry / macOS) | `FOUNDRY_OFFLINE=true forge test` |
| `forge-std/Test.sol` not found | `git submodule update --init` |
| Hardhat `Cannot find module` | Re-run `pnpm install` at the repo root |
| Only one round fails (flaky) | Move `time.increaseTo` / `vm.warp` into a fixture in `setUp` |
| Coverage falls short | Check the "missing spec" section in `tests/spec/contract/test-spec-nft-marketplace.md`, then rerun Step 4 / Step 5 |

## Related docs

- dApp e2e tests (UI-first): [run-dapp-e2e-tests.md](./run-dapp-e2e-tests.md)
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Foundry skill: `.claude/skills/kiwa-forge/SKILL.md`
- Layer 2 Hardhat skill: `.claude/skills/kiwa-hardhat/SKILL.md`
