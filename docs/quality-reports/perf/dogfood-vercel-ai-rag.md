# Perf Suite — dogfood-vercel-ai-rag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| embed | 0.0037ms | 0.01ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| retrieve | 0.0062ms | 0.01ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| answer | 8.82ms | 9.22ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| embed | 0.07ms | 40ms | PASS |
| retrieve | 0.08ms | 60ms | PASS |
| answer | 9.42ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| embed | 14880 B | 0 B | 102400 B | yes | PASS |
| retrieve | 45888 B | 0 B | 102400 B | yes | PASS |
| answer | 48560 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### embed

# Perf Report — embed.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0040ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0056ms |
| stdev | 0.0035ms |
| min | 0.0037ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0039ms | -0.00017ms | -4.24% |
| p50 | 0.0040ms | 0.0040ms | 0.00ms | 0.00% |
| p95 | 0.01ms | 0.01ms | +0.00041ms | +3.46% |
| p99 | 0.02ms | 0.02ms | -0.0017ms | -8.70% |
| mean | 0.0056ms | 0.0057ms | -0.000076ms | -1.34% |
| min | 0.0037ms | 0.0039ms | -0.00013ms | -3.23% |
| max | 0.02ms | 0.02ms | -0.0025ms | -11.98% |
| total | 0.22ms | 0.23ms | -0.0030ms | -1.34% |

### retrieve

# Perf Report — retrieve.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0062ms |
| p50 | 0.0082ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0093ms |
| stdev | 0.0033ms |
| min | 0.0059ms |
| max | 0.02ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0062ms | +0.000062ms | +1.01% |
| p50 | 0.0082ms | 0.0065ms | +0.0017ms | +25.79% |
| p95 | 0.01ms | 0.02ms | -0.0041ms | -22.05% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -37.19% |
| mean | 0.0093ms | 0.0091ms | +0.00025ms | +2.77% |
| min | 0.0059ms | 0.0059ms | -0.000042ms | -0.71% |
| max | 0.02ms | 0.03ms | -0.01ms | -34.01% |
| total | 0.37ms | 0.36ms | +0.01ms | +2.77% |

### answer

# Perf Report — answer.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 8.82ms |
| p50 | 9.14ms |
| p95 | 9.22ms |
| p99 | 9.22ms |
| mean | 9.06ms |
| stdev | 0.21ms |
| min | 8.32ms |
| max | 9.22ms |
| total | 362.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.82ms | 8.59ms | +0.23ms | +2.64% |
| p50 | 9.14ms | 9.14ms | -0.0046ms | -0.05% |
| p95 | 9.22ms | 9.18ms | +0.04ms | +0.44% |
| p99 | 9.22ms | 9.38ms | -0.16ms | -1.70% |
| mean | 9.06ms | 9.03ms | +0.03ms | +0.33% |
| min | 8.32ms | 8.17ms | +0.15ms | +1.85% |
| max | 9.22ms | 9.49ms | -0.27ms | -2.84% |
| total | 362.37ms | 361.18ms | +1.18ms | +0.33% |

