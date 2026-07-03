# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1, 200 iter)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| supabasePresenceTrack | 0.00ms | 20ms | PASS | stable |
| ablyPublish | 0.00ms | 20ms | PASS | stable |
| pusherSubscribeChannel | 0.00ms | 20ms | PASS | stable |
| socketioEmit | 0.00ms | 20ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each = 500 samples)

| op | p95 | cap | gate |
|---|---|---|---|
| supabasePresenceTrack | 0.02ms | 40ms | PASS |
| ablyPublish | 0.01ms | 40ms | PASS |
| pusherSubscribeChannel | 0.01ms | 40ms | PASS |
| socketioEmit | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap axis is informational)

| op | heapUsed Δ | arrayBuffers Δ | verdict (arrayBuffers) |
|---|---|---|---|
| supabasePresenceTrack | 570496 B | 0 B | PASS |
| ablyPublish | 303624 B | 0 B | PASS |
| pusherSubscribeChannel | 78872 B | 0 B | PASS |
| socketioEmit | 233152 B | 0 B | PASS |

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
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.85% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +56.42% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +10.49% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.75% |
| min | 0.00ms | 0.00ms | +0.00ms | +13.82% |
| max | 0.02ms | 0.01ms | +0.00ms | +25.50% |
| total | 0.37ms | 0.32ms | +0.04ms | +13.75% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +25.08% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +40.71% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.40% |
| max | 0.01ms | 0.01ms | -0.00ms | -19.19% |
| total | 0.09ms | 0.09ms | +0.01ms | +9.17% |

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
| max | 0.00ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +18.34% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.29% |
| min | 0.00ms | 0.00ms | +0.00ms | +50.60% |
| max | 0.00ms | 0.00ms | -0.00ms | -39.10% |
| total | 0.03ms | 0.03ms | +0.00ms | +12.29% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +22.40% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +25.96% |
| mean | 0.00ms | 0.00ms | +0.00ms | +18.38% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.43% |
| max | 0.00ms | 0.00ms | +0.00ms | +26.09% |
| total | 0.08ms | 0.07ms | +0.01ms | +18.38% |

