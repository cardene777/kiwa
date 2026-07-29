# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluateFlag | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| evaluateAllFlags | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| registerRule | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +149209%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.03ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 15816 B | -48658 B | 102400 B | yes | PASS |
| evaluateAllFlags | 87112 B | 0 B | 102400 B | yes | PASS |
| registerRule | 22760 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +146.72% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +177.53% |
| p99 | 0.02ms | 0.01ms | +0.02ms | +337.76% |
| mean | 0.00ms | 0.00ms | +0.00ms | +140.15% |
| min | 0.00ms | 0.00ms | +0.00ms | +150.09% |
| max | 0.03ms | 0.02ms | +0.01ms | +74.54% |
| total | 0.42ms | 0.18ms | +0.25ms | +140.15% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +93.80% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +78.36% |
| mean | 0.00ms | 0.00ms | +0.00ms | +27.98% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.59% |
| max | 0.00ms | 0.00ms | +0.00ms | +30.29% |
| total | 0.27ms | 0.21ms | +0.06ms | +27.98% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.77% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +30.26% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.39% |
| min | 0.00ms | 0.00ms | +0.00ms | +24.55% |
| max | 0.01ms | 0.01ms | -0.00ms | -11.80% |
| total | 0.07ms | 0.06ms | +0.01ms | +10.39% |

