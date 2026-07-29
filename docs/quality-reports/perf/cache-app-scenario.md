# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.04ms | 30ms | 0.00041ms | PASS | improved — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.05ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.03ms | 30ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.15ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.07ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -10592 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 1368 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 672 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0092ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0037ms | -21.99% |
| p50 | 0.01ms | 0.02ms | -0.0046ms | -23.86% |
| p95 | 0.04ms | 0.03ms | +0.0054ms | +17.16% |
| p99 | 0.05ms | 0.04ms | +0.0087ms | +22.95% |
| mean | 0.02ms | 0.02ms | -0.0027ms | -12.52% |
| min | 0.01ms | 0.01ms | -0.0042ms | -28.25% |
| max | 0.05ms | 0.04ms | +0.010ms | +24.90% |
| total | 0.57ms | 0.65ms | -0.08ms | -12.52% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.09ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 1.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00072ms | -3.49% |
| p50 | 0.03ms | 0.05ms | -0.02ms | -35.73% |
| p95 | 0.05ms | 1.16ms | -1.11ms | -95.32% |
| p99 | 0.09ms | 2.08ms | -1.99ms | -95.84% |
| mean | 0.03ms | 0.22ms | -0.19ms | -84.90% |
| min | 0.02ms | 0.02ms | -0.00042ms | -2.11% |
| max | 0.10ms | 2.40ms | -2.30ms | -95.91% |
| total | 1.00ms | 6.63ms | -5.63ms | -84.90% |

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
| p10 | 0.01ms | 0.01ms | -0.00025ms | -1.86% |
| p50 | 0.01ms | 0.01ms | -0.000041ms | -0.30% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -54.19% |
| p99 | 0.09ms | 0.10ms | -0.01ms | -12.13% |
| mean | 0.02ms | 0.02ms | -0.0025ms | -11.96% |
| min | 0.01ms | 0.01ms | -0.0018ms | -14.00% |
| max | 0.11ms | 0.11ms | +0.0045ms | +4.27% |
| total | 0.55ms | 0.63ms | -0.08ms | -11.96% |

