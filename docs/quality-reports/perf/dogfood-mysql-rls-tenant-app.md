# Perf Suite — dogfood-mysql-rls-tenant-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveTenantInjection | 0.0042ms | 0.03ms | 80ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCrossTenantRefuse | 0.0083ms | 0.02ms | 100ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveBypassAudit | 0.0077ms | 0.01ms | 80ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAuditIntegrity | 0.0052ms | 0.02ms | 100ms | 0.00031ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +57% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| driveTenantInjection | cpu | 0.09ms | 0.10ms | 0.0042ms | 0.048 | 0.051 | 0.0040ms | 0.0043ms |
| driveCrossTenantRefuse | cpu | 0.09ms | 0.10ms | 0.0083ms | 0.093 | 0.099 | 0.0077ms | 0.0082ms |
| driveBypassAudit | cpu | 0.09ms | 0.09ms | 0.0077ms | 0.087 | 0.087 | 0.0071ms | 0.0071ms |
| driveAuditIntegrity | cpu | 0.09ms | 0.11ms | 0.0052ms | 0.058 | 0.059 | 0.0048ms | 0.0048ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveTenantInjection | 0.09ms | 160ms | PASS |
| driveCrossTenantRefuse | 0.18ms | 200ms | PASS |
| driveBypassAudit | 0.10ms | 160ms | PASS |
| driveAuditIntegrity | 0.07ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveTenantInjection | 4136 B | 0 B | 102400 B | yes | PASS |
| driveCrossTenantRefuse | -3776 B | 0 B | 102400 B | yes | PASS |
| driveBypassAudit | 2464 B | 0 B | 102400 B | yes | PASS |
| driveAuditIntegrity | -296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveTenantInjection

# Perf Report — driveTenantInjection.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0042ms |
| p50 | 0.0053ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.0080ms |
| stdev | 0.0093ms |
| min | 0.0039ms |
| max | 0.07ms |
| total | 1.59ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.961)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0043ms | -0.00025ms | -5.82% |
| p50 | 0.0050ms | 0.0057ms | -0.00067ms | -11.66% |
| p95 | 0.02ms | 0.05ms | -0.02ms | -46.93% |
| p99 | 0.05ms | 0.08ms | -0.03ms | -38.99% |
| mean | 0.0076ms | 0.01ms | -0.0054ms | -41.18% |
| min | 0.0037ms | 0.0039ms | -0.00015ms | -3.94% |
| max | 0.07ms | 0.10ms | -0.03ms | -31.89% |
| total | 1.53ms | 2.60ms | -1.07ms | -41.18% |

### driveCrossTenantRefuse

# Perf Report — driveCrossTenantRefuse.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0083ms |
| p50 | 0.0088ms |
| p95 | 0.02ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0082ms |
| max | 0.16ms |
| total | 2.42ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.920)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0082ms | -0.00054ms | -6.58% |
| p50 | 0.0081ms | 0.0092ms | -0.0011ms | -11.97% |
| p95 | 0.02ms | 0.10ms | -0.08ms | -79.14% |
| p99 | 0.06ms | 0.42ms | -0.36ms | -84.90% |
| mean | 0.01ms | 0.05ms | -0.04ms | -78.62% |
| min | 0.0075ms | 0.0077ms | -0.00020ms | -2.59% |
| max | 0.15ms | 4.57ms | -4.42ms | -96.76% |
| total | 2.22ms | 10.40ms | -8.17ms | -78.62% |

### driveBypassAudit

# Perf Report — driveBypassAudit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.0079ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0089ms |
| stdev | 0.0045ms |
| min | 0.0076ms |
| max | 0.05ms |
| total | 1.79ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0071ms | -0.0000024ms | -0.03% |
| p50 | 0.0073ms | 0.0077ms | -0.00043ms | -5.60% |
| p95 | 0.01ms | 0.02ms | -0.0049ms | -26.75% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -30.22% |
| mean | 0.0083ms | 0.0092ms | -0.00097ms | -10.51% |
| min | 0.0070ms | 0.0069ms | +0.00013ms | +1.93% |
| max | 0.05ms | 0.04ms | +0.0028ms | +6.34% |
| total | 1.65ms | 1.84ms | -0.19ms | -10.51% |

### driveAuditIntegrity

# Perf Report — driveAuditIntegrity.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0052ms |
| p50 | 0.0054ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.0087ms |
| stdev | 0.01ms |
| min | 0.0050ms |
| max | 0.16ms |
| total | 1.74ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.921)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0048ms | 0.0048ms | -0.000079ms | -1.64% |
| p50 | 0.0050ms | 0.0053ms | -0.00030ms | -5.70% |
| p95 | 0.02ms | 0.01ms | +0.0078ms | +57.40% |
| p99 | 0.05ms | 0.03ms | +0.01ms | +42.84% |
| mean | 0.0080ms | 0.0066ms | +0.0015ms | +22.18% |
| min | 0.0046ms | 0.0046ms | -0.000019ms | -0.42% |
| max | 0.15ms | 0.06ms | +0.09ms | +146.79% |
| total | 1.60ms | 1.31ms | +0.29ms | +22.18% |

