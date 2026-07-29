# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| supabasePresenceTrack | 0.00ms | 20ms | PASS | stable (検知には +0.5ms (baseline 比 +11211%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| ablyPublish | 0.00ms | 20ms | PASS | stable (検知には +0.5ms (baseline 比 +92064%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| pusherSubscribeChannel | 0.00ms | 20ms | PASS | stable (検知には +0.5ms (baseline 比 +200000%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| socketioEmit | 0.00ms | 20ms | PASS | stable (検知には +0.5ms (baseline 比 +33241%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| supabasePresenceTrack | 0.03ms | 40ms | PASS |
| ablyPublish | 0.01ms | 40ms | PASS |
| pusherSubscribeChannel | 0.00ms | 40ms | PASS |
| socketioEmit | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| supabasePresenceTrack | -24248 B | 0 B | 102400 B | yes | PASS |
| ablyPublish | 12432 B | 0 B | 102400 B | yes | PASS |
| pusherSubscribeChannel | 1320 B | 0 B | 102400 B | yes | PASS |
| socketioEmit | 45840 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### supabasePresenceTrack

# Perf Report — supabasePresenceTrack.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +30.99% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -9.71% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +4.53% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.44% |
| min | 0.00ms | 0.00ms | +0.00ms | +11.54% |
| max | 0.02ms | 0.02ms | +0.00ms | +10.53% |
| total | 0.42ms | 0.37ms | +0.05ms | +12.44% |

### ablyPublish

# Perf Report — ablyPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.02ms |
| stdev | 0.30ms |
| min | 0.00ms |
| max | 4.28ms |
| total | 4.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +70.37% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +307.61% |
| mean | 0.02ms | 0.00ms | +0.02ms | +5493.18% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.43% |
| max | 4.28ms | 0.00ms | +4.27ms | +189940.76% |
| total | 4.37ms | 0.08ms | +4.30ms | +5493.18% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +24.55% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +16.42% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +77.50% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.61% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.01ms | 0.01ms | -0.01ms | -47.14% |
| total | 0.05ms | 0.05ms | -0.00ms | -1.61% |

### socketioEmit

# Perf Report — socketioEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.28% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -69.55% |
| p99 | 0.00ms | 0.01ms | -0.01ms | -86.24% |
| mean | 0.00ms | 0.00ms | -0.00ms | -47.49% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.43% |
| max | 0.01ms | 0.05ms | -0.05ms | -84.71% |
| total | 0.09ms | 0.17ms | -0.08ms | -47.49% |

