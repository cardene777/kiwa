# Perf Suite — dogfood-vercel-ai-rag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| embed | 0.0096ms | 0.03ms | 20ms | 0.00092ms | PASS | regressed — gate 無効 (regressionGate=false) |
| retrieve | 0.0047ms | 0.02ms | 30ms | 0.00092ms | PASS | improved — gate 無効 (regressionGate=false) |
| answer | 8.43ms | 9.28ms | 100ms | 0.00092ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| embed | 0.20ms | 40ms | PASS |
| retrieve | 0.07ms | 60ms | PASS |
| answer | 9.43ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| embed | 13520 B | 0 B | 102400 B | yes | PASS |
| retrieve | 47752 B | 0 B | 102400 B | yes | PASS |
| answer | 48240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### embed

# Perf Report — embed.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0096ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0094ms |
| max | 0.14ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.0039ms | +0.0057ms | +144.74% |
| p50 | 0.01ms | 0.0040ms | +0.0076ms | +190.63% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +166.03% |
| p99 | 0.10ms | 0.02ms | +0.08ms | +414.28% |
| mean | 0.02ms | 0.0057ms | +0.01ms | +201.25% |
| min | 0.0094ms | 0.0039ms | +0.0055ms | +142.99% |
| max | 0.14ms | 0.02ms | +0.12ms | +588.62% |
| total | 0.68ms | 0.23ms | +0.46ms | +201.25% |

### retrieve

# Perf Report — retrieve.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0047ms |
| p50 | 0.0057ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0075ms |
| stdev | 0.0045ms |
| min | 0.0047ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0062ms | -0.0014ms | -22.92% |
| p50 | 0.0057ms | 0.0065ms | -0.00081ms | -12.42% |
| p95 | 0.02ms | 0.02ms | -0.0011ms | -5.80% |
| p99 | 0.02ms | 0.03ms | -0.0084ms | -27.37% |
| mean | 0.0075ms | 0.0091ms | -0.0016ms | -17.59% |
| min | 0.0047ms | 0.0059ms | -0.0012ms | -20.43% |
| max | 0.03ms | 0.03ms | -0.0076ms | -23.22% |
| total | 0.30ms | 0.36ms | -0.06ms | -17.59% |

### answer

# Perf Report — answer.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 8.43ms |
| p50 | 9.19ms |
| p95 | 9.28ms |
| p99 | 9.42ms |
| mean | 9.06ms |
| stdev | 0.31ms |
| min | 8.29ms |
| max | 9.47ms |
| total | 362.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.43ms | 8.59ms | -0.16ms | -1.88% |
| p50 | 9.19ms | 9.14ms | +0.04ms | +0.48% |
| p95 | 9.28ms | 9.18ms | +0.10ms | +1.11% |
| p99 | 9.42ms | 9.38ms | +0.04ms | +0.45% |
| mean | 9.06ms | 9.03ms | +0.03ms | +0.31% |
| min | 8.29ms | 8.17ms | +0.12ms | +1.52% |
| max | 9.47ms | 9.49ms | -0.03ms | -0.29% |
| total | 362.28ms | 361.18ms | +1.10ms | +0.31% |

