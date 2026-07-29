# Perf Suite — dogfood-supabase-realtime-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinRoom | 3.21ms | 3.73ms | 50ms | 0.00092ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendMessage | 3.41ms | 4.14ms | 30ms | 0.00092ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPresence | 0.00054ms | 0.0043ms | 30ms | 0.00092ms | PASS | stable (検知には +0.00092ms (baseline 比 +169%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| sendTyping | 3.29ms | 3.64ms | 100ms | 0.00092ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinRoom | 4.01ms | 100ms | PASS |
| sendMessage | 4.50ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |
| sendTyping | 3.76ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinRoom | 75648 B | 0 B | 102400 B | yes | PASS |
| sendMessage | 35360 B | 0 B | 102400 B | yes | PASS |
| getPresence | 36496 B | 0 B | 102400 B | yes | PASS |
| sendTyping | 39896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinRoom

# Perf Report — joinRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.21ms |
| p50 | 3.54ms |
| p95 | 3.73ms |
| p99 | 3.77ms |
| mean | 3.46ms |
| stdev | 0.33ms |
| min | 2.41ms |
| max | 3.77ms |
| total | 138.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.21ms | 3.47ms | -0.26ms | -7.39% |
| p50 | 3.54ms | 3.61ms | -0.07ms | -1.96% |
| p95 | 3.73ms | 4.81ms | -1.08ms | -22.51% |
| p99 | 3.77ms | 5.23ms | -1.47ms | -28.02% |
| mean | 3.46ms | 3.73ms | -0.27ms | -7.21% |
| min | 2.41ms | 2.48ms | -0.06ms | -2.58% |
| max | 3.77ms | 5.31ms | -1.53ms | -28.88% |
| total | 138.31ms | 149.06ms | -10.75ms | -7.21% |

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.41ms |
| p50 | 3.62ms |
| p95 | 4.14ms |
| p99 | 4.74ms |
| mean | 3.67ms |
| stdev | 0.42ms |
| min | 2.44ms |
| max | 5.03ms |
| total | 146.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.41ms | 3.42ms | -0.02ms | -0.44% |
| p50 | 3.62ms | 3.44ms | +0.18ms | +5.12% |
| p95 | 4.14ms | 3.46ms | +0.67ms | +19.47% |
| p99 | 4.74ms | 3.50ms | +1.24ms | +35.49% |
| mean | 3.67ms | 3.42ms | +0.25ms | +7.31% |
| min | 2.44ms | 3.09ms | -0.65ms | -21.19% |
| max | 5.03ms | 3.51ms | +1.52ms | +43.39% |
| total | 146.89ms | 136.88ms | +10.01ms | +7.31% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0043ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0025ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p50 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p95 | 0.0043ms | 0.0028ms | +0.0015ms | +53.34% |
| p99 | 0.01ms | 0.0087ms | +0.0033ms | +37.82% |
| mean | 0.0015ms | 0.0011ms | +0.00032ms | +27.98% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0016ms | +13.40% |
| total | 0.06ms | 0.05ms | +0.01ms | +27.98% |

### sendTyping

# Perf Report — sendTyping.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.29ms |
| p50 | 3.50ms |
| p95 | 3.64ms |
| p99 | 3.81ms |
| mean | 3.44ms |
| stdev | 0.27ms |
| min | 2.36ms |
| max | 3.89ms |
| total | 137.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.29ms | 3.18ms | +0.10ms | +3.24% |
| p50 | 3.50ms | 3.45ms | +0.05ms | +1.39% |
| p95 | 3.64ms | 3.49ms | +0.15ms | +4.27% |
| p99 | 3.81ms | 3.51ms | +0.30ms | +8.53% |
| mean | 3.44ms | 3.38ms | +0.06ms | +1.79% |
| min | 2.36ms | 2.31ms | +0.05ms | +2.24% |
| max | 3.89ms | 3.51ms | +0.39ms | +11.00% |
| total | 137.65ms | 135.23ms | +2.42ms | +1.79% |

