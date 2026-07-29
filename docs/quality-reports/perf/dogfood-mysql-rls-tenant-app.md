# Perf Suite — dogfood-mysql-rls-tenant-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveTenantInjection | 0.0039ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCrossTenantRefuse | 0.0076ms | 0.01ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveBypassAudit | 0.0069ms | 0.0085ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAuditIntegrity | 0.0046ms | 0.0061ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveTenantInjection | 0.08ms | 160ms | PASS |
| driveCrossTenantRefuse | 0.13ms | 200ms | PASS |
| driveBypassAudit | 0.09ms | 160ms | PASS |
| driveAuditIntegrity | 0.06ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveTenantInjection | 3656 B | 0 B | 102400 B | yes | PASS |
| driveCrossTenantRefuse | -3272 B | 0 B | 102400 B | yes | PASS |
| driveBypassAudit | 2432 B | 0 B | 102400 B | yes | PASS |
| driveAuditIntegrity | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveTenantInjection

# Perf Report — driveTenantInjection.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0039ms |
| p50 | 0.0049ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0068ms |
| stdev | 0.0061ms |
| min | 0.0037ms |
| max | 0.05ms |
| total | 1.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0039ms | 0.0039ms | -0.0000041ms | -0.10% |
| p50 | 0.0049ms | 0.0050ms | -0.00010ms | -2.09% |
| p95 | 0.01ms | 0.01ms | +0.00072ms | +6.63% |
| p99 | 0.03ms | 0.03ms | +0.0048ms | +16.25% |
| mean | 0.0068ms | 0.0066ms | +0.00017ms | +2.53% |
| min | 0.0037ms | 0.0038ms | -0.000041ms | -1.08% |
| max | 0.05ms | 0.05ms | +0.0038ms | +8.20% |
| total | 1.36ms | 1.33ms | +0.03ms | +2.53% |

### driveCrossTenantRefuse

# Perf Report — driveCrossTenantRefuse.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0076ms |
| p50 | 0.0078ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0084ms |
| stdev | 0.0023ms |
| min | 0.0074ms |
| max | 0.02ms |
| total | 1.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0076ms | 0.0075ms | +0.00017ms | +2.24% |
| p50 | 0.0078ms | 0.0078ms | +0.0000010ms | +0.01% |
| p95 | 0.01ms | 0.01ms | +0.0010ms | +9.78% |
| p99 | 0.02ms | 0.02ms | +0.00029ms | +1.40% |
| mean | 0.0084ms | 0.0083ms | +0.000077ms | +0.93% |
| min | 0.0074ms | 0.0074ms | +0.000042ms | +0.57% |
| max | 0.02ms | 0.02ms | +0.00083ms | +3.72% |
| total | 1.67ms | 1.66ms | +0.02ms | +0.93% |

### driveBypassAudit

# Perf Report — driveBypassAudit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0069ms |
| p50 | 0.0070ms |
| p95 | 0.0085ms |
| p99 | 0.02ms |
| mean | 0.0074ms |
| stdev | 0.0019ms |
| min | 0.0068ms |
| max | 0.02ms |
| total | 1.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.0070ms | -0.000084ms | -1.21% |
| p50 | 0.0070ms | 0.0071ms | -0.000083ms | -1.18% |
| p95 | 0.0085ms | 0.01ms | -0.0055ms | -39.53% |
| p99 | 0.02ms | 0.02ms | -0.0056ms | -25.28% |
| mean | 0.0074ms | 0.0079ms | -0.00046ms | -5.88% |
| min | 0.0068ms | 0.0068ms | -0.0000010ms | -0.01% |
| max | 0.02ms | 0.03ms | -0.01ms | -32.82% |
| total | 1.48ms | 1.58ms | -0.09ms | -5.88% |

### driveAuditIntegrity

# Perf Report — driveAuditIntegrity.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0046ms |
| p50 | 0.0048ms |
| p95 | 0.0061ms |
| p99 | 0.01ms |
| mean | 0.0056ms |
| stdev | 0.0070ms |
| min | 0.0046ms |
| max | 0.10ms |
| total | 1.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0045ms | +0.000088ms | +1.94% |
| p50 | 0.0048ms | 0.0046ms | +0.00017ms | +3.61% |
| p95 | 0.0061ms | 0.0061ms | -0.000029ms | -0.48% |
| p99 | 0.01ms | 0.01ms | +0.00057ms | +4.65% |
| mean | 0.0056ms | 0.0051ms | +0.00049ms | +9.68% |
| min | 0.0046ms | 0.0045ms | +0.00013ms | +2.80% |
| max | 0.10ms | 0.03ms | +0.07ms | +233.20% |
| total | 1.12ms | 1.02ms | +0.10ms | +9.68% |

