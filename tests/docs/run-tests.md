# `/kiwa-test` one-command execution guide (contract + dApp e2e, full chain in one command)

> [🇬🇧 English](./run-tests.md) • [🇯🇵 日本語](./run-tests.ja.md)

This guide explains how to run the entire kiwa skill chain (`kiwa-design` → `kiwa-forge` / `kiwa-hardhat` / `kiwa-play` → `kiwa-review`) in one shot with `/kiwa-test`. At startup you can choose contract tests, dApp e2e tests, or both. No need to invoke the individual skills one by one yourself.

If you want to run the individual skills directly, see [run-contract-tests.md](./run-contract-tests.md) and [run-dapp-e2e-tests.md](./run-dapp-e2e-tests.md).

## Step 0 — Prerequisites (+ reset if you already started partway through)

Run this at the root of your cloned kiwa repo.

```bash
pnpm install && pnpm -F @kiwa-test/core build && forge --version && anvil --version && node --version
```

Reset when you want to rerun from the middle (delete all generated tests / specs / cache / reports). This works from any cwd.

```bash
# contract target (example: nft-marketplace)
ROOT=$(git rev-parse --show-toplevel) && rm -rf "$ROOT/examples/nft-marketplace"/{test,hardhat-test,forge-out,hardhat-cache,hardhat-artifacts,cache,coverage,coverage.json} "$ROOT/tests/spec/contract/test-spec-nft-marketplace"* "$ROOT/tests/reports"/{contract,review,integrated}/*nft-marketplace*

# dapp target (example: nextjs-token-gating)
ROOT=$(git rev-parse --show-toplevel) && rm -rf "$ROOT/examples/nextjs-token-gating"/{tests,test-results,playwright-report,.next} "$ROOT/tests/spec/e2e/test-spec-token-gating"* "$ROOT/tests/reports"/{e2e,review,integrated}/*token-gating*

# both (example: run the full chain for nextjs-token-gating)
ROOT=$(git rev-parse --show-toplevel) && rm -rf "$ROOT/examples/nextjs-token-gating"/{test,hardhat-test,tests,forge-out,hardhat-cache,hardhat-artifacts,cache,coverage,coverage.json,test-results,playwright-report,.next} "$ROOT/tests/spec"/{contract,e2e}/test-spec-token-gating* "$ROOT/tests/reports"/{contract,e2e,review,integrated}/*token-gating*
```

## Step 1 — Start Claude Code at the repo root

```bash
cd $(git rev-parse --show-toplevel) && claude
```

**`cwd = repo root` is important**. `/kiwa-test` internally `cd`s into the example dir and launches child skills, so you must start it from the root. This differs from the individual `kiwa-X` skills, which are started with `cwd = dApp dir`.

## Step 2 — Run `/kiwa-test` (keep arguments minimal, confirm the rest through AskUserQuestion)

```text
/kiwa-test --example nextjs-token-gating
```

When arguments are omitted, the skill asks interactively:
- Step 0 language selection — 🇯🇵 ja / 🇬🇧 en / 🌏 other
- Step 1 target selection — 🔷 contract only / 🌐 dApp e2e only / 🔷+🌐 both

If you provide the arguments directly, AskUserQuestion is skipped:

```text
# Specify language + target explicitly (for CI / automation)
/kiwa-test --example nextjs-token-gating --target both --lang ja

# Skip review + skip the coverage loop (fast dry-run)
/kiwa-test --example nft-marketplace --target contract --lang ja --no-review --no-coverage-loop
```

## Step 3 — Automatic skill-chain execution (by target)

`/kiwa-test` launches the following steps in order, with no user intervention.

### target = contract

