# Perf Suite — dogfood-supabase-realtime-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinRoom | 3.26ms | 3.61ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendMessage | 3.37ms | 3.65ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPresence | 0.00054ms | 0.0038ms | 30ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +36% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| sendTyping | 3.32ms | 3.70ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinRoom | 3.84ms | 100ms | PASS |
| sendMessage | 3.56ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |
| sendTyping | 5.03ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinRoom | 74320 B | 0 B | 102400 B | yes | PASS |
| sendMessage | 35744 B | 0 B | 102400 B | yes | PASS |
| getPresence | 27744 B | 0 B | 102400 B | yes | PASS |
| sendTyping | 39800 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinRoom

# Perf Report — joinRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.26ms |
| p50 | 3.49ms |
| p95 | 3.61ms |
| p99 | 3.64ms |
| mean | 3.44ms |
| stdev | 0.21ms |
| min | 2.32ms |
| max | 3.64ms |
| total | 137.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.26ms | 3.47ms | -0.21ms | -5.98% |
| p50 | 3.49ms | 3.61ms | -0.12ms | -3.46% |
| p95 | 3.61ms | 4.81ms | -1.20ms | -25.00% |
| p99 | 3.64ms | 5.23ms | -1.59ms | -30.37% |
| mean | 3.44ms | 3.73ms | -0.28ms | -7.59% |
| min | 2.32ms | 2.48ms | -0.16ms | -6.37% |
| max | 3.64ms | 5.31ms | -1.66ms | -31.30% |
| total | 137.74ms | 149.06ms | -11.32ms | -7.59% |

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.37ms |
| p50 | 3.47ms |
| p95 | 3.65ms |
| p99 | 3.66ms |
| mean | 3.46ms |
| stdev | 0.10ms |
| min | 3.14ms |
| max | 3.67ms |
| total | 138.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.37ms | 3.42ms | -0.05ms | -1.55% |
| p50 | 3.47ms | 3.44ms | +0.03ms | +0.78% |
| p95 | 3.65ms | 3.46ms | +0.18ms | +5.29% |
| p99 | 3.66ms | 3.50ms | +0.17ms | +4.77% |
| mean | 3.46ms | 3.42ms | +0.04ms | +1.20% |
| min | 3.14ms | 3.09ms | +0.05ms | +1.64% |
| max | 3.67ms | 3.51ms | +0.16ms | +4.63% |
| total | 138.52ms | 136.88ms | +1.64ms | +1.20% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0038ms |
| p99 | 0.02ms |
| mean | 0.0015ms |
| stdev | 0.0041ms |
| min | 0.00050ms |
| max | 0.03ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | -0.0000010ms | -0.18% |
| p50 | 0.00058ms | 0.00058ms | -0.0000010ms | -0.17% |
| p95 | 0.0038ms | 0.0028ms | +0.0010ms | +36.23% |
| p99 | 0.02ms | 0.0087ms | +0.0091ms | +104.61% |
| mean | 0.0015ms | 0.0011ms | +0.00038ms | +33.56% |
| min | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| max | 0.03ms | 0.01ms | +0.01ms | +116.84% |
| total | 0.06ms | 0.05ms | +0.02ms | +33.56% |

### sendTyping

# Perf Report — sendTyping.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.32ms |
| p50 | 3.47ms |
| p95 | 3.70ms |
| p99 | 3.77ms |
| mean | 3.45ms |
| stdev | 0.20ms |
| min | 2.51ms |
| max | 3.81ms |
| total | 137.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.32ms | 3.18ms | +0.14ms | +4.34% |
| p50 | 3.47ms | 3.45ms | +0.01ms | +0.43% |
| p95 | 3.70ms | 3.49ms | +0.21ms | +5.95% |
| p99 | 3.77ms | 3.51ms | +0.27ms | +7.58% |
| mean | 3.45ms | 3.38ms | +0.07ms | +2.01% |
| min | 2.51ms | 2.31ms | +0.21ms | +9.03% |
| max | 3.81ms | 3.51ms | +0.31ms | +8.77% |
| total | 137.95ms | 135.23ms | +2.72ms | +2.01% |

