# Perf Suite — dogfood-supabase-realtime-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| joinRoom | 3.50ms | 50ms | PASS | n/a (baseline seeded) |
| sendMessage | 3.49ms | 30ms | PASS | n/a (baseline seeded) |
| getPresence | 0.01ms | 30ms | PASS | n/a (baseline seeded) |
| sendTyping | 3.45ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinRoom | 3.62ms | 100ms | PASS |
| sendMessage | 3.54ms | 60ms | PASS |
| getPresence | 0.02ms | 60ms | PASS |
| sendTyping | 3.47ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| joinRoom | -5007800 B | -2217 B | 102400 B | PASS |
| sendMessage | 921928 B | 0 B | 102400 B | PASS |
| getPresence | 997688 B | 0 B | 102400 B | PASS |
| sendTyping | 1029872 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### joinRoom

# Perf Report — joinRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 3.43ms |
| p95 | 3.50ms |
| p99 | 3.52ms |
| mean | 3.44ms |
| stdev | 0.04ms |
| min | 3.25ms |
| max | 3.52ms |
| total | 137.55ms |

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 3.43ms |
| p95 | 3.49ms |
| p99 | 3.68ms |
| mean | 3.39ms |
| stdev | 0.25ms |
| min | 2.30ms |
| max | 3.68ms |
| total | 135.70ms |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.08ms |

### sendTyping

# Perf Report — sendTyping.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 3.42ms |
| p95 | 3.45ms |
| p99 | 3.50ms |
| mean | 3.41ms |
| stdev | 0.08ms |
| min | 2.98ms |
| max | 3.50ms |
| total | 136.33ms |

