# Perf Suite — dogfood-mysql-rls-tenant-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveTenantInjection | 0.0042ms | 0.03ms | 80ms | 0.00033ms | PASS | stable (p10 +7% (閾値未満)、 p95 +138% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCrossTenantRefuse | 0.0079ms | 0.02ms | 100ms | 0.00033ms | PASS | stable (p10 +6% (閾値未満)、 p95 +114% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveBypassAudit | 0.0073ms | 0.0091ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAuditIntegrity | 0.0048ms | 0.0055ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveTenantInjection | 0.09ms | 160ms | PASS |
| driveCrossTenantRefuse | 0.15ms | 200ms | PASS |
| driveBypassAudit | 0.10ms | 160ms | PASS |
| driveAuditIntegrity | 0.07ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveTenantInjection | 4224 B | 0 B | 102400 B | yes | PASS |
| driveCrossTenantRefuse | -2856 B | 0 B | 102400 B | yes | PASS |
| driveBypassAudit | 2432 B | 0 B | 102400 B | yes | PASS |
| driveAuditIntegrity | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveTenantInjection

# Perf Report — driveTenantInjection.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0042ms |
| p50 | 0.0052ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.0080ms |
| stdev | 0.01ms |
| min | 0.0040ms |
| max | 0.09ms |
| total | 1.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0039ms | +0.00029ms | +7.46% |
| p50 | 0.0052ms | 0.0050ms | +0.00019ms | +3.75% |
| p95 | 0.03ms | 0.01ms | +0.01ms | +137.86% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +77.20% |
| mean | 0.0080ms | 0.0066ms | +0.0014ms | +20.33% |
| min | 0.0040ms | 0.0038ms | +0.00021ms | +5.51% |
| max | 0.09ms | 0.05ms | +0.04ms | +93.96% |
| total | 1.60ms | 1.33ms | +0.27ms | +20.33% |

### driveCrossTenantRefuse

# Perf Report — driveCrossTenantRefuse.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0079ms |
| p50 | 0.0082ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0078ms |
| max | 0.20ms |
| total | 2.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0079ms | 0.0075ms | +0.00046ms | +6.15% |
| p50 | 0.0082ms | 0.0078ms | +0.00033ms | +4.26% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +113.76% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +100.11% |
| mean | 0.01ms | 0.0083ms | +0.0023ms | +27.69% |
| min | 0.0078ms | 0.0074ms | +0.00046ms | +6.21% |
| max | 0.20ms | 0.02ms | +0.18ms | +811.55% |
| total | 2.12ms | 1.66ms | +0.46ms | +27.69% |

### driveBypassAudit

# Perf Report — driveBypassAudit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0073ms |
| p50 | 0.0074ms |
| p95 | 0.0091ms |
| p99 | 0.02ms |
| mean | 0.0078ms |
| stdev | 0.0020ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 1.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0070ms | +0.00037ms | +5.38% |
| p50 | 0.0074ms | 0.0071ms | +0.00029ms | +4.12% |
| p95 | 0.0091ms | 0.01ms | -0.0049ms | -34.95% |
| p99 | 0.02ms | 0.02ms | -0.0043ms | -19.18% |
| mean | 0.0078ms | 0.0079ms | -0.000044ms | -0.56% |
| min | 0.0073ms | 0.0068ms | +0.00042ms | +6.09% |
| max | 0.02ms | 0.03ms | -0.0085ms | -26.08% |
| total | 1.57ms | 1.58ms | -0.0089ms | -0.56% |

### driveAuditIntegrity

# Perf Report — driveAuditIntegrity.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0048ms |
| p50 | 0.0049ms |
| p95 | 0.0055ms |
| p99 | 0.01ms |
| mean | 0.0052ms |
| stdev | 0.0014ms |
| min | 0.0047ms |
| max | 0.02ms |
| total | 1.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0048ms | 0.0045ms | +0.00026ms | +5.62% |
| p50 | 0.0049ms | 0.0046ms | +0.00025ms | +5.41% |
| p95 | 0.0055ms | 0.0061ms | -0.00062ms | -10.10% |
| p99 | 0.01ms | 0.01ms | +0.00035ms | +2.87% |
| mean | 0.0052ms | 0.0051ms | +0.000078ms | +1.54% |
| min | 0.0047ms | 0.0045ms | +0.00021ms | +4.67% |
| max | 0.02ms | 0.03ms | -0.01ms | -39.32% |
| total | 1.03ms | 1.02ms | +0.02ms | +1.54% |

