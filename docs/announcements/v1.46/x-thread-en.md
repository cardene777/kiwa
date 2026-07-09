# kiwa v1.46 x-thread (English)

## Tweet 1 — hook

kiwa v1.46 released — quality gate integrity recovery + DevSecOps library 2-axis milestone.

perf-harness v0.3 strict (iter 400 + Welch |t|>3 + delta 10%), 38 package baseline sweep, quality-metrics v0.4 (13→15 axis), security-devsecops v0.1 new (40 package, 6 axis DevSecOps).

## Tweet 2 — quality gate integrity recovery

v1.25 docs claimed "33 package sweep" but reality was 15 packages, v1.42-v1.45 advanced III baselines unrefreshed. v1.46 adds security package + 4 stale baseline refresh = 38 package full coverage. Strict mode structurally achieves zero test miss.

## Tweet 3 — DevSecOps library

@kiwa-lab/security-devsecops v0.1 new (40 package). 6 axis (SAST + SCA + Secret + IaC + DAST + Container) as state machine + neutral event pattern. Replaces dev-flow /security-audit skill 4 variants via library (v0.2 adapter integration + v0.3 unified entry planned).

## Tweet 4 — snippet streak + npm publish

**24-milestone snippet validation streak** (v1.23-v1.46).

`pnpm add -D @kiwa-lab/perf-harness @kiwa-lab/quality-metrics @kiwa-lab/security-devsecops`. Migration: https://cardene777.github.io/kiwa/migrations/v1.45-to-v1.46

7 sub complete (v1.46-1 perf-harness strict / v1.46-2 38 baseline / v1.46-3 quality-metrics 15 axis / v1.46-4 security-devsecops / v1.46-5 skill SSOT / v1.46-6 dogfood + docs / v1.46-7 publish).

#kiwa #devsecops #perf #security #testing #vitest
