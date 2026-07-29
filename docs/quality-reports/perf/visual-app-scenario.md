# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限はこの 2 倍 = 0.00050ms。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | gate | regression |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.0084ms | 0.03ms | 30ms | PASS | stable (下側は動かず p95 のみ +39% (実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.05ms | 0.07ms | 100ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.0086ms | 0.01ms | 100ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.05ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.15ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 88256 B | -280206 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 477304 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 96008 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0084ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0074ms |
| min | 0.0082ms |
| max | 0.04ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0084ms | 0.0088ms | -0.00038ms | -4.27% |
| p50 | 0.01ms | 0.01ms | -0.00046ms | -4.32% |
| p95 | 0.03ms | 0.02ms | +0.0075ms | +38.67% |
| p99 | 0.04ms | 0.02ms | +0.01ms | +57.16% |
| mean | 0.01ms | 0.01ms | +0.0012ms | +10.06% |
| min | 0.0082ms | 0.0087ms | -0.00050ms | -5.78% |
| max | 0.04ms | 0.02ms | +0.01ms | +60.99% |
| total | 0.26ms | 0.24ms | +0.02ms | +10.06% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.07ms |
| p99 | 0.10ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.10ms |
| total | 1.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0033ms | -6.66% |
| p50 | 0.05ms | 0.05ms | -0.0018ms | -3.25% |
| p95 | 0.07ms | 0.13ms | -0.06ms | -45.23% |
| p99 | 0.10ms | 0.35ms | -0.26ms | -72.71% |
| mean | 0.06ms | 0.08ms | -0.02ms | -27.09% |
| min | 0.05ms | 0.05ms | -0.0030ms | -5.98% |
| max | 0.10ms | 0.41ms | -0.30ms | -74.95% |
| total | 1.13ms | 1.55ms | -0.42ms | -27.09% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0086ms |
| p50 | 0.0093ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0094ms |
| stdev | 0.00089ms |
| min | 0.0084ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0086ms | 0.0095ms | -0.00085ms | -8.94% |
| p50 | 0.0093ms | 0.01ms | -0.00090ms | -8.76% |
| p95 | 0.01ms | 0.01ms | -0.0015ms | -11.43% |
| p99 | 0.01ms | 0.01ms | -0.0020ms | -14.92% |
| mean | 0.0094ms | 0.01ms | -0.0011ms | -10.41% |
| min | 0.0084ms | 0.0093ms | -0.00092ms | -9.83% |
| max | 0.01ms | 0.01ms | -0.0021ms | -15.74% |
| total | 0.19ms | 0.21ms | -0.02ms | -10.41% |

