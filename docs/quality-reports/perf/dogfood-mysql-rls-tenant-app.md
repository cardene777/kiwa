# Perf Suite — dogfood-mysql-rls-tenant-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveTenantInjection | 0.0041ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCrossTenantRefuse | 0.0075ms | 0.01ms | 100ms | 0.00033ms | PASS | stable (p10 +1% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveBypassAudit | 0.0076ms | 0.0096ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAuditIntegrity | 0.0052ms | 0.0063ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveTenantInjection | 0.10ms | 160ms | PASS |
| driveCrossTenantRefuse | 0.10ms | 200ms | PASS |
| driveBypassAudit | 0.10ms | 160ms | PASS |
| driveAuditIntegrity | 0.06ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveTenantInjection | 3064 B | 0 B | 102400 B | yes | PASS |
| driveCrossTenantRefuse | -2856 B | 0 B | 102400 B | yes | PASS |
| driveBypassAudit | 2336 B | 0 B | 102400 B | yes | PASS |
| driveAuditIntegrity | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveTenantInjection

# Perf Report — driveTenantInjection.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0041ms |
| p50 | 0.0052ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0071ms |
| stdev | 0.0055ms |
| min | 0.0039ms |
| max | 0.05ms |
| total | 1.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0041ms | 0.0039ms | +0.00017ms | +4.26% |
| p50 | 0.0052ms | 0.0050ms | +0.00021ms | +4.16% |
| p95 | 0.01ms | 0.01ms | +0.0012ms | +11.15% |
| p99 | 0.03ms | 0.03ms | +0.0037ms | +12.67% |
| mean | 0.0071ms | 0.0066ms | +0.00041ms | +6.10% |
| min | 0.0039ms | 0.0038ms | +0.00013ms | +3.30% |
| max | 0.05ms | 0.05ms | +0.0013ms | +2.88% |
| total | 1.41ms | 1.33ms | +0.08ms | +6.10% |

### driveCrossTenantRefuse

# Perf Report — driveCrossTenantRefuse.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0075ms |
| p50 | 0.0078ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0083ms |
| stdev | 0.0021ms |
| min | 0.0075ms |
| max | 0.02ms |
| total | 1.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0075ms | 0.0075ms | +0.000084ms | +1.13% |
| p50 | 0.0078ms | 0.0078ms | -0.000041ms | -0.52% |
| p95 | 0.01ms | 0.01ms | +0.0021ms | +20.14% |
| p99 | 0.02ms | 0.02ms | -0.0026ms | -12.40% |
| mean | 0.0083ms | 0.0083ms | -0.0000076ms | -0.09% |
| min | 0.0075ms | 0.0074ms | +0.000083ms | +1.13% |
| max | 0.02ms | 0.02ms | +0.0011ms | +4.84% |
| total | 1.66ms | 1.66ms | -0.0015ms | -0.09% |

### driveBypassAudit

# Perf Report — driveBypassAudit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0076ms |
| p50 | 0.0077ms |
| p95 | 0.0096ms |
| p99 | 0.02ms |
| mean | 0.0082ms |
| stdev | 0.0020ms |
| min | 0.0075ms |
| max | 0.03ms |
| total | 1.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0076ms | 0.0070ms | +0.00062ms | +8.97% |
| p50 | 0.0077ms | 0.0071ms | +0.00062ms | +8.82% |
| p95 | 0.0096ms | 0.01ms | -0.0044ms | -31.59% |
| p99 | 0.02ms | 0.02ms | -0.0048ms | -21.60% |
| mean | 0.0082ms | 0.0079ms | +0.00030ms | +3.86% |
| min | 0.0075ms | 0.0068ms | +0.00067ms | +9.75% |
| max | 0.03ms | 0.03ms | -0.0066ms | -20.23% |
| total | 1.64ms | 1.58ms | +0.06ms | +3.86% |

### driveAuditIntegrity

# Perf Report — driveAuditIntegrity.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0052ms |
| p50 | 0.0055ms |
| p95 | 0.0063ms |
| p99 | 0.02ms |
| mean | 0.0062ms |
| stdev | 0.0065ms |
| min | 0.0051ms |
| max | 0.09ms |
| total | 1.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0045ms | +0.00067ms | +14.70% |
| p50 | 0.0055ms | 0.0046ms | +0.00083ms | +18.01% |
| p95 | 0.0063ms | 0.0061ms | +0.00015ms | +2.42% |
| p99 | 0.02ms | 0.01ms | +0.0044ms | +36.24% |
| mean | 0.0062ms | 0.0051ms | +0.0011ms | +21.69% |
| min | 0.0051ms | 0.0045ms | +0.00067ms | +14.96% |
| max | 0.09ms | 0.03ms | +0.06ms | +209.39% |
| total | 1.24ms | 1.02ms | +0.22ms | +21.69% |

