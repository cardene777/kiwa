# Perf Suite — dogfood-supabase-realtime-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinRoom | 3.42ms | 3.53ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendMessage | 3.38ms | 3.69ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPresence | 0.00054ms | 0.0038ms | 30ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| sendTyping | 3.26ms | 3.66ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinRoom | 3.61ms | 100ms | PASS |
| sendMessage | 3.56ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |
| sendTyping | 3.58ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinRoom | 73936 B | 0 B | 102400 B | yes | PASS |
| sendMessage | 36496 B | 0 B | 102400 B | yes | PASS |
| getPresence | 32304 B | 0 B | 102400 B | yes | PASS |
| sendTyping | 39896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinRoom

# Perf Report — joinRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.42ms |
| p50 | 3.46ms |
| p95 | 3.53ms |
| p99 | 3.61ms |
| mean | 3.46ms |
| stdev | 0.08ms |
| min | 3.16ms |
| max | 3.65ms |
| total | 138.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.42ms | 3.47ms | -0.05ms | -1.38% |
| p50 | 3.46ms | 3.61ms | -0.15ms | -4.19% |
| p95 | 3.53ms | 4.81ms | -1.28ms | -26.71% |
| p99 | 3.61ms | 5.23ms | -1.62ms | -30.99% |
| mean | 3.46ms | 3.73ms | -0.27ms | -7.27% |
| min | 3.16ms | 2.48ms | +0.69ms | +27.70% |
| max | 3.65ms | 5.31ms | -1.66ms | -31.24% |
| total | 138.23ms | 149.06ms | -10.83ms | -7.27% |

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.38ms |
| p50 | 3.47ms |
| p95 | 3.69ms |
| p99 | 3.82ms |
| mean | 3.46ms |
| stdev | 0.22ms |
| min | 2.36ms |
| max | 3.87ms |
| total | 138.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.38ms | 3.42ms | -0.05ms | -1.35% |
| p50 | 3.47ms | 3.44ms | +0.03ms | +0.75% |
| p95 | 3.69ms | 3.46ms | +0.22ms | +6.48% |
| p99 | 3.82ms | 3.50ms | +0.32ms | +9.15% |
| mean | 3.46ms | 3.42ms | +0.04ms | +1.05% |
| min | 2.36ms | 3.09ms | -0.73ms | -23.76% |
| max | 3.87ms | 3.51ms | +0.36ms | +10.35% |
| total | 138.32ms | 136.88ms | +1.43ms | +1.05% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0038ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0025ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | -0.0000010ms | -0.18% |
| p50 | 0.00058ms | 0.00058ms | -0.0000010ms | -0.17% |
| p95 | 0.0038ms | 0.0028ms | +0.0010ms | +37.06% |
| p99 | 0.01ms | 0.0087ms | +0.0032ms | +36.66% |
| mean | 0.0014ms | 0.0011ms | +0.00026ms | +22.64% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0012ms | +9.62% |
| total | 0.06ms | 0.05ms | +0.01ms | +22.64% |

### sendTyping

# Perf Report — sendTyping.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.26ms |
| p50 | 3.45ms |
| p95 | 3.66ms |
| p99 | 3.70ms |
| mean | 3.42ms |
| stdev | 0.24ms |
| min | 2.36ms |
| max | 3.73ms |
| total | 136.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.26ms | 3.18ms | +0.08ms | +2.39% |
| p50 | 3.45ms | 3.45ms | +0.00073ms | +0.02% |
| p95 | 3.66ms | 3.49ms | +0.17ms | +4.87% |
| p99 | 3.70ms | 3.51ms | +0.20ms | +5.65% |
| mean | 3.42ms | 3.38ms | +0.04ms | +1.12% |
| min | 2.36ms | 2.31ms | +0.06ms | +2.51% |
| max | 3.73ms | 3.51ms | +0.22ms | +6.39% |
| total | 136.74ms | 135.23ms | +1.51ms | +1.12% |

