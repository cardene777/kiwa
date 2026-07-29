# Perf Suite — dogfood-supabase-realtime-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinRoom | 3.32ms | 3.59ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendMessage | 3.40ms | 3.54ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPresence | 0.00054ms | 0.0029ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendTyping | 3.43ms | 3.76ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinRoom | 3.67ms | 100ms | PASS |
| sendMessage | 3.54ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |
| sendTyping | 3.49ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinRoom | 74760 B | 0 B | 102400 B | yes | PASS |
| sendMessage | 35264 B | 0 B | 102400 B | yes | PASS |
| getPresence | 29840 B | 0 B | 102400 B | yes | PASS |
| sendTyping | 39800 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinRoom

# Perf Report — joinRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.32ms |
| p50 | 3.47ms |
| p95 | 3.59ms |
| p99 | 3.69ms |
| mean | 3.43ms |
| stdev | 0.22ms |
| min | 2.31ms |
| max | 3.75ms |
| total | 137.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.32ms | 3.47ms | -0.14ms | -4.14% |
| p50 | 3.47ms | 3.61ms | -0.14ms | -3.96% |
| p95 | 3.59ms | 4.81ms | -1.22ms | -25.45% |
| p99 | 3.69ms | 5.23ms | -1.54ms | -29.44% |
| mean | 3.43ms | 3.73ms | -0.29ms | -7.87% |
| min | 2.31ms | 2.48ms | -0.17ms | -6.79% |
| max | 3.75ms | 5.31ms | -1.55ms | -29.26% |
| total | 137.34ms | 149.06ms | -11.72ms | -7.87% |

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.40ms |
| p50 | 3.44ms |
| p95 | 3.54ms |
| p99 | 3.74ms |
| mean | 3.45ms |
| stdev | 0.10ms |
| min | 3.19ms |
| max | 3.86ms |
| total | 138.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.40ms | 3.42ms | -0.02ms | -0.52% |
| p50 | 3.44ms | 3.44ms | -0.0057ms | -0.17% |
| p95 | 3.54ms | 3.46ms | +0.08ms | +2.23% |
| p99 | 3.74ms | 3.50ms | +0.25ms | +7.10% |
| mean | 3.45ms | 3.42ms | +0.03ms | +0.84% |
| min | 3.19ms | 3.09ms | +0.10ms | +3.28% |
| max | 3.86ms | 3.51ms | +0.36ms | +10.15% |
| total | 138.04ms | 136.88ms | +1.16ms | +0.84% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0029ms |
| p99 | 0.0078ms |
| mean | 0.0011ms |
| stdev | 0.0017ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | -0.0000010ms | -0.18% |
| p50 | 0.00058ms | 0.00058ms | -0.0000010ms | -0.17% |
| p95 | 0.0029ms | 0.0028ms | +0.00012ms | +4.20% |
| p99 | 0.0078ms | 0.0087ms | -0.00086ms | -9.85% |
| mean | 0.0011ms | 0.0011ms | -0.000068ms | -5.99% |
| min | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| max | 0.01ms | 0.01ms | -0.0014ms | -11.34% |
| total | 0.04ms | 0.05ms | -0.0027ms | -5.99% |

### sendTyping

# Perf Report — sendTyping.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.43ms |
| p50 | 3.45ms |
| p95 | 3.76ms |
| p99 | 3.95ms |
| mean | 3.49ms |
| stdev | 0.15ms |
| min | 3.14ms |
| max | 3.97ms |
| total | 139.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.43ms | 3.18ms | +0.24ms | +7.62% |
| p50 | 3.45ms | 3.45ms | +0.0012ms | +0.04% |
| p95 | 3.76ms | 3.49ms | +0.27ms | +7.85% |
| p99 | 3.95ms | 3.51ms | +0.44ms | +12.55% |
| mean | 3.49ms | 3.38ms | +0.11ms | +3.22% |
| min | 3.14ms | 2.31ms | +0.83ms | +36.00% |
| max | 3.97ms | 3.51ms | +0.46ms | +13.15% |
| total | 139.59ms | 135.23ms | +4.36ms | +3.22% |

