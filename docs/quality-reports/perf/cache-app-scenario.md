# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.03ms | 30ms | PASS | stable |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.12ms | 100ms | PASS | stable |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.02ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.13ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.06ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -12608 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | -13088 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 18144 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +61.98% |
| p95 | 0.03ms | 0.03ms | +0.01ms | +26.74% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +14.35% |
| mean | 0.02ms | 0.02ms | +0.01ms | +48.33% |
| min | 0.02ms | 0.01ms | +0.01ms | +57.44% |
| max | 0.03ms | 0.03ms | +0.00ms | +11.73% |
| total | 0.73ms | 0.49ms | +0.24ms | +48.33% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.12ms |
| p99 | 0.13ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.04ms |
| max | 0.13ms |
| total | 1.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.03ms | +0.01ms | +33.47% |
| p95 | 0.12ms | 0.06ms | +0.06ms | +90.47% |
| p99 | 0.13ms | 0.07ms | +0.05ms | +75.48% |
| mean | 0.05ms | 0.03ms | +0.02ms | +55.84% |
| min | 0.04ms | 0.02ms | +0.02ms | +94.65% |
| max | 0.13ms | 0.07ms | +0.06ms | +76.34% |
| total | 1.60ms | 1.03ms | +0.57ms | +55.84% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +16.30% |
| p95 | 0.02ms | 0.02ms | +0.01ms | +32.43% |
| p99 | 0.09ms | 0.02ms | +0.07ms | +337.50% |
| mean | 0.02ms | 0.01ms | +0.01ms | +38.13% |
| min | 0.01ms | 0.01ms | +0.00ms | +17.60% |
| max | 0.11ms | 0.02ms | +0.09ms | +433.33% |
| total | 0.56ms | 0.40ms | +0.15ms | +38.13% |