```text
[Step 3a] /kiwa-design --layer contract --module {example} --input contracts/ --lang $LANG
          → generates tests/spec/contract/test-spec-{example}.{lang}.md
          → automatically calls kiwa-review --mode spec-review in Step 6

[Step 3b] /kiwa-forge --module {example} --gas-report --lang $LANG
          → generates examples/{example}/test/{Contract}.t.sol + all forge tests PASS
          → Step 5b auto loop reaches 100% coverage (or justified impossible)
          → writes tests/reports/contract/coverage-report-{example}.{lang}.md in Step 5c
          → automatically calls kiwa-review --mode test-review in Step 6

[Step 3c] /kiwa-hardhat --module {example} --gas-report --lang $LANG
          → generates examples/{example}/hardhat-test/{Contract}.test.cjs
          → hardhat test PASSes for 4 consecutive rounds (flaky 0)
          → reaches 100% coverage (or justified impossible)
          → automatically calls kiwa-review --mode test-review in Step 6
```

### target = dapp

```text
[Step 4a] /kiwa-design --layer e2e --module {example} --input app/ --lang $LANG
          → generates tests/spec/e2e/test-spec-{example}.{lang}.md
          → automatically calls kiwa-review --mode spec-review in Step 6

[Step 4b] /kiwa-play --mode new --rounds 4 --lang $LANG
          → generates examples/{example}/tests/{example}.spec.ts + helpers
          → playwright test PASSes for 4 consecutive rounds (flaky 0)
          → automatically calls kiwa-review --mode test-review in Step 9
```

### target = both

Runs Step 3 (contract) and then Step 4 (dapp) sequentially (default `--mode sequential`). If contract fails, dapp is skipped and the run stops.

## Step 4 — Check the integrated report + result-review

After the full chain completes, `/kiwa-test` generates:

```text
tests/reports/integrated/{example}-{target}.{lang}.md
```

4-section structure:
- Section 1 execution summary (PASS / FAIL for each stage + counts + score)
- Section 2 generated file list (aggregated paths for spec / test / coverage / review reports; test code points to `tests/fixtures/{example}/` after the Step 5.5 relocation)
- Section 3 critical / major findings (aggregated from child reviews)
- Section 4 next actions (if PASS: update docs + open a PR; if FAIL: repair procedure)

## Step 4.4 — Persist the generated tests (automatically relocated in Step 5.5)

`test/`, `hardhat-test/`, and `tests/` under the example dir are ignored by `.gitignore`, so they would disappear after the session if left in place. In Step 5.5, `/kiwa-test` relocates the generated tests with `git mv` into `tests/fixtures/{example}/{contract-test, hardhat-test, e2e-test}/` so they are included in the PR commit.

```text
Relocation mapping (1-3 dirs depending on target):
examples/{example}/test/         → tests/fixtures/{example}/contract-test/   (target=contract or both)
examples/{example}/hardhat-test/ → tests/fixtures/{example}/hardhat-test/    (target=contract or both)
examples/{example}/tests/        → tests/fixtures/{example}/e2e-test/        (target=dapp or both)
```

If the destination already exists and is non-empty, AskUserQuestion lets you choose "overwrite (default) / add a numeric suffix like -2 / skip relocation". With `--auto-cleanup`, the default overwrite path is used and AskUserQuestion is skipped.

In Step 5b, `/kiwa-review --mode result-review` is called automatically and judges overall run quality across five axes (coverage achievement / number passing / flaky / child-review aggregation / follow-up items).

```text
tests/reports/review/result-review-{example}.{lang}.md
```

## Step 4.5 — Auto-fix loop (self-healing when review FAILs, no hard cap)

If result-review or any child review FAILs, `/kiwa-test` Step 5c starts an **automatic fix loop**. There is no hard cap. The loop ends under one of these three conditions.

| Exit condition | Action |
|---|---|
| ✅ PASS | result-review weighted_score >= 7.0 + critical 0 → complete |
| ⏸️ Stagnation | no improvement for 2 consecutive rounds → user intervention (continue / accept and finish / abort) |
| ⚠️ Critical | security issue / fundamental design problem / contract not implemented, etc. cannot be auto-fixed → user intervention required |

