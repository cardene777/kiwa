# Perf Suite — dogfood-vercel-ai-rag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| embed | 0.0040ms | 0.01ms | 20ms | 0.00042ms | PASS | stable (p10 +2% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retrieve | 0.0078ms | 0.02ms | 30ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| answer | 8.76ms | 10.22ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| embed | 0.06ms | 40ms | PASS |
| retrieve | 0.10ms | 60ms | PASS |
| answer | 10.49ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| embed | 13952 B | 0 B | 102400 B | yes | PASS |
| retrieve | 45272 B | 0 B | 102400 B | yes | PASS |
| answer | 47856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### embed

# Perf Report — embed.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0040ms |
| p50 | 0.0050ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0062ms |
| stdev | 0.0036ms |
| min | 0.0040ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0039ms | +0.000080ms | +2.04% |
| p50 | 0.0050ms | 0.0040ms | +0.0010ms | +25.53% |
| p95 | 0.01ms | 0.01ms | +0.0027ms | +22.23% |
| p99 | 0.02ms | 0.02ms | -0.0013ms | -6.74% |
| mean | 0.0062ms | 0.0057ms | +0.00055ms | +9.67% |
| min | 0.0040ms | 0.0039ms | +0.000083ms | +2.14% |
| max | 0.02ms | 0.02ms | -0.0011ms | -5.39% |
| total | 0.25ms | 0.23ms | +0.02ms | +9.67% |

### retrieve

# Perf Report — retrieve.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0078ms |
| p50 | 0.0089ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0041ms |
| min | 0.0075ms |
| max | 0.03ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0078ms | 0.0062ms | +0.0017ms | +27.03% |
| p50 | 0.0089ms | 0.0065ms | +0.0023ms | +35.35% |
| p95 | 0.02ms | 0.02ms | -0.0030ms | -16.48% |
| p99 | 0.03ms | 0.03ms | -0.0051ms | -16.76% |
| mean | 0.01ms | 0.0091ms | +0.0013ms | +14.52% |
| min | 0.0075ms | 0.0059ms | +0.0015ms | +26.04% |
| max | 0.03ms | 0.03ms | -0.0029ms | -8.89% |
| total | 0.42ms | 0.36ms | +0.05ms | +14.52% |

### answer

# Perf Report — answer.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 8.76ms |
| p50 | 10.07ms |
| p95 | 10.22ms |
| p99 | 10.23ms |
| mean | 9.63ms |
| stdev | 0.69ms |
| min | 7.52ms |
| max | 10.24ms |
| total | 385.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.76ms | 8.59ms | +0.17ms | +1.95% |
| p50 | 10.07ms | 9.14ms | +0.92ms | +10.11% |
| p95 | 10.22ms | 9.18ms | +1.04ms | +11.31% |
| p99 | 10.23ms | 9.38ms | +0.85ms | +9.07% |
| mean | 9.63ms | 9.03ms | +0.61ms | +6.70% |
| min | 7.52ms | 8.17ms | -0.65ms | -7.93% |
| max | 10.24ms | 9.49ms | +0.75ms | +7.85% |
| total | 385.39ms | 361.18ms | +24.21ms | +6.70% |

