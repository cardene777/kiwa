# Perf Suite — dogfood-mysql-rls-tenant-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveTenantInjection | 0.0040ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 +1% (閾値未満)、 p95 +92% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCrossTenantRefuse | 0.0073ms | 0.01ms | 100ms | 0.00033ms | PASS | stable (p10 -2% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveBypassAudit | 0.0069ms | 0.0098ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAuditIntegrity | 0.0045ms | 0.0068ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveTenantInjection | 0.09ms | 160ms | PASS |
| driveCrossTenantRefuse | 0.11ms | 200ms | PASS |
| driveBypassAudit | 0.11ms | 160ms | PASS |
| driveAuditIntegrity | 0.06ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveTenantInjection | 3080 B | 0 B | 102400 B | yes | PASS |
| driveCrossTenantRefuse | -3176 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0071ms |
| stdev | 0.0061ms |
| min | 0.0038ms |
| max | 0.05ms |
| total | 1.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0039ms | +0.000043ms | +1.10% |
| p50 | 0.0051ms | 0.0050ms | +0.000083ms | +1.67% |
| p95 | 0.02ms | 0.01ms | +0.0099ms | +91.63% |
| p99 | 0.04ms | 0.03ms | +0.0080ms | +27.15% |
| mean | 0.0071ms | 0.0066ms | +0.00044ms | +6.56% |
| min | 0.0038ms | 0.0038ms | +0.000042ms | +1.11% |
| max | 0.05ms | 0.05ms | +0.0047ms | +10.27% |
| total | 1.42ms | 1.33ms | +0.09ms | +6.56% |

### driveCrossTenantRefuse

# Perf Report — driveCrossTenantRefuse.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0073ms |
| p50 | 0.0078ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0087ms |
| stdev | 0.0042ms |
| min | 0.0072ms |
| max | 0.05ms |
| total | 1.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0075ms | -0.00017ms | -2.23% |
| p50 | 0.0078ms | 0.0078ms | -0.000062ms | -0.79% |
| p95 | 0.01ms | 0.01ms | +0.0042ms | +40.97% |
| p99 | 0.03ms | 0.02ms | +0.0054ms | +26.07% |
| mean | 0.0087ms | 0.0083ms | +0.00041ms | +4.99% |
| min | 0.0072ms | 0.0074ms | -0.00017ms | -2.26% |
| max | 0.05ms | 0.02ms | +0.02ms | +107.45% |
| total | 1.74ms | 1.66ms | +0.08ms | +4.99% |

### driveBypassAudit

# Perf Report — driveBypassAudit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0069ms |
| p50 | 0.0070ms |
| p95 | 0.0098ms |
| p99 | 0.02ms |
| mean | 0.0076ms |
| stdev | 0.0020ms |
| min | 0.0068ms |
| max | 0.02ms |
| total | 1.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.0070ms | -0.000042ms | -0.60% |
| p50 | 0.0070ms | 0.0071ms | -0.000041ms | -0.59% |
| p95 | 0.0098ms | 0.01ms | -0.0042ms | -30.25% |
| p99 | 0.02ms | 0.02ms | -0.0052ms | -23.32% |
| mean | 0.0076ms | 0.0079ms | -0.00029ms | -3.71% |
| min | 0.0068ms | 0.0068ms | -0.0000010ms | -0.01% |
| max | 0.02ms | 0.03ms | -0.0098ms | -30.02% |
| total | 1.52ms | 1.58ms | -0.06ms | -3.71% |

### driveAuditIntegrity

# Perf Report — driveAuditIntegrity.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0045ms |
| p50 | 0.0047ms |
| p95 | 0.0068ms |
| p99 | 0.01ms |
| mean | 0.0056ms |
| stdev | 0.0085ms |
| min | 0.0044ms |
| max | 0.12ms |
| total | 1.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0045ms | -0.000037ms | -0.81% |
| p50 | 0.0047ms | 0.0046ms | +0.000041ms | +0.89% |
| p95 | 0.0068ms | 0.0061ms | +0.00072ms | +11.72% |
| p99 | 0.01ms | 0.01ms | +0.00096ms | +7.87% |
| mean | 0.0056ms | 0.0051ms | +0.00055ms | +10.73% |
| min | 0.0044ms | 0.0045ms | -0.000041ms | -0.92% |
| max | 0.12ms | 0.03ms | +0.09ms | +303.94% |
| total | 1.13ms | 1.02ms | +0.11ms | +10.73% |

