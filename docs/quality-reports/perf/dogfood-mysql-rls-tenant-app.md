# Perf Suite — dogfood-mysql-rls-tenant-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveTenantInjection | 0.0044ms | 0.02ms | 80ms | 0.00083ms | PASS | stable (p10 +12% (閾値未満)、 p95 +48% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCrossTenantRefuse | 0.0078ms | 0.02ms | 100ms | 0.00083ms | PASS | stable (p10 +5% (閾値未満)、 p95 +138% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveBypassAudit | 0.0076ms | 0.0094ms | 80ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAuditIntegrity | 0.0052ms | 0.0072ms | 100ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveTenantInjection | 0.09ms | 160ms | PASS |
| driveCrossTenantRefuse | 0.11ms | 200ms | PASS |
| driveBypassAudit | 0.19ms | 160ms | PASS |
| driveAuditIntegrity | 0.06ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveTenantInjection | -7064 B | 0 B | 102400 B | yes | PASS |
| driveCrossTenantRefuse | -3576 B | 0 B | 102400 B | yes | PASS |
| driveBypassAudit | 2448 B | 0 B | 102400 B | yes | PASS |
| driveAuditIntegrity | 600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveTenantInjection

# Perf Report — driveTenantInjection.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0044ms |
| p50 | 0.0054ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0075ms |
| stdev | 0.0064ms |
| min | 0.0043ms |
| max | 0.05ms |
| total | 1.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0039ms | +0.00046ms | +11.72% |
| p50 | 0.0054ms | 0.0050ms | +0.00042ms | +8.34% |
| p95 | 0.02ms | 0.01ms | +0.0052ms | +47.82% |
| p99 | 0.03ms | 0.03ms | +0.0054ms | +18.19% |
| mean | 0.0075ms | 0.0066ms | +0.00088ms | +13.26% |
| min | 0.0043ms | 0.0038ms | +0.00046ms | +12.11% |
| max | 0.05ms | 0.05ms | +0.0077ms | +16.58% |
| total | 1.51ms | 1.33ms | +0.18ms | +13.26% |

### driveCrossTenantRefuse

# Perf Report — driveCrossTenantRefuse.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0078ms |
| p50 | 0.0085ms |
| p95 | 0.02ms |
| p99 | 0.68ms |
| mean | 0.04ms |
| stdev | 0.21ms |
| min | 0.0077ms |
| max | 2.41ms |
| total | 7.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0078ms | 0.0075ms | +0.00037ms | +5.03% |
| p50 | 0.0085ms | 0.0078ms | +0.00067ms | +8.52% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +138.02% |
| p99 | 0.68ms | 0.02ms | +0.66ms | +3182.02% |
| mean | 0.04ms | 0.0083ms | +0.03ms | +353.27% |
| min | 0.0077ms | 0.0074ms | +0.00033ms | +4.52% |
| max | 2.41ms | 0.02ms | +2.39ms | +10682.49% |
| total | 7.52ms | 1.66ms | +5.86ms | +353.27% |

### driveBypassAudit

# Perf Report — driveBypassAudit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0076ms |
| p50 | 0.0077ms |
| p95 | 0.0094ms |
| p99 | 0.02ms |
| mean | 0.0082ms |
| stdev | 0.0020ms |
| min | 0.0075ms |
| max | 0.03ms |
| total | 1.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0076ms | 0.0070ms | +0.00067ms | +9.57% |
| p50 | 0.0077ms | 0.0071ms | +0.00063ms | +8.83% |
| p95 | 0.0094ms | 0.01ms | -0.0046ms | -32.91% |
| p99 | 0.02ms | 0.02ms | -0.0040ms | -17.83% |
| mean | 0.0082ms | 0.0079ms | +0.00031ms | +3.88% |
| min | 0.0075ms | 0.0068ms | +0.00071ms | +10.36% |
| max | 0.03ms | 0.03ms | -0.0076ms | -23.28% |
| total | 1.64ms | 1.58ms | +0.06ms | +3.88% |

### driveAuditIntegrity

# Perf Report — driveAuditIntegrity.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0052ms |
| p50 | 0.0053ms |
| p95 | 0.0072ms |
| p99 | 0.02ms |
| mean | 0.0091ms |
| stdev | 0.05ms |
| min | 0.0050ms |
| max | 0.70ms |
| total | 1.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0045ms | +0.00063ms | +13.87% |
| p50 | 0.0053ms | 0.0046ms | +0.00063ms | +13.51% |
| p95 | 0.0072ms | 0.0061ms | +0.0011ms | +17.30% |
| p99 | 0.02ms | 0.01ms | +0.0043ms | +35.35% |
| mean | 0.0091ms | 0.0051ms | +0.0040ms | +78.37% |
| min | 0.0050ms | 0.0045ms | +0.00058ms | +13.10% |
| max | 0.70ms | 0.03ms | +0.67ms | +2191.29% |
| total | 1.81ms | 1.02ms | +0.80ms | +78.37% |

