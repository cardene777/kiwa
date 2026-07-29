# Perf Suite — dogfood-supabase-realtime-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinRoom | 3.23ms | 3.51ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendMessage | 3.39ms | 6.67ms | 30ms | 0.00033ms | PASS | stable (p10 -1% (閾値未満)、 p95 +92% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| getPresence | 0.00054ms | 0.0037ms | 30ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| sendTyping | 3.18ms | 3.50ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinRoom | 3.71ms | 100ms | PASS |
| sendMessage | 4.56ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |
| sendTyping | 3.51ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinRoom | 78352 B | 0 B | 102400 B | yes | PASS |
| sendMessage | 38800 B | 0 B | 102400 B | yes | PASS |
| getPresence | 27128 B | 0 B | 102400 B | yes | PASS |
| sendTyping | 39896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinRoom

# Perf Report — joinRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.23ms |
| p50 | 3.46ms |
| p95 | 3.51ms |
| p99 | 3.56ms |
| mean | 3.41ms |
| stdev | 0.19ms |
| min | 2.39ms |
| max | 3.58ms |
| total | 136.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.23ms | 3.47ms | -0.24ms | -6.87% |
| p50 | 3.46ms | 3.61ms | -0.16ms | -4.31% |
| p95 | 3.51ms | 4.81ms | -1.30ms | -27.09% |
| p99 | 3.56ms | 5.23ms | -1.68ms | -32.06% |
| mean | 3.41ms | 3.73ms | -0.32ms | -8.50% |
| min | 2.39ms | 2.48ms | -0.08ms | -3.32% |
| max | 3.58ms | 5.31ms | -1.72ms | -32.49% |
| total | 136.39ms | 149.06ms | -12.67ms | -8.50% |

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.39ms |
| p50 | 3.46ms |
| p95 | 6.67ms |
| p99 | 8.54ms |
| mean | 3.83ms |
| stdev | 1.25ms |
| min | 2.28ms |
| max | 8.84ms |
| total | 153.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.39ms | 3.42ms | -0.03ms | -0.92% |
| p50 | 3.46ms | 3.44ms | +0.02ms | +0.57% |
| p95 | 6.67ms | 3.46ms | +3.20ms | +92.50% |
| p99 | 8.54ms | 3.50ms | +5.05ms | +144.44% |
| mean | 3.83ms | 3.42ms | +0.41ms | +12.05% |
| min | 2.28ms | 3.09ms | -0.81ms | -26.11% |
| max | 8.84ms | 3.51ms | +5.34ms | +152.15% |
| total | 153.38ms | 136.88ms | +16.50ms | +12.05% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0037ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0025ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | -1.0e-7ms | -0.02% |
| p50 | 0.00058ms | 0.00058ms | -0.0000010ms | -0.17% |
| p95 | 0.0037ms | 0.0028ms | +0.00092ms | +33.24% |
| p99 | 0.01ms | 0.0087ms | +0.0025ms | +29.27% |
| mean | 0.0013ms | 0.0011ms | +0.00012ms | +11.01% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0035ms | +28.87% |
| total | 0.05ms | 0.05ms | +0.0050ms | +11.01% |

### sendTyping

# Perf Report — sendTyping.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.18ms |
| p50 | 3.44ms |
| p95 | 3.50ms |
| p99 | 3.52ms |
| mean | 3.39ms |
| stdev | 0.20ms |
| min | 2.29ms |
| max | 3.52ms |
| total | 135.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.18ms | 3.18ms | +0.00012ms | +0.00% |
| p50 | 3.44ms | 3.45ms | -0.0066ms | -0.19% |
| p95 | 3.50ms | 3.49ms | +0.01ms | +0.36% |
| p99 | 3.52ms | 3.51ms | +0.0085ms | +0.24% |
| mean | 3.39ms | 3.38ms | +0.01ms | +0.33% |
| min | 2.29ms | 2.31ms | -0.01ms | -0.48% |
| max | 3.52ms | 3.51ms | +0.01ms | +0.30% |
| total | 135.68ms | 135.23ms | +0.45ms | +0.33% |

