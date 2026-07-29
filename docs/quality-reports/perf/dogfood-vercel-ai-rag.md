# Perf Suite — dogfood-vercel-ai-rag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| embed | 0.0041ms | 0.01ms | 20ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| retrieve | 0.0071ms | 0.02ms | 30ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| answer | 8.49ms | 9.32ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| embed | 0.06ms | 40ms | PASS |
| retrieve | 0.07ms | 60ms | PASS |
| answer | 13.00ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| embed | 9824 B | 0 B | 102400 B | yes | PASS |
| retrieve | 44992 B | 0 B | 102400 B | yes | PASS |
| answer | 47856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### embed

# Perf Report — embed.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0041ms |
| p50 | 0.0043ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0061ms |
| stdev | 0.0039ms |
| min | 0.0041ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0041ms | 0.0039ms | +0.00020ms | +5.23% |
| p50 | 0.0043ms | 0.0040ms | +0.00033ms | +8.34% |
| p95 | 0.01ms | 0.01ms | -0.000038ms | -0.32% |
| p99 | 0.02ms | 0.02ms | +0.0012ms | +5.98% |
| mean | 0.0061ms | 0.0057ms | +0.00045ms | +7.98% |
| min | 0.0041ms | 0.0039ms | +0.00021ms | +5.37% |
| max | 0.02ms | 0.02ms | +0.00038ms | +1.80% |
| total | 0.24ms | 0.23ms | +0.02ms | +7.98% |

### retrieve

# Perf Report — retrieve.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0071ms |
| p50 | 0.0082ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.010ms |
| stdev | 0.0042ms |
| min | 0.0070ms |
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0062ms | +0.00096ms | +15.61% |
| p50 | 0.0082ms | 0.0065ms | +0.0017ms | +25.47% |
| p95 | 0.02ms | 0.02ms | -0.0023ms | -12.25% |
| p99 | 0.02ms | 0.03ms | -0.0066ms | -21.64% |
| mean | 0.010ms | 0.0091ms | +0.00092ms | +10.10% |
| min | 0.0070ms | 0.0059ms | +0.0010ms | +17.59% |
| max | 0.03ms | 0.03ms | -0.0068ms | -20.56% |
| total | 0.40ms | 0.36ms | +0.04ms | +10.10% |

### answer

# Perf Report — answer.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 8.49ms |
| p50 | 9.17ms |
| p95 | 9.32ms |
| p99 | 9.92ms |
| mean | 9.00ms |
| stdev | 0.39ms |
| min | 8.24ms |
| max | 10.30ms |
| total | 359.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.49ms | 8.59ms | -0.11ms | -1.24% |
| p50 | 9.17ms | 9.14ms | +0.02ms | +0.26% |
| p95 | 9.32ms | 9.18ms | +0.14ms | +1.50% |
| p99 | 9.92ms | 9.38ms | +0.54ms | +5.75% |
| mean | 9.00ms | 9.03ms | -0.03ms | -0.37% |
| min | 8.24ms | 8.17ms | +0.07ms | +0.83% |
| max | 10.30ms | 9.49ms | +0.80ms | +8.47% |
| total | 359.85ms | 361.18ms | -1.33ms | -0.37% |

