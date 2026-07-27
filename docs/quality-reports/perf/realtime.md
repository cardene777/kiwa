# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| supabasePresenceTrack | 0.00ms | 20ms | PASS | stable |
| ablyPublish | 0.00ms | 20ms | PASS | improved |
| pusherSubscribeChannel | 0.00ms | 20ms | PASS | stable |
| socketioEmit | 0.00ms | 20ms | PASS | improved |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| supabasePresenceTrack | 0.02ms | 40ms | PASS |
| ablyPublish | 0.01ms | 40ms | PASS |
| pusherSubscribeChannel | 0.00ms | 40ms | PASS |
| socketioEmit | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| supabasePresenceTrack | 656584 B | 0 B | 102400 B | PASS |
| ablyPublish | 380448 B | 0 B | 102400 B | PASS |
| pusherSubscribeChannel | 155624 B | 0 B | 102400 B | PASS |
| socketioEmit | 675576 B | 0 B | 102400 B | PASS |

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
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +14.76% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +26.84% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +158.01% |
| mean | 0.00ms | 0.00ms | +0.00ms | +30.86% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.88% |
| max | 0.02ms | 0.01ms | +0.01ms | +52.38% |
| total | 0.38ms | 0.29ms | +0.09ms | +30.86% |

### ablyPublish

# Perf Report — ablyPublish.serial

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
| max | 0.00ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.30% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -61.14% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -54.10% |
| mean | 0.00ms | 0.00ms | -0.00ms | -22.24% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.40% |
| max | 0.00ms | 0.01ms | -0.00ms | -6.66% |
| total | 0.08ms | 0.10ms | -0.02ms | -22.24% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -76.01% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -48.52% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.92% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.01ms | 0.00ms | +0.01ms | +137.38% |
| total | 0.05ms | 0.06ms | -0.01ms | -12.92% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -51.82% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -30.36% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.04% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.00ms | +128.23% |
| total | 0.08ms | 0.09ms | -0.01ms | -6.04% |

