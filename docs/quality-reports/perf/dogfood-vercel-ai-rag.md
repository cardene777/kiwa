# Perf Suite — dogfood-vercel-ai-rag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| embed | 0.0037ms | 0.01ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| retrieve | 0.0059ms | 0.01ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| answer | 8.62ms | 9.21ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| embed | 0.07ms | 40ms | PASS |
| retrieve | 0.18ms | 60ms | PASS |
| answer | 9.49ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| embed | 10280 B | 0 B | 102400 B | yes | PASS |
| retrieve | 50344 B | 0 B | 102400 B | yes | PASS |
| answer | 47328 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### embed

# Perf Report — embed.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0038ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0054ms |
| stdev | 0.0035ms |
| min | 0.0037ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0039ms | -0.00017ms | -4.24% |
| p50 | 0.0038ms | 0.0040ms | -0.00017ms | -4.16% |
| p95 | 0.01ms | 0.01ms | -0.00091ms | -7.62% |
| p99 | 0.02ms | 0.02ms | -0.0015ms | -7.48% |
| mean | 0.0054ms | 0.0057ms | -0.00031ms | -5.50% |
| min | 0.0037ms | 0.0039ms | -0.00013ms | -3.23% |
| max | 0.02ms | 0.02ms | -0.0014ms | -6.79% |
| total | 0.21ms | 0.23ms | -0.01ms | -5.50% |

### retrieve

# Perf Report — retrieve.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0059ms |
| p50 | 0.0061ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0080ms |
| stdev | 0.0038ms |
| min | 0.0058ms |
| max | 0.02ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0062ms | -0.00025ms | -4.00% |
| p50 | 0.0061ms | 0.0065ms | -0.00040ms | -6.05% |
| p95 | 0.01ms | 0.02ms | -0.0052ms | -28.15% |
| p99 | 0.02ms | 0.03ms | -0.0085ms | -27.84% |
| mean | 0.0080ms | 0.0091ms | -0.0011ms | -12.13% |
| min | 0.0058ms | 0.0059ms | -0.00013ms | -2.11% |
| max | 0.02ms | 0.03ms | -0.0088ms | -26.78% |
| total | 0.32ms | 0.36ms | -0.04ms | -12.13% |

### answer

# Perf Report — answer.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 8.62ms |
| p50 | 9.16ms |
| p95 | 9.21ms |
| p99 | 9.25ms |
| mean | 9.04ms |
| stdev | 0.27ms |
| min | 8.28ms |
| max | 9.27ms |
| total | 361.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.62ms | 8.59ms | +0.03ms | +0.30% |
| p50 | 9.16ms | 9.14ms | +0.02ms | +0.18% |
| p95 | 9.21ms | 9.18ms | +0.03ms | +0.37% |
| p99 | 9.25ms | 9.38ms | -0.13ms | -1.44% |
| mean | 9.04ms | 9.03ms | +0.0069ms | +0.08% |
| min | 8.28ms | 8.17ms | +0.11ms | +1.34% |
| max | 9.27ms | 9.49ms | -0.23ms | -2.38% |
| total | 361.46ms | 361.18ms | +0.28ms | +0.08% |

