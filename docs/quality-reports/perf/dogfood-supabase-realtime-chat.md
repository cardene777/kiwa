# Perf Suite — dogfood-supabase-realtime-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinRoom | 3.16ms | 3.51ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendMessage | 3.42ms | 3.49ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPresence | 0.00054ms | 0.0032ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendTyping | 3.40ms | 3.46ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinRoom | 3.57ms | 100ms | PASS |
| sendMessage | 3.54ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |
| sendTyping | 3.47ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinRoom | 74304 B | 0 B | 102400 B | yes | PASS |
| sendMessage | 35264 B | 0 B | 102400 B | yes | PASS |
| getPresence | 31552 B | 0 B | 102400 B | yes | PASS |
| sendTyping | 39896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinRoom

# Perf Report — joinRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.16ms |
| p50 | 3.47ms |
| p95 | 3.51ms |
| p99 | 3.55ms |
| mean | 3.38ms |
| stdev | 0.28ms |
| min | 2.16ms |
| max | 3.57ms |
| total | 135.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.16ms | 3.47ms | -0.30ms | -8.78% |
| p50 | 3.47ms | 3.61ms | -0.15ms | -4.08% |
| p95 | 3.51ms | 4.81ms | -1.30ms | -27.06% |
| p99 | 3.55ms | 5.23ms | -1.69ms | -32.25% |
| mean | 3.38ms | 3.73ms | -0.35ms | -9.27% |
| min | 2.16ms | 2.48ms | -0.32ms | -12.91% |
| max | 3.57ms | 5.31ms | -1.74ms | -32.72% |
| total | 135.25ms | 149.06ms | -13.81ms | -9.27% |

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.42ms |
| p50 | 3.45ms |
| p95 | 3.49ms |
| p99 | 3.51ms |
| mean | 3.43ms |
| stdev | 0.08ms |
| min | 3.11ms |
| max | 3.52ms |
| total | 137.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.42ms | 3.42ms | +0.0015ms | +0.04% |
| p50 | 3.45ms | 3.44ms | +0.0068ms | +0.20% |
| p95 | 3.49ms | 3.46ms | +0.03ms | +0.81% |
| p99 | 3.51ms | 3.50ms | +0.02ms | +0.46% |
| mean | 3.43ms | 3.42ms | +0.01ms | +0.37% |
| min | 3.11ms | 3.09ms | +0.02ms | +0.58% |
| max | 3.52ms | 3.51ms | +0.01ms | +0.43% |
| total | 137.39ms | 136.88ms | +0.50ms | +0.37% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.0032ms |
| p99 | 0.01ms |
| mean | 0.0012ms |
| stdev | 0.0023ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | -0.0000010ms | -0.18% |
| p50 | 0.00054ms | 0.00058ms | -0.000042ms | -7.19% |
| p95 | 0.0032ms | 0.0028ms | +0.00040ms | +14.34% |
| p99 | 0.01ms | 0.0087ms | +0.0015ms | +17.76% |
| mean | 0.0012ms | 0.0011ms | +0.000038ms | +3.39% |
| min | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| max | 0.01ms | 0.01ms | +0.0025ms | +20.62% |
| total | 0.05ms | 0.05ms | +0.0015ms | +3.39% |

### sendTyping

# Perf Report — sendTyping.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.40ms |
| p50 | 3.42ms |
| p95 | 3.46ms |
| p99 | 3.48ms |
| mean | 3.38ms |
| stdev | 0.19ms |
| min | 2.28ms |
| max | 3.49ms |
| total | 135.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.40ms | 3.18ms | +0.21ms | +6.73% |
| p50 | 3.42ms | 3.45ms | -0.03ms | -0.96% |
| p95 | 3.46ms | 3.49ms | -0.03ms | -0.88% |
| p99 | 3.48ms | 3.51ms | -0.03ms | -0.85% |
| mean | 3.38ms | 3.38ms | +0.0037ms | +0.11% |
| min | 2.28ms | 2.31ms | -0.02ms | -1.00% |
| max | 3.49ms | 3.51ms | -0.02ms | -0.54% |
| total | 135.38ms | 135.23ms | +0.15ms | +0.11% |

