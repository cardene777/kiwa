# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.04ms | 30ms | PASS | regressed |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.10ms | 100ms | PASS | stable |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.03ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.11ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 1829552 B | 0 B | 102400 B | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | -5152552 B | 0 B | 102400 B | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 1345504 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +2.78% |
| p95 | 0.04ms | 0.02ms | +0.01ms | +42.96% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +41.27% |
| mean | 0.02ms | 0.02ms | +0.00ms | +20.84% |
| min | 0.01ms | 0.01ms | +0.00ms | +26.75% |
| max | 0.04ms | 0.03ms | +0.01ms | +37.82% |
| total | 0.61ms | 0.51ms | +0.11ms | +20.84% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.10ms |
| p99 | 0.12ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.12ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -5.35% |
| p95 | 0.10ms | 0.08ms | +0.02ms | +24.04% |
| p99 | 0.12ms | 0.20ms | -0.08ms | -40.35% |
| mean | 0.04ms | 0.05ms | -0.01ms | -12.84% |
| min | 0.02ms | 0.02ms | +0.00ms | +6.92% |
| max | 0.12ms | 0.25ms | -0.13ms | -51.37% |
| total | 1.18ms | 1.35ms | -0.17ms | -12.84% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +10.90% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +2.28% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -34.18% |
| mean | 0.02ms | 0.01ms | +0.00ms | +7.23% |
| min | 0.01ms | 0.01ms | +0.00ms | +12.03% |
| max | 0.03ms | 0.04ms | -0.02ms | -41.11% |
| total | 0.46ms | 0.43ms | +0.03ms | +7.23% |

