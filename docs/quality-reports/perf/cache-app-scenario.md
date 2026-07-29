# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.03ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.24ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.03ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.30ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.07ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -10560 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 1736 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 752 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0053ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0025ms | -15.00% |
| p50 | 0.02ms | 0.02ms | +0.00098ms | +5.10% |
| p95 | 0.03ms | 0.03ms | -0.0019ms | -5.96% |
| p99 | 0.03ms | 0.04ms | -0.0061ms | -16.09% |
| mean | 0.02ms | 0.02ms | -0.0010ms | -4.76% |
| min | 0.01ms | 0.01ms | -0.00087ms | -5.93% |
| max | 0.03ms | 0.04ms | -0.0077ms | -19.27% |
| total | 0.62ms | 0.65ms | -0.03ms | -4.76% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.24ms |
| p99 | 0.36ms |
| mean | 0.07ms |
| stdev | 0.09ms |
| min | 0.02ms |
| max | 0.39ms |
| total | 2.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00077ms | +3.77% |
| p50 | 0.03ms | 0.05ms | -0.01ms | -26.16% |
| p95 | 0.24ms | 1.16ms | -0.92ms | -79.11% |
| p99 | 0.36ms | 2.08ms | -1.72ms | -82.70% |
| mean | 0.07ms | 0.22ms | -0.15ms | -66.61% |
| min | 0.02ms | 0.02ms | +0.00096ms | +4.86% |
| max | 0.39ms | 2.40ms | -2.02ms | -83.96% |
| total | 2.21ms | 6.63ms | -4.42ms | -66.61% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00051ms | -3.84% |
| p50 | 0.01ms | 0.01ms | -0.00040ms | -2.87% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -52.03% |
| p99 | 0.09ms | 0.10ms | -0.01ms | -14.14% |
| mean | 0.02ms | 0.02ms | -0.0025ms | -11.95% |
| min | 0.01ms | 0.01ms | -0.0012ms | -9.12% |
| max | 0.11ms | 0.11ms | -0.00017ms | -0.16% |
| total | 0.55ms | 0.63ms | -0.08ms | -11.95% |

