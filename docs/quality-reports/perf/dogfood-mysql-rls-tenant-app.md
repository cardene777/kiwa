# Perf Suite — dogfood-mysql-rls-tenant-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveTenantInjection | 0.0040ms | 0.01ms | 80ms | 0.00033ms | PASS | stable (p10 +1% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCrossTenantRefuse | 0.0073ms | 0.01ms | 100ms | 0.00033ms | PASS | stable (p10 -3% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveBypassAudit | 0.0069ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAuditIntegrity | 0.0045ms | 0.0051ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveTenantInjection | 0.09ms | 160ms | PASS |
| driveCrossTenantRefuse | 0.11ms | 200ms | PASS |
| driveBypassAudit | 0.09ms | 160ms | PASS |
| driveAuditIntegrity | 0.06ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveTenantInjection | 3080 B | 0 B | 102400 B | yes | PASS |
| driveCrossTenantRefuse | -3704 B | 0 B | 102400 B | yes | PASS |
| driveBypassAudit | 2432 B | 0 B | 102400 B | yes | PASS |
| driveAuditIntegrity | 688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveTenantInjection

# Perf Report — driveTenantInjection.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0040ms |
| p50 | 0.0051ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0065ms |
| stdev | 0.0051ms |
| min | 0.0038ms |
| max | 0.05ms |
| total | 1.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0039ms | +0.000043ms | +1.10% |
| p50 | 0.0051ms | 0.0050ms | +0.000084ms | +1.68% |
| p95 | 0.01ms | 0.01ms | +0.0025ms | +23.49% |
| p99 | 0.03ms | 0.03ms | +0.00038ms | +1.31% |
| mean | 0.0065ms | 0.0066ms | -0.00010ms | -1.52% |
| min | 0.0038ms | 0.0038ms | +0.000042ms | +1.11% |
| max | 0.05ms | 0.05ms | -0.00033ms | -0.72% |
| total | 1.31ms | 1.33ms | -0.02ms | -1.52% |

### driveCrossTenantRefuse

# Perf Report — driveCrossTenantRefuse.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0073ms |
| p50 | 0.0075ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0081ms |
| stdev | 0.0024ms |
| min | 0.0072ms |
| max | 0.02ms |
| total | 1.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0075ms | -0.00021ms | -2.79% |
| p50 | 0.0075ms | 0.0078ms | -0.00033ms | -4.25% |
| p95 | 0.01ms | 0.01ms | +0.0028ms | +27.35% |
| p99 | 0.02ms | 0.02ms | +0.000067ms | +0.32% |
| mean | 0.0081ms | 0.0083ms | -0.00015ms | -1.85% |
| min | 0.0072ms | 0.0074ms | -0.00021ms | -2.83% |
| max | 0.02ms | 0.02ms | -0.00033ms | -1.49% |
| total | 1.63ms | 1.66ms | -0.03ms | -1.85% |

### driveBypassAudit

# Perf Report — driveBypassAudit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0069ms |
| p50 | 0.0070ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0081ms |
| stdev | 0.0059ms |
| min | 0.0068ms |
| max | 0.08ms |
| total | 1.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.0070ms | -0.000042ms | -0.60% |
| p50 | 0.0070ms | 0.0071ms | -0.000041ms | -0.59% |
| p95 | 0.01ms | 0.01ms | -0.0016ms | -11.30% |
| p99 | 0.02ms | 0.02ms | +0.0027ms | +12.04% |
| mean | 0.0081ms | 0.0079ms | +0.00025ms | +3.22% |
| min | 0.0068ms | 0.0068ms | -0.0000010ms | -0.01% |
| max | 0.08ms | 0.03ms | +0.05ms | +144.15% |
| total | 1.63ms | 1.58ms | +0.05ms | +3.22% |

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
| mean | 0.0051ms |
| stdev | 0.0045ms |
| min | 0.0044ms |
| max | 0.07ms |
| total | 1.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0045ms | -0.000079ms | -1.74% |
| p50 | 0.0045ms | 0.0046ms | -0.000084ms | -1.82% |
| p95 | 0.0051ms | 0.0061ms | -0.0010ms | -16.60% |
| p99 | 0.01ms | 0.01ms | +0.0012ms | +9.52% |
| mean | 0.0051ms | 0.0051ms | -0.000022ms | -0.44% |
| min | 0.0044ms | 0.0045ms | -0.000083ms | -1.86% |
| max | 0.07ms | 0.03ms | +0.04ms | +115.92% |
| total | 1.01ms | 1.02ms | -0.0044ms | -0.44% |

