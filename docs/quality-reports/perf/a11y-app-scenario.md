# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 21.99ms | 54.14ms | 1200ms | 0.00043ms | PASS | stable (p10 +1% (閾値未満)、 p95 +108% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 16.94ms | 23.46ms | 900ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 12.48ms | 22.78ms | 100ms | 0.00050ms | PASS | stable (p10 -7% (閾値未満)、 p95 +40% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | cpu | 0.09ms | 21.99ms | 231.885 | 228.607 | 19.08ms | 18.81ms |
| violation_report_batch (2 dirty runAxe + reportViolations) | cpu | 0.08ms | 16.94ms | 202.892 | 204.249 | 16.98ms | 17.09ms |
| audit_error_handling (3 invalid-context throw + catch) | cpu | 0.08ms | 12.48ms | 151.231 | 162.834 | 12.54ms | 13.51ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 144.71ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 102.75ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 60.75ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -306144 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 52576 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -87352 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 21.99ms |
| p50 | 25.57ms |
| p95 | 54.14ms |
| p99 | 54.27ms |
| mean | 28.88ms |
| stdev | 9.91ms |
| min | 21.35ms |
| max | 54.31ms |
| total | 577.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 21.99ms | 18.81ms | +3.18ms | +16.91% |
| p50 | 25.57ms | 20.53ms | +5.04ms | +24.53% |
| p95 | 54.14ms | 22.63ms | +31.51ms | +139.26% |
| p99 | 54.27ms | 23.69ms | +30.59ms | +129.11% |
| mean | 28.88ms | 20.67ms | +8.21ms | +39.69% |
| min | 21.35ms | 18.57ms | +2.78ms | +14.96% |
| max | 54.31ms | 23.95ms | +30.35ms | +126.72% |
| total | 577.62ms | 413.49ms | +164.12ms | +39.69% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.94ms |
| p50 | 18.70ms |
| p95 | 23.46ms |
| p99 | 23.79ms |
| mean | 19.05ms |
| stdev | 2.00ms |
| min | 16.29ms |
| max | 23.87ms |
| total | 380.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.94ms | 17.09ms | -0.15ms | -0.90% |
| p50 | 18.70ms | 18.75ms | -0.06ms | -0.30% |
| p95 | 23.46ms | 31.23ms | -7.77ms | -24.89% |
| p99 | 23.79ms | 32.20ms | -8.41ms | -26.12% |
| mean | 19.05ms | 19.81ms | -0.76ms | -3.84% |
| min | 16.29ms | 15.61ms | +0.68ms | +4.38% |
| max | 23.87ms | 32.44ms | -8.57ms | -26.42% |
| total | 380.98ms | 396.18ms | -15.20ms | -3.84% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 12.48ms |
| p50 | 13.62ms |
| p95 | 22.78ms |
| p99 | 23.29ms |
| mean | 14.76ms |
| stdev | 3.36ms |
| min | 11.38ms |
| max | 23.41ms |
| total | 295.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 12.48ms | 13.51ms | -1.03ms | -7.61% |
| p50 | 13.62ms | 14.52ms | -0.89ms | -6.15% |
| p95 | 22.78ms | 16.36ms | +6.42ms | +39.22% |
| p99 | 23.29ms | 17.22ms | +6.07ms | +35.22% |
| mean | 14.76ms | 14.65ms | +0.11ms | +0.73% |
| min | 11.38ms | 13.31ms | -1.92ms | -14.45% |
| max | 23.41ms | 17.44ms | +5.98ms | +34.28% |
| total | 295.23ms | 293.10ms | +2.13ms | +0.73% |

