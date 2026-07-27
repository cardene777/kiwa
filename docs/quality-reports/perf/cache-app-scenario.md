# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.07ms | 30ms | PASS | regressed |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.09ms | 100ms | PASS | stable |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.03ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.14ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.09ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 1829496 B | 0 B | 102400 B | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | -5519736 B | 0 B | 102400 B | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 1015040 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.08ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +7.44% |
| p95 | 0.07ms | 0.02ms | +0.04ms | +162.48% |
| p99 | 0.07ms | 0.03ms | +0.05ms | +168.32% |
| mean | 0.03ms | 0.02ms | +0.01ms | +57.86% |
| min | 0.01ms | 0.01ms | +0.00ms | +35.53% |
| max | 0.08ms | 0.03ms | +0.05ms | +169.96% |
| total | 0.80ms | 0.51ms | +0.29ms | +57.86% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.09ms |
| p99 | 0.11ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.12ms |
| total | 1.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.03ms | +0.00ms | +11.53% |
| p95 | 0.09ms | 0.08ms | +0.01ms | +12.63% |
| p99 | 0.11ms | 0.20ms | -0.09ms | -44.50% |
| mean | 0.04ms | 0.05ms | -0.00ms | -1.93% |
| min | 0.03ms | 0.02ms | +0.01ms | +32.08% |
| max | 0.12ms | 0.25ms | -0.13ms | -51.68% |
| total | 1.32ms | 1.35ms | -0.03ms | -1.93% |

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
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +25.66% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +5.51% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -32.05% |
| mean | 0.02ms | 0.01ms | +0.00ms | +16.02% |
| min | 0.01ms | 0.01ms | +0.00ms | +25.95% |
| max | 0.03ms | 0.04ms | -0.02ms | -39.17% |
| total | 0.50ms | 0.43ms | +0.07ms | +16.02% |

