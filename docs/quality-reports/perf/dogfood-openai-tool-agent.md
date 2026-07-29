# Perf Suite — dogfood-openai-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateToolSchemas | 31.87ms | 35.80ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runToolLoop | 26.20ms | 28.10ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runParallelToolCall | 13.01ms | 13.79ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateToolSchemas | 34.65ms | 100ms | PASS |
| runToolLoop | 29.65ms | 200ms | PASS |
| runParallelToolCall | 14.03ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateToolSchemas | 4408 B | 0 B | 102400 B | yes | PASS |
| runToolLoop | -20360 B | 0 B | 102400 B | yes | PASS |
| runParallelToolCall | -1136 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateToolSchemas

# Perf Report — validateToolSchemas.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 31.87ms |
| p50 | 32.98ms |
| p95 | 35.80ms |
| p99 | 37.65ms |
| mean | 33.25ms |
| stdev | 1.46ms |
| min | 30.54ms |
| max | 38.33ms |
| total | 1330.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 31.87ms | 31.88ms | -0.0073ms | -0.02% |
| p50 | 32.98ms | 33.06ms | -0.08ms | -0.23% |
| p95 | 35.80ms | 34.54ms | +1.25ms | +3.63% |
| p99 | 37.65ms | 35.34ms | +2.31ms | +6.54% |
| mean | 33.25ms | 33.12ms | +0.13ms | +0.38% |
| min | 30.54ms | 31.26ms | -0.72ms | -2.29% |
| max | 38.33ms | 35.36ms | +2.97ms | +8.39% |
| total | 1330.03ms | 1324.98ms | +5.05ms | +0.38% |

### runToolLoop

# Perf Report — runToolLoop.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 26.20ms |
| p50 | 27.42ms |
| p95 | 28.10ms |
| p99 | 28.35ms |
| mean | 27.23ms |
| stdev | 0.61ms |
| min | 25.84ms |
| max | 28.36ms |
| total | 1089.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.20ms | 26.32ms | -0.12ms | -0.44% |
| p50 | 27.42ms | 27.51ms | -0.09ms | -0.33% |
| p95 | 28.10ms | 29.28ms | -1.18ms | -4.02% |
| p99 | 28.35ms | 29.40ms | -1.05ms | -3.57% |
| mean | 27.23ms | 27.45ms | -0.22ms | -0.81% |
| min | 25.84ms | 25.36ms | +0.48ms | +1.88% |
| max | 28.36ms | 29.41ms | -1.06ms | -3.59% |
| total | 1089.21ms | 1098.10ms | -8.89ms | -0.81% |

### runParallelToolCall

# Perf Report — runParallelToolCall.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 13.01ms |
| p50 | 13.71ms |
| p95 | 13.79ms |
| p99 | 13.85ms |
| mean | 13.51ms |
| stdev | 0.33ms |
| min | 12.65ms |
| max | 13.88ms |
| total | 540.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.01ms | 12.98ms | +0.04ms | +0.27% |
| p50 | 13.71ms | 13.69ms | +0.02ms | +0.13% |
| p95 | 13.79ms | 13.77ms | +0.02ms | +0.15% |
| p99 | 13.85ms | 15.22ms | -1.37ms | -9.03% |
| mean | 13.51ms | 13.59ms | -0.07ms | -0.54% |
| min | 12.65ms | 12.22ms | +0.43ms | +3.54% |
| max | 13.88ms | 16.09ms | -2.21ms | -13.74% |
| total | 540.53ms | 543.46ms | -2.93ms | -0.54% |

