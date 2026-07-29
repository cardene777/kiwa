# Perf Suite — dogfood-mysql-rls-tenant-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveTenantInjection | 0.0039ms | 0.02ms | 80ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCrossTenantRefuse | 0.0078ms | 0.03ms | 100ms | 0.00033ms | PASS | stable (p10 +4% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveBypassAudit | 0.0068ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAuditIntegrity | 0.0045ms | 0.0073ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| driveTenantInjection | cpu | 0.08ms | 0.0039ms | 0.048 | 0.046 | 0.0038ms | 0.0037ms |
| driveCrossTenantRefuse | cpu | 0.08ms | 0.0078ms | 0.097 | 0.093 | 0.0077ms | 0.0075ms |
| driveBypassAudit | cpu | 0.08ms | 0.0068ms | 0.086 | 0.085 | 0.0068ms | 0.0068ms |
| driveAuditIntegrity | cpu | 0.08ms | 0.0045ms | 0.056 | 0.056 | 0.0045ms | 0.0045ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveTenantInjection | 0.10ms | 160ms | PASS |
| driveCrossTenantRefuse | 0.11ms | 200ms | PASS |
| driveBypassAudit | 0.09ms | 160ms | PASS |
| driveAuditIntegrity | 0.08ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveTenantInjection | -2328 B | 0 B | 102400 B | yes | PASS |
| driveCrossTenantRefuse | -2824 B | 0 B | 102400 B | yes | PASS |
| driveBypassAudit | 2368 B | 0 B | 102400 B | yes | PASS |
| driveAuditIntegrity | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveTenantInjection

# Perf Report — driveTenantInjection.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0039ms |
| p50 | 0.0054ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.0085ms |
| stdev | 0.0079ms |
| min | 0.0037ms |
| max | 0.05ms |
| total | 1.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0039ms | 0.0037ms | +0.00021ms | +5.75% |
| p50 | 0.0054ms | 0.0048ms | +0.00056ms | +11.75% |
| p95 | 0.02ms | 0.02ms | +0.0019ms | +8.24% |
| p99 | 0.05ms | 0.04ms | +0.0080ms | +21.41% |
| mean | 0.0085ms | 0.0068ms | +0.0017ms | +24.65% |
| min | 0.0037ms | 0.0035ms | +0.00013ms | +3.56% |
| max | 0.05ms | 0.05ms | +0.0040ms | +7.79% |
| total | 1.69ms | 1.36ms | +0.33ms | +24.65% |

### driveCrossTenantRefuse

# Perf Report — driveCrossTenantRefuse.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0078ms |
| p50 | 0.0082ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0077ms |
| max | 0.14ms |
| total | 2.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0078ms | 0.0075ms | +0.00037ms | +4.96% |
| p50 | 0.0082ms | 0.0078ms | +0.00038ms | +4.79% |
| p95 | 0.03ms | 0.02ms | +0.0078ms | +43.74% |
| p99 | 0.04ms | 0.04ms | +0.000060ms | +0.14% |
| mean | 0.01ms | 0.0094ms | +0.0024ms | +25.04% |
| min | 0.0077ms | 0.0073ms | +0.00042ms | +5.70% |
| max | 0.14ms | 0.06ms | +0.08ms | +128.83% |
| total | 2.35ms | 1.88ms | +0.47ms | +25.04% |

### driveBypassAudit

# Perf Report — driveBypassAudit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0068ms |
| p50 | 0.0070ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0080ms |
| stdev | 0.0038ms |
| min | 0.0067ms |
| max | 0.04ms |
| total | 1.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0068ms | +0.000041ms | +0.60% |
| p50 | 0.0070ms | 0.0070ms | +0.000042ms | +0.60% |
| p95 | 0.01ms | 0.01ms | -0.00029ms | -2.21% |
| p99 | 0.02ms | 0.02ms | +0.0047ms | +23.31% |
| mean | 0.0080ms | 0.0078ms | +0.00014ms | +1.79% |
| min | 0.0067ms | 0.0067ms | 0.00ms | 0.00% |
| max | 0.04ms | 0.04ms | +0.00079ms | +2.04% |
| total | 1.59ms | 1.57ms | +0.03ms | +1.79% |

### driveAuditIntegrity

# Perf Report — driveAuditIntegrity.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0045ms |
| p50 | 0.0047ms |
| p95 | 0.0073ms |
| p99 | 0.02ms |
| mean | 0.0053ms |
| stdev | 0.0038ms |
| min | 0.0044ms |
| max | 0.05ms |
| total | 1.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0045ms | +0.000083ms | +1.86% |
| p50 | 0.0047ms | 0.0046ms | +0.000083ms | +1.79% |
| p95 | 0.0073ms | 0.0082ms | -0.00094ms | -11.43% |
| p99 | 0.02ms | 0.03ms | -0.02ms | -50.62% |
| mean | 0.0053ms | 0.0059ms | -0.00053ms | -9.09% |
| min | 0.0044ms | 0.0044ms | +0.0000010ms | +0.02% |
| max | 0.05ms | 0.09ms | -0.04ms | -43.84% |
| total | 1.07ms | 1.18ms | -0.11ms | -9.09% |

