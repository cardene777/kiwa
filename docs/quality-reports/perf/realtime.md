# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| supabasePresenceTrack | 0.00ms | 20ms | PASS | stable |
| ablyPublish | 0.00ms | 20ms | PASS | stable |
| pusherSubscribeChannel | 0.00ms | 20ms | PASS | stable |
| socketioEmit | 0.00ms | 20ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| supabasePresenceTrack | 0.02ms | 40ms | PASS |
| ablyPublish | 0.01ms | 40ms | PASS |
| pusherSubscribeChannel | 0.01ms | 40ms | PASS |
| socketioEmit | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| supabasePresenceTrack | 647728 B | 0 B | 102400 B | PASS |
| ablyPublish | 289328 B | 0 B | 102400 B | PASS |
| pusherSubscribeChannel | 155776 B | 0 B | 102400 B | PASS |
| socketioEmit | 309968 B | 0 B | 102400 B | PASS |

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
| max | 0.01ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.11% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +14.10% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +36.63% |
| mean | 0.00ms | 0.00ms | +0.00ms | +15.45% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.09% |
| max | 0.01ms | 0.01ms | +0.00ms | +7.31% |
| total | 0.34ms | 0.29ms | +0.05ms | +15.45% |

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
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +16.10% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -11.77% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.99% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.40% |
| max | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| total | 0.11ms | 0.10ms | +0.01ms | +5.99% |

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
| stdev | 0.03ms |
| min | 0.00ms |
| max | 0.38ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +3.93% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -15.89% |
| mean | 0.00ms | 0.00ms | +0.00ms | +645.72% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.38ms | 0.00ms | +0.38ms | +9163.64% |
| total | 0.44ms | 0.06ms | +0.39ms | +645.72% |

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
| max | 0.00ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.31% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +104.92% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.73% |
| min | 0.00ms | 0.00ms | -0.00ms | -14.09% |
| max | 0.00ms | 0.00ms | +0.00ms | +34.11% |
| total | 0.09ms | 0.09ms | +0.01ms | +6.73% |

