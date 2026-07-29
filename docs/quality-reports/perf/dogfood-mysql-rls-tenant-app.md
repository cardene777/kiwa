# Perf Suite — dogfood-mysql-rls-tenant-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveTenantInjection | 0.0040ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 +2% (閾値未満)、 p95 +82% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCrossTenantRefuse | 0.0074ms | 0.01ms | 100ms | 0.00033ms | PASS | stable (p10 -1% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveBypassAudit | 0.0069ms | 0.0087ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAuditIntegrity | 0.0045ms | 0.0051ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveTenantInjection | 0.12ms | 160ms | PASS |
| driveCrossTenantRefuse | 0.22ms | 200ms | PASS |
| driveBypassAudit | 0.09ms | 160ms | PASS |
| driveAuditIntegrity | 0.06ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveTenantInjection | 4800 B | 0 B | 102400 B | yes | PASS |
| driveCrossTenantRefuse | -3544 B | 0 B | 102400 B | yes | PASS |
| driveBypassAudit | 2432 B | 0 B | 102400 B | yes | PASS |
| driveAuditIntegrity | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveTenantInjection

# Perf Report — driveTenantInjection.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0040ms |
| p50 | 0.0052ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0073ms |
| stdev | 0.0062ms |
| min | 0.0038ms |
| max | 0.05ms |
| total | 1.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0039ms | +0.000084ms | +2.15% |
| p50 | 0.0052ms | 0.0050ms | +0.00019ms | +3.75% |
| p95 | 0.02ms | 0.01ms | +0.0089ms | +82.38% |
| p99 | 0.04ms | 0.03ms | +0.0078ms | +26.59% |
| mean | 0.0073ms | 0.0066ms | +0.00064ms | +9.68% |
| min | 0.0038ms | 0.0038ms | +0.000042ms | +1.11% |
| max | 0.05ms | 0.05ms | -0.00029ms | -0.63% |
| total | 1.46ms | 1.33ms | +0.13ms | +9.68% |

### driveCrossTenantRefuse

# Perf Report — driveCrossTenantRefuse.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0074ms |
| p50 | 0.0077ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0083ms |
| stdev | 0.0023ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 1.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0075ms | -0.000083ms | -1.11% |
| p50 | 0.0077ms | 0.0078ms | -0.00013ms | -1.60% |
| p95 | 0.01ms | 0.01ms | +0.0029ms | +28.49% |
| p99 | 0.02ms | 0.02ms | -0.0017ms | -8.02% |
| mean | 0.0083ms | 0.0083ms | +0.0000011ms | +0.01% |
| min | 0.0073ms | 0.0074ms | -0.000083ms | -1.13% |
| max | 0.02ms | 0.02ms | +0.00025ms | +1.12% |
| total | 1.66ms | 1.66ms | +0.00023ms | +0.01% |

### driveBypassAudit

# Perf Report — driveBypassAudit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0069ms |
| p50 | 0.0070ms |
| p95 | 0.0087ms |
| p99 | 0.02ms |
| mean | 0.0075ms |
| stdev | 0.0019ms |
| min | 0.0068ms |
| max | 0.02ms |
| total | 1.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.0070ms | -0.000043ms | -0.62% |
| p50 | 0.0070ms | 0.0071ms | -0.000083ms | -1.18% |
| p95 | 0.0087ms | 0.01ms | -0.0053ms | -37.98% |
| p99 | 0.02ms | 0.02ms | -0.0043ms | -19.19% |
| mean | 0.0075ms | 0.0079ms | -0.00042ms | -5.39% |
| min | 0.0068ms | 0.0068ms | -0.0000010ms | -0.01% |
| max | 0.02ms | 0.03ms | -0.01ms | -31.30% |
| total | 1.49ms | 1.58ms | -0.08ms | -5.39% |

### driveAuditIntegrity

# Perf Report — driveAuditIntegrity.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0045ms |
| p50 | 0.0045ms |
| p95 | 0.0051ms |
| p99 | 0.01ms |
| mean | 0.0048ms |
| stdev | 0.0013ms |
| min | 0.0044ms |
| max | 0.02ms |
| total | 0.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0045ms | -0.000041ms | -0.90% |
| p50 | 0.0045ms | 0.0046ms | -0.000083ms | -1.79% |
| p95 | 0.0051ms | 0.0061ms | -0.0010ms | -16.49% |
| p99 | 0.01ms | 0.01ms | -0.00095ms | -7.79% |
| mean | 0.0048ms | 0.0051ms | -0.00028ms | -5.42% |
| min | 0.0044ms | 0.0045ms | -0.000042ms | -0.94% |
| max | 0.02ms | 0.03ms | -0.01ms | -46.94% |
| total | 0.96ms | 1.02ms | -0.06ms | -5.42% |

