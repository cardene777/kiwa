# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.06ms | 30ms | 0.00042ms | PASS | stable (p10 -16% (閾値未満)、 p95 +97% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.03ms | 0.06ms | 100ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.02ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.14ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -5424 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 808 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 1680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.12ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0027ms | -15.81% |
| p50 | 0.02ms | 0.02ms | -0.00021ms | -1.08% |
| p95 | 0.06ms | 0.03ms | +0.03ms | +97.24% |
| p99 | 0.12ms | 0.04ms | +0.08ms | +205.78% |
| mean | 0.03ms | 0.02ms | +0.0053ms | +24.42% |
| min | 0.01ms | 0.01ms | -0.00058ms | -3.96% |
| max | 0.13ms | 0.04ms | +0.09ms | +233.64% |
| total | 0.81ms | 0.65ms | +0.16ms | +24.42% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.09ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 1.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0080ms | +38.71% |
| p50 | 0.03ms | 0.05ms | -0.01ms | -28.98% |
| p95 | 0.06ms | 1.16ms | -1.10ms | -95.01% |
| p99 | 0.09ms | 2.08ms | -1.99ms | -95.77% |
| mean | 0.04ms | 0.22ms | -0.18ms | -82.67% |
| min | 0.02ms | 0.02ms | +0.0048ms | +24.26% |
| max | 0.10ms | 2.40ms | -2.30ms | -95.86% |
| total | 1.15ms | 6.63ms | -5.48ms | -82.67% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00025ms | -1.86% |
| p50 | 0.01ms | 0.01ms | -0.00027ms | -1.97% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -66.43% |
| p99 | 0.07ms | 0.10ms | -0.03ms | -25.48% |
| mean | 0.02ms | 0.02ms | -0.0040ms | -19.03% |
| min | 0.01ms | 0.01ms | -0.00092ms | -7.16% |
| max | 0.10ms | 0.11ms | -0.0099ms | -9.41% |
| total | 0.51ms | 0.63ms | -0.12ms | -19.03% |

