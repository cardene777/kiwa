# kiwa v1.46 x-thread (日本語)

## Tweet 1 — hook

kiwa v1.46 リリース — quality gate integrity 回復 + DevSecOps library 化 の 2 軸 milestone。

perf-harness v0.2→v0.3 strict (iter 400 + Welch |t|>3 + delta 10%)、 38 package baseline 完全 sweep、 quality-metrics v0.3→v0.4 (13→15 axis)、 security-devsecops v0.1 新規 (39→40 package、 6 axis DevSecOps)。

## Tweet 2 — quality gate integrity 回復

v1.25 で「33 package sweep」 と docs 記載したが実態 15 package のみ、 v1.42-v1.45 の 4 milestone で advanced III baseline も未生成。 v1.46 で security package 追加 + 4 stale baseline refresh で 38 package 全 baseline 完備。 perf strict mode (iter 400 + |t|>3 + delta 10%) で test 漏れゼロを構造的に達成。

## Tweet 3 — DevSecOps library 化

@kiwa/security-devsecops v0.1 新規 (40 package 到達)、 6 axis (SAST + SCA + Secret + IaC + DAST + Container) を state machine + neutral event pattern で提供。 dev-flow の /security-audit skill 4 種を library 経由に置換する Phase 1 完成 (v1.47 で adapter 統合、 v1.48 で unified entry 予定)。

## Tweet 4 — snippet streak + npm publish

**24 milestone 連続 snippet validation streak** (v1.23-v1.46) 達成。

`pnpm add -D @kiwa/perf-harness @kiwa/quality-metrics @kiwa/security-devsecops` で 3 package 一括入手。 migration guide: https://cardene777.github.io/kiwa/migrations/v1.45-to-v1.46

7 sub 完遂 (v1.46-1 perf-harness v0.3 strict / v1.46-2 baseline sweep 38 package / v1.46-3 quality-metrics v0.4 15 axis / v1.46-4 security-devsecops v0.1 40 package / v1.46-5 skill library SSOT / v1.46-6 dogfood + docs + 24 streak / v1.46-7 publish).

#kiwa #devsecops #perf #security #testing #vitest
