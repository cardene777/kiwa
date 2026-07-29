# Perf Suite — dogfood-supabase-realtime-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinRoom | 3.42ms | 4.00ms | 50ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendMessage | 3.25ms | 3.84ms | 30ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPresence | 0.00050ms | 0.0047ms | 30ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendTyping | 3.41ms | 3.82ms | 100ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| joinRoom | cpu | 0.08ms | 3.42ms | 41.480 | 38.162 | 3.72ms | 3.42ms |
| sendMessage | cpu | 0.08ms | 3.25ms | 39.778 | 35.431 | 3.57ms | 3.18ms |
| getPresence | cpu | 0.08ms | 0.00050ms | 0.006 | 0.006 | 0.00054ms | 0.00054ms |
| sendTyping | cpu | 0.08ms | 3.41ms | 41.784 | 35.470 | 3.76ms | 3.19ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinRoom | 3.92ms | 100ms | PASS |
| sendMessage | 3.90ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |
| sendTyping | 4.17ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinRoom | 74184 B | 0 B | 102400 B | yes | PASS |
| sendMessage | 35376 B | 0 B | 102400 B | yes | PASS |
| getPresence | 29640 B | 0 B | 102400 B | yes | PASS |
| sendTyping | 39832 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinRoom

# Perf Report — joinRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.42ms |
| p50 | 3.84ms |
| p95 | 4.00ms |
| p99 | 4.53ms |
| mean | 3.79ms |
| stdev | 0.31ms |
| min | 2.61ms |
| max | 4.78ms |
| total | 151.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.42ms | 3.42ms | +0.0041ms | +0.12% |
| p50 | 3.84ms | 3.68ms | +0.16ms | +4.21% |
| p95 | 4.00ms | 4.86ms | -0.86ms | -17.70% |
| p99 | 4.53ms | 5.60ms | -1.07ms | -19.13% |
| mean | 3.79ms | 3.85ms | -0.06ms | -1.48% |
| min | 2.61ms | 3.16ms | -0.55ms | -17.49% |
| max | 4.78ms | 6.02ms | -1.24ms | -20.57% |
| total | 151.67ms | 153.95ms | -2.28ms | -1.48% |

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.25ms |
| p50 | 3.79ms |
| p95 | 3.84ms |
| p99 | 5.15ms |
| mean | 3.73ms |
| stdev | 0.49ms |
| min | 2.36ms |
| max | 5.99ms |
| total | 149.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.25ms | 3.18ms | +0.07ms | +2.18% |
| p50 | 3.79ms | 3.46ms | +0.32ms | +9.26% |
| p95 | 3.84ms | 3.65ms | +0.19ms | +5.12% |
| p99 | 5.15ms | 4.01ms | +1.14ms | +28.53% |
| mean | 3.73ms | 3.42ms | +0.31ms | +9.12% |
| min | 2.36ms | 2.48ms | -0.12ms | -4.85% |
| max | 5.99ms | 4.20ms | +1.79ms | +42.60% |
| total | 149.08ms | 136.62ms | +12.46ms | +9.12% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00058ms |
| p95 | 0.0047ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0026ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| p50 | 0.00058ms | 0.00069ms | -0.00010ms | -15.20% |
| p95 | 0.0047ms | 0.0091ms | -0.0043ms | -47.81% |
| p99 | 0.01ms | 0.02ms | -0.0050ms | -28.82% |
| mean | 0.0014ms | 0.0022ms | -0.00076ms | -34.57% |
| min | 0.00046ms | 0.00054ms | -0.000083ms | -15.34% |
| max | 0.01ms | 0.02ms | -0.0048ms | -26.68% |
| total | 0.06ms | 0.09ms | -0.03ms | -34.57% |

### sendTyping

# Perf Report — sendTyping.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.41ms |
| p50 | 3.79ms |
| p95 | 3.82ms |
| p99 | 3.83ms |
| mean | 3.68ms |
| stdev | 0.26ms |
| min | 2.55ms |
| max | 3.84ms |
| total | 147.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.41ms | 3.19ms | +0.22ms | +7.05% |
| p50 | 3.79ms | 3.53ms | +0.26ms | +7.40% |
| p95 | 3.82ms | 4.00ms | -0.18ms | -4.61% |
| p99 | 3.83ms | 4.96ms | -1.13ms | -22.71% |
| mean | 3.68ms | 3.53ms | +0.16ms | +4.51% |
| min | 2.55ms | 2.36ms | +0.18ms | +7.72% |
| max | 3.84ms | 5.39ms | -1.55ms | -28.74% |
| total | 147.40ms | 141.04ms | +6.36ms | +4.51% |

