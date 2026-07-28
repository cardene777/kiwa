# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 30ms | PASS | stable |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.08ms | 100ms | PASS | stable |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.02ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.09ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.10ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.06ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -9488 B | -15284 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 1240 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | -11584 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.08ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +18.29% |
| p95 | 0.06ms | 0.03ms | +0.03ms | +135.14% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +143.90% |
| mean | 0.02ms | 0.02ms | +0.01ms | +44.97% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.08ms | 0.03ms | +0.04ms | +142.40% |
| total | 0.71ms | 0.49ms | +0.22ms | +44.97% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.08ms |
| p99 | 0.10ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.11ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +3.29% |
| p95 | 0.08ms | 0.06ms | +0.01ms | +20.12% |
| p99 | 0.10ms | 0.07ms | +0.03ms | +39.10% |
| mean | 0.04ms | 0.03ms | +0.00ms | +11.47% |
| min | 0.02ms | 0.02ms | +0.00ms | +3.86% |
| max | 0.11ms | 0.07ms | +0.03ms | +47.33% |
| total | 1.14ms | 1.03ms | +0.12ms | +11.47% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.15ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +27.22% |
| p95 | 0.02ms | 0.02ms | +0.01ms | +51.55% |
| p99 | 0.11ms | 0.02ms | +0.09ms | +480.08% |
| mean | 0.02ms | 0.01ms | +0.01ms | +63.57% |
| min | 0.01ms | 0.01ms | +0.00ms | +17.26% |
| max | 0.15ms | 0.02ms | +0.13ms | +621.49% |
| total | 0.66ms | 0.40ms | +0.26ms | +63.57% |

