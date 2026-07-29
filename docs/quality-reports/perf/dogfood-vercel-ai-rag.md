# Perf Suite — dogfood-vercel-ai-rag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| embed | 0.0038ms | 0.01ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| retrieve | 0.0059ms | 0.01ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| answer | 8.38ms | 9.17ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| embed | 0.05ms | 40ms | PASS |
| retrieve | 0.09ms | 60ms | PASS |
| answer | 9.41ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| embed | 15048 B | 0 B | 102400 B | yes | PASS |
| retrieve | 48608 B | 0 B | 102400 B | yes | PASS |
| answer | 47680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### embed

# Perf Report — embed.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0038ms |
| p50 | 0.0040ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0054ms |
| stdev | 0.0031ms |
| min | 0.0037ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0039ms | -0.00013ms | -3.19% |
| p50 | 0.0040ms | 0.0040ms | -5.0e-7ms | -0.01% |
| p95 | 0.01ms | 0.01ms | -0.00061ms | -5.14% |
| p99 | 0.02ms | 0.02ms | -0.0028ms | -14.39% |
| mean | 0.0054ms | 0.0057ms | -0.00024ms | -4.27% |
| min | 0.0037ms | 0.0039ms | -0.00017ms | -4.31% |
| max | 0.02ms | 0.02ms | -0.0039ms | -18.56% |
| total | 0.22ms | 0.23ms | -0.0097ms | -4.27% |

### retrieve

# Perf Report — retrieve.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0059ms |
| p50 | 0.0063ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0076ms |
| stdev | 0.0026ms |
| min | 0.0059ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0062ms | -0.00025ms | -3.99% |
| p50 | 0.0063ms | 0.0065ms | -0.00021ms | -3.19% |
| p95 | 0.01ms | 0.02ms | -0.0072ms | -38.98% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -46.75% |
| mean | 0.0076ms | 0.0091ms | -0.0014ms | -15.90% |
| min | 0.0059ms | 0.0059ms | -0.000042ms | -0.71% |
| max | 0.02ms | 0.03ms | -0.01ms | -42.51% |
| total | 0.31ms | 0.36ms | -0.06ms | -15.90% |

### answer

# Perf Report — answer.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 8.38ms |
| p50 | 9.10ms |
| p95 | 9.17ms |
| p99 | 9.19ms |
| mean | 8.94ms |
| stdev | 0.30ms |
| min | 8.14ms |
| max | 9.19ms |
| total | 357.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.38ms | 8.59ms | -0.21ms | -2.47% |
| p50 | 9.10ms | 9.14ms | -0.04ms | -0.46% |
| p95 | 9.17ms | 9.18ms | -0.0073ms | -0.08% |
| p99 | 9.19ms | 9.38ms | -0.20ms | -2.09% |
| mean | 8.94ms | 9.03ms | -0.09ms | -0.98% |
| min | 8.14ms | 8.17ms | -0.03ms | -0.32% |
| max | 9.19ms | 9.49ms | -0.30ms | -3.20% |
| total | 357.66ms | 361.18ms | -3.52ms | -0.98% |

