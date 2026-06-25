---
"@kiwa-test/cli-test": minor
---

v4 — @kiwa-test/cli-test v0.1.0 新設: CLI / shell / file IO test adapter

## 新規 API

- `setupCliEnv({ seedFiles, env, prefix })` ... isolated tempdir + env merge + file IO helper (readFile / writeFile / listFiles / fileExists)
- `env.runCli({ cmd, args, stdin, env, cwd, timeoutMs })` ... execFile + stdout/stderr capture + exit code + duration
- `expectExitCode` / `expectStdoutContains` / `expectStderrContains` ... 出力 assertion helper

## PoC

- `examples/cli-poc/` ... kiwa CLI 自身を dogfooding、 Layer 1 spec (8 case across help / doctor / init / anvil-seed) + vitest test 8 件 全 PASS

## skill SSOT

- `.claude/skills/kiwa-design/SKILL.md` ... `--layer cli` 出力 path (`.cli.md`) + cli 専用 9 column 表 (Mode / Topic) を SSOT 化
- `.claude/skills/kiwa-cli-test/SKILL.md` ... 新設、 9 column → setupCliEnv / runCli 機械変換 + 実装例
