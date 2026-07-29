# Perf Suite — dogfood-supabase-realtime-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinRoom | 3.23ms | 3.95ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendMessage | 3.21ms | 5.19ms | 30ms | 0.00033ms | PASS | stable (p10 -6% (閾値未満)、 p95 +50% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| getPresence | 0.00063ms | 0.0036ms | 30ms | 0.00033ms | PASS | stable (p10 +15% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| sendTyping | 3.41ms | 5.26ms | 100ms | 0.00033ms | PASS | stable (p10 +7% (閾値未満)、 p95 +51% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinRoom | 4.32ms | 100ms | PASS |
| sendMessage | 4.06ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |
| sendTyping | 4.10ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinRoom | 74312 B | 0 B | 102400 B | yes | PASS |
| sendMessage | 35264 B | 0 B | 102400 B | yes | PASS |
| getPresence | 18448 B | 0 B | 102400 B | yes | PASS |
| sendTyping | 39896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinRoom

# Perf Report — joinRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.23ms |
| p50 | 3.85ms |
| p95 | 3.95ms |
| p99 | 4.01ms |
| mean | 3.69ms |
| stdev | 0.32ms |
| min | 2.60ms |
| max | 4.03ms |
| total | 147.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.23ms | 3.47ms | -0.24ms | -6.88% |
| p50 | 3.85ms | 3.61ms | +0.24ms | +6.60% |
| p95 | 3.95ms | 4.81ms | -0.86ms | -17.80% |
| p99 | 4.01ms | 5.23ms | -1.23ms | -23.41% |
| mean | 3.69ms | 3.73ms | -0.04ms | -1.00% |
| min | 2.60ms | 2.48ms | +0.12ms | +4.81% |
| max | 4.03ms | 5.31ms | -1.27ms | -24.02% |
| total | 147.56ms | 149.06ms | -1.50ms | -1.00% |

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.21ms |
| p50 | 3.99ms |
| p95 | 5.19ms |
| p99 | 6.33ms |
| mean | 4.08ms |
| stdev | 0.80ms |
| min | 2.69ms |
| max | 6.94ms |
| total | 163.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.21ms | 3.42ms | -0.21ms | -6.12% |
| p50 | 3.99ms | 3.44ms | +0.54ms | +15.71% |
| p95 | 5.19ms | 3.46ms | +1.73ms | +49.88% |
| p99 | 6.33ms | 3.50ms | +2.83ms | +81.03% |
| mean | 4.08ms | 3.42ms | +0.66ms | +19.33% |
| min | 2.69ms | 3.09ms | -0.40ms | -12.87% |
| max | 6.94ms | 3.51ms | +3.43ms | +97.78% |
| total | 163.35ms | 136.88ms | +26.46ms | +19.33% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00065ms |
| p95 | 0.0036ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0022ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00054ms | +0.000083ms | +15.31% |
| p50 | 0.00065ms | 0.00058ms | +0.000062ms | +10.53% |
| p95 | 0.0036ms | 0.0028ms | +0.00084ms | +30.37% |
| p99 | 0.01ms | 0.0087ms | +0.0016ms | +18.44% |
| mean | 0.0013ms | 0.0011ms | +0.00019ms | +16.50% |
| min | 0.00058ms | 0.00054ms | +0.000042ms | +7.76% |
| max | 0.01ms | 0.01ms | +0.0020ms | +16.15% |
| total | 0.05ms | 0.05ms | +0.0075ms | +16.50% |

### sendTyping

# Perf Report — sendTyping.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.41ms |
| p50 | 3.92ms |
| p95 | 5.26ms |
| p99 | 6.00ms |
| mean | 4.07ms |
| stdev | 0.69ms |
| min | 2.58ms |
| max | 6.46ms |
| total | 162.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.41ms | 3.18ms | +0.23ms | +7.15% |
| p50 | 3.92ms | 3.45ms | +0.47ms | +13.53% |
| p95 | 5.26ms | 3.49ms | +1.78ms | +50.90% |
| p99 | 6.00ms | 3.51ms | +2.49ms | +71.12% |
| mean | 4.07ms | 3.38ms | +0.69ms | +20.52% |
| min | 2.58ms | 2.31ms | +0.27ms | +11.89% |
| max | 6.46ms | 3.51ms | +2.95ms | +84.25% |
| total | 162.98ms | 135.23ms | +27.75ms | +20.52% |

