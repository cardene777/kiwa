# Perf Suite — dogfood-openai-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateToolSchemas | 32.96ms | 38.86ms | 50ms | 0.00040ms | PASS | stable — gate 無効 (regressionGate=false) |
| runToolLoop | 26.68ms | 32.61ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| runParallelToolCall | 12.65ms | 16.36ms | 100ms | 0.00040ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| validateToolSchemas | cpu | 0.09ms | 0.18ms | 32.96ms | 375.767 | 381.363 | 31.65ms | 32.13ms |
| runToolLoop | cpu | 0.08ms | 0.14ms | 26.68ms | 322.417 | 298.135 | 29.15ms | 26.96ms |
| runParallelToolCall | cpu | 0.09ms | 0.17ms | 12.65ms | 148.142 | 158.595 | 12.16ms | 13.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateToolSchemas | 35.67ms | 100ms | PASS |
| runToolLoop | 32.24ms | 200ms | PASS |
| runParallelToolCall | 15.47ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateToolSchemas | 4064 B | 0 B | 102400 B | yes | PASS |
| runToolLoop | -19928 B | 0 B | 102400 B | yes | PASS |
| runParallelToolCall | -2448 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateToolSchemas

# Perf Report — validateToolSchemas.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 32.96ms |
| p50 | 33.85ms |
| p95 | 38.86ms |
| p99 | 39.84ms |
| mean | 34.48ms |
| stdev | 2.14ms |
| min | 30.74ms |
| max | 40.06ms |
| total | 1379.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.960)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 31.65ms | 32.13ms | -0.47ms | -1.47% |
| p50 | 32.51ms | 33.23ms | -0.71ms | -2.15% |
| p95 | 37.33ms | 34.18ms | +3.15ms | +9.22% |
| p99 | 38.27ms | 34.68ms | +3.59ms | +10.35% |
| mean | 33.12ms | 33.08ms | +0.04ms | +0.11% |
| min | 29.53ms | 31.69ms | -2.17ms | -6.84% |
| max | 38.48ms | 34.91ms | +3.57ms | +10.24% |
| total | 1324.71ms | 1323.31ms | +1.40ms | +0.11% |

### runToolLoop

# Perf Report — runToolLoop.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 26.68ms |
| p50 | 27.63ms |
| p95 | 32.61ms |
| p99 | 35.10ms |
| mean | 28.32ms |
| stdev | 2.18ms |
| min | 24.60ms |
| max | 35.71ms |
| total | 1132.87ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.093)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 29.15ms | 26.96ms | +2.20ms | +8.14% |
| p50 | 30.19ms | 28.69ms | +1.51ms | +5.25% |
| p95 | 35.63ms | 33.32ms | +2.31ms | +6.92% |
| p99 | 38.36ms | 36.08ms | +2.28ms | +6.31% |
| mean | 30.95ms | 29.08ms | +1.87ms | +6.42% |
| min | 26.88ms | 25.54ms | +1.34ms | +5.24% |
| max | 39.02ms | 36.67ms | +2.35ms | +6.41% |
| total | 1237.88ms | 1163.18ms | +74.70ms | +6.42% |

### runParallelToolCall

# Perf Report — runParallelToolCall.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 12.65ms |
| p50 | 13.74ms |
| p95 | 16.36ms |
| p99 | 17.23ms |
| mean | 13.78ms |
| stdev | 1.08ms |
| min | 12.08ms |
| max | 17.71ms |
| total | 551.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.961)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 12.16ms | 13.01ms | -0.86ms | -6.59% |
| p50 | 13.20ms | 13.69ms | -0.49ms | -3.55% |
| p95 | 15.72ms | 13.76ms | +1.96ms | +14.26% |
| p99 | 16.55ms | 13.80ms | +2.75ms | +19.95% |
| mean | 13.24ms | 13.50ms | -0.26ms | -1.96% |
| min | 11.61ms | 12.38ms | -0.77ms | -6.20% |
| max | 17.01ms | 13.83ms | +3.18ms | +23.03% |
| total | 529.58ms | 540.16ms | -10.58ms | -1.96% |

