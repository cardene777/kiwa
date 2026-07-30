# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 19.03ms | 22.10ms | 1200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 14.39ms | 17.69ms | 900ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 11.15ms | 13.83ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | cpu | 0.08ms | 0.10ms | 19.03ms | 233.009 | 240.124 | 19.11ms | 19.69ms |
| violation_report_batch (2 dirty runAxe + reportViolations) | cpu | 0.08ms | 0.09ms | 14.39ms | 174.618 | 182.478 | 14.31ms | 14.95ms |
| audit_error_handling (3 invalid-context throw + catch) | cpu | 0.08ms | 0.08ms | 11.15ms | 137.416 | 159.866 | 11.30ms | 13.14ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 82.13ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 68.36ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 52.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -305368 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -2146000 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -126136 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 19.03ms |
| p50 | 20.31ms |
| p95 | 22.10ms |
| p99 | 23.98ms |
| mean | 20.47ms |
| stdev | 1.37ms |
| min | 18.84ms |
| max | 24.45ms |
| total | 409.41ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.004)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 19.11ms | 19.69ms | -0.58ms | -2.96% |
| p50 | 20.39ms | 22.07ms | -1.68ms | -7.60% |
| p95 | 22.19ms | 25.24ms | -3.05ms | -12.08% |
| p99 | 24.07ms | 25.58ms | -1.51ms | -5.90% |
| mean | 20.55ms | 21.94ms | -1.39ms | -6.33% |
| min | 18.91ms | 18.93ms | -0.02ms | -0.13% |
| max | 24.54ms | 25.67ms | -1.13ms | -4.38% |
| total | 411.00ms | 438.77ms | -27.77ms | -6.33% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 14.39ms |
| p50 | 15.97ms |
| p95 | 17.69ms |
| p99 | 19.93ms |
| mean | 15.95ms |
| stdev | 1.42ms |
| min | 13.74ms |
| max | 20.49ms |
| total | 319.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.994)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 14.31ms | 14.95ms | -0.64ms | -4.31% |
| p50 | 15.88ms | 15.80ms | +0.08ms | +0.48% |
| p95 | 17.59ms | 21.86ms | -4.27ms | -19.55% |
| p99 | 19.81ms | 22.20ms | -2.39ms | -10.75% |
| mean | 15.86ms | 16.73ms | -0.87ms | -5.21% |
| min | 13.66ms | 14.22ms | -0.56ms | -3.94% |
| max | 20.37ms | 22.29ms | -1.91ms | -8.59% |
| total | 317.17ms | 334.61ms | -17.44ms | -5.21% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 11.15ms |
| p50 | 12.82ms |
| p95 | 13.83ms |
| p99 | 13.98ms |
| mean | 12.59ms |
| stdev | 1.07ms |
| min | 10.48ms |
| max | 14.02ms |
| total | 251.79ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.013)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 11.30ms | 13.14ms | -1.85ms | -14.04% |
| p50 | 12.99ms | 14.34ms | -1.35ms | -9.43% |
| p95 | 14.00ms | 15.06ms | -1.05ms | -6.98% |
| p99 | 14.16ms | 15.28ms | -1.12ms | -7.33% |
| mean | 12.75ms | 14.11ms | -1.36ms | -9.64% |
| min | 10.61ms | 12.69ms | -2.08ms | -16.36% |
| max | 14.20ms | 15.34ms | -1.14ms | -7.41% |
| total | 255.00ms | 282.22ms | -27.21ms | -9.64% |

