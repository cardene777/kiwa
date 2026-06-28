# @kiwa-test/cli-test

## 0.1.2

### Patch Changes

- c0f0a97: Lock in mutation testing across all 11 packages with a release-time gate. `scripts/check-mutation-gates.mjs` reads each package's `mutation-report/mutation.json` and enforces per-package MSI thresholds (90% for pure-logic — api / a11y / ui after PR 1-5; 80% for thin wrappers around third-party libs). Release workflow now runs `pnpm test:mutation` for every package and fails the publish if any package's MSI regresses below its threshold. Current snapshot: api 96.06 / a11y 93.62 / ui 91.76 / cli-test 89.69 / data 86.93 / spec 85.51 / core 85.09 / cli 84.44 / e2e 84.21 / observability 84.12 / visual 83.02 — all above thresholds. No public API change.
- Updated dependencies [c0f0a97]
  - @kiwa-test/core@0.1.1

## 0.1.1

### Patch Changes

- e6c2066: Strengthen `@kiwa-test/cli-test` mutation test coverage. MSI raised from 82.47% to **89.69%** by adding 21 mutation-kill tests targeting env merge ordering / absolute vs relative cwd resolution / timeout SIGKILL / stdin forwarding / args default / process.env undefined filtering / stop() force:true / close success path. Stryker config `thresholds.break` raised from 50 to 80 with jsonReporter output. No public API change.

## 0.1.0

### Minor Changes

- 8ec8835: v4 — @kiwa-test/cli-test v0.1.0 新設: CLI / shell / file IO test adapter

  ## 新規 API

  - `setupCliEnv({ seedFiles, env, prefix })` ... isolated tempdir + env merge + file IO helper (readFile / writeFile / listFiles / fileExists)
  - `env.runCli({ cmd, args, stdin, env, cwd, timeoutMs })` ... execFile + stdout/stderr capture + exit code + duration
  - `expectExitCode` / `expectStdoutContains` / `expectStderrContains` ... 出力 assertion helper

  ## PoC

  - `examples/cli-poc/` ... kiwa CLI 自身を dogfooding、 Layer 1 spec (8 case across help / doctor / init / anvil-seed) + vitest test 8 件 全 PASS

  ## skill SSOT

  - `.claude/skills/kiwa-design/SKILL.md` ... `--layer cli` 出力 path (`.cli.md`) + cli 専用 9 column 表 (Mode / Topic) を SSOT 化
  - `.claude/skills/kiwa-cli-test/SKILL.md` ... 新設、 9 column → setupCliEnv / runCli 機械変換 + 実装例