Each round:
1. **Classify the failure** — spec-review FAIL / test-review FAIL / result-review FAIL
2. **Rerun the appropriate skill** — restart `/kiwa-design` (spec FAIL) or `/kiwa-{forge|hardhat|play}` (test FAIL or insufficient coverage) with the review feedback as prompt context
3. **Rerun review** — execute the review chain again after the fix
4. **Accumulate round reports** — save each round under `tests/reports/integrated/{example}-{target}-round-{N}.md`

You can skip this with `--no-auto-fix` (end immediately even if review FAILs; useful for CI / one-shot verification).

## Step 5 — Check the completion summary

Example summary returned by `/kiwa-test`:

```text
🎉 /kiwa-test completed - nextjs-token-gating (both)

Result: ✅ ALL PASS

Execution summary:
- contract: Foundry 20/20 + Hardhat 23/23 × 4 rounds / coverage 100%
- dapp e2e: Playwright 12/13 PASS (1 skip TC-005) / 4 rounds flaky 0
- result-review: 8.4/10 PASS

Integrated report: tests/reports/integrated/nextjs-token-gating-both.en.md
Relocated test code: tests/fixtures/nextjs-token-gating/{contract-test, hardhat-test, e2e-test}/ (included in the PR)

Next action: docs update + PR creation recommended
```

## For debugging — when you want to rerun an individual skill

When `/kiwa-test` does not finish the whole chain (for example coverage falls short on the contract side), you can debug individual skills directly:

```text
# Regenerate the spec
/kiwa-design --layer contract --module nextjs-token-gating --input contracts/ --lang ja

# Regenerate Foundry tests (coverage is filled via the auto loop)
/kiwa-forge --module nextjs-token-gating --gas-report --lang ja

# Launch review only (rerun review)
/kiwa-review --mode spec-review --module nextjs-token-gating --layer contract --lang ja
/kiwa-review --mode test-review --module nextjs-token-gating --layer contract --lang ja
/kiwa-review --mode result-review --module nextjs-token-gating --lang ja
```

For detailed procedures for standalone skill runs, see [run-contract-tests.md](./run-contract-tests.md) and [run-dapp-e2e-tests.md](./run-dapp-e2e-tests.md).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `examples/{X}/app/ does not exist` (dapp target) | This is an example without a UI (mint-nft / nft-marketplace, etc.), so choose `target=contract` |
| `examples/{X}/contracts/ does not exist` (contract target) | This is an example without contracts (basic-connect, etc.), so choose `target=dapp` |
| dapp was skipped because contract failed | Fix contract first (debug via standalone `/kiwa-forge`), then rerun `/kiwa-test` |
| anvil port collision | Stop the existing daemon with `pkill -f anvil` |
| Playwright chromium missing | `pnpm --filter examples-{X} exec playwright install chromium` |
| Foundry panic (macOS) | Use `--no-coverage-loop` to reduce the auto loop to one round, or run the individual skill with `FOUNDRY_OFFLINE=true` |
| Stopped because review FAILed as critical | Check the reports under `tests/reports/review/`, fix the spec / tests, then rerun |

## Related docs

- contract-test standalone guide (Foundry + Hardhat): [run-contract-tests.md](./run-contract-tests.md)
- dApp e2e standalone guide (Playwright + viem): [run-dapp-e2e-tests.md](./run-dapp-e2e-tests.md)
- skill overview + skill roles: [README.md](./README.md)
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Foundry skill: `.claude/skills/kiwa-forge/SKILL.md`
- Layer 2 Hardhat skill: `.claude/skills/kiwa-hardhat/SKILL.md`
- Layer 2 Playwright skill: `.claude/skills/kiwa-play/SKILL.md`
- reviewer skill: `.claude/skills/kiwa-review/SKILL.md`
- integrated orchestrator skill: `.claude/skills/kiwa-test/SKILL.md`
