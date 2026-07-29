# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.03ms | 30ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.08ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.02ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.10ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.06ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -8800 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 1368 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 2280 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0062ms |
| min | 0.0099ms |
| max | 0.03ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0047ms | -27.85% |
| p50 | 0.02ms | 0.02ms | +0.00092ms | +4.77% |
| p95 | 0.03ms | 0.03ms | -0.0024ms | -7.73% |
| p99 | 0.03ms | 0.04ms | -0.0068ms | -17.97% |
| mean | 0.02ms | 0.02ms | -0.0020ms | -9.07% |
| min | 0.0099ms | 0.01ms | -0.0048ms | -32.77% |
| max | 0.03ms | 0.04ms | -0.0084ms | -21.04% |
| total | 0.59ms | 0.65ms | -0.06ms | -9.07% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.08ms |
| p99 | 0.10ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 1.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00066ms | -3.21% |
| p50 | 0.03ms | 0.05ms | -0.02ms | -35.02% |
| p95 | 0.08ms | 1.16ms | -1.08ms | -93.15% |
| p99 | 0.10ms | 2.08ms | -1.98ms | -95.35% |
| mean | 0.04ms | 0.22ms | -0.19ms | -83.83% |
| min | 0.02ms | 0.02ms | -0.00092ms | -4.64% |
| max | 0.10ms | 2.40ms | -2.30ms | -95.79% |
| total | 1.07ms | 6.63ms | -5.56ms | -83.83% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.24ms |
| mean | 0.03ms |
| stdev | 0.06ms |
| min | 0.01ms |
| max | 0.33ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0013ms | +9.50% |
| p50 | 0.02ms | 0.01ms | +0.0013ms | +9.38% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -61.96% |
| p99 | 0.24ms | 0.10ms | +0.14ms | +140.60% |
| mean | 0.03ms | 0.02ms | +0.0057ms | +27.09% |
| min | 0.01ms | 0.01ms | +0.0013ms | +10.10% |
| max | 0.33ms | 0.11ms | +0.22ms | +210.20% |
| total | 0.80ms | 0.63ms | +0.17ms | +27.09% |

