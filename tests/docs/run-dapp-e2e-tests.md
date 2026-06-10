# How to generate and run dApp e2e tests with the skills (Playwright + viem)

> [🇬🇧 English](./run-dapp-e2e-tests.md) • [🇯🇵 日本語](./run-dapp-e2e-tests.ja.md)

`examples/nextjs-token-gating` (a Next.js dApp plus 2 contracts: `GatedContent.sol` + `GateNFT.sol`) is used to walk through generating UI-first dApp e2e tests from scratch and running them end to end. Contract functions never called from the UI (admin / internal) are out of scope.

## Step 0 — Prerequisites (+ reset if you already started partway through)

Run this at the root of your cloned kiwa repo.

```bash
pnpm install && pnpm -F @kiwa-test/core build && anvil --version && node --version && pnpm --filter examples-nextjs-token-gating exec playwright install chromium
```

Reset when you want to rerun from the middle (delete all generated specs / tests / run artifacts). This works from any cwd.

```bash
ROOT=$(git rev-parse --show-toplevel) && rm -rf "$ROOT/examples/nextjs-token-gating"/{tests,test-results,playwright-report,.next} "$ROOT/tests/spec/e2e/test-spec-token-gating.md"
```

## Step 1 — Move into the target dApp dir + confirm the `tests/` dir is empty

```bash
cd examples/nextjs-token-gating && ls tests 2>&1
# Expected: "No such file" or empty
```

## Step 2 — Start Claude Code in that dir

```bash
claude
```

## Step 3 — Generate the e2e spec with `/kiwa-design` (UI-first)

Run this in the Claude prompt.

```text
/kiwa-design --layer e2e --module token-gating --input app/
```

Output: `tests/spec/e2e/test-spec-token-gating.md` (a 9-column table covering UI elements, contract functions reached through wagmi hooks, and UX flows; contract functions never called from the UI are excluded).

## Step 4 — Generate the Playwright spec with `/kiwa-play --mode new`

```text
/kiwa-play --mode new --rounds 4
```

Output: `tests/token-gating.spec.ts` plus helpers such as `tests/prepare-env.ts` / `tests/fixture.ts`. After generation, the skill runs the suite for 4 consecutive rounds to verify flaky=0.

## Step 5 — Run the spec manually (including flaky checks)

Exit Claude (`Ctrl+D`) and run this at the repo root.

```bash
# Single run
pnpm -F examples-nextjs-token-gating test

# 4 consecutive rounds for flaky detection
for r in 1 2 3 4; do echo "=== Round $r ==="; pnpm -F examples-nextjs-token-gating test 2>&1 | tail -3; done
```

Pass when every round shows `failing 0`.

## For debugging — headed mode / specific test

```bash
# Run while watching the browser
pnpm -F examples-nextjs-token-gating exec playwright test --headed

# Filter by test name
pnpm -F examples-nextjs-token-gating exec playwright test --grep "Grant"

# File / line target
pnpm -F examples-nextjs-token-gating exec playwright test tests/token-gating.spec.ts:120
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Executable doesn't exist at .../chrome-headless-shell` | `pnpm --filter examples-nextjs-token-gating exec playwright install chromium` |
| `ReferenceError: require is not defined in ES module scope` | Add `"type": "module"` to `package.json` |
| `Cannot find module '@kiwa-test/core'` | Run `pnpm -F @kiwa-test/core build` at the repo root |
| anvil port collision (`EADDRINUSE: 8545`) | `pkill -f anvil` or `lsof -ti :8545 \| xargs kill` |
| Playwright timeout | Start the inspector with `--debug` and add `await page.pause()` inside the spec |
| Only one round fails | Use `test.describe.serial` or reset state in a fixture via `beforeEach` |
| `Error: connect ECONNREFUSED 127.0.0.1:8545` | Run `node --import tsx tests/prepare-env.ts` by itself and inspect the anvil startup logs |

## Related docs

- contract tests (Foundry + Hardhat): [run-contract-tests.md](./run-contract-tests.md)
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Playwright skill: `.claude/skills/kiwa-play/SKILL.md`
- `@kiwa-test/core` fixture spec: `packages/core/src/fixture.ts`
