# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.0097ms | 0.03ms | 30ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.03ms | 0.12ms | 100ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.02ms | 0.03ms | 30ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.16ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.35ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.08ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -12352 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 1368 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 2280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0097ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0077ms |
| min | 0.0093ms |
| max | 0.03ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.02ms | -0.0073ms | -42.92% |
| p50 | 0.02ms | 0.02ms | +5.0e-7ms | +0.00% |
| p95 | 0.03ms | 0.03ms | +0.00065ms | +2.05% |
| p99 | 0.03ms | 0.04ms | -0.0037ms | -9.75% |
| mean | 0.02ms | 0.02ms | -0.0024ms | -11.23% |
| min | 0.0093ms | 0.01ms | -0.0054ms | -36.73% |
| max | 0.03ms | 0.04ms | -0.0058ms | -14.58% |
| total | 0.58ms | 0.65ms | -0.07ms | -11.23% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.12ms |
| p99 | 0.16ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.18ms |
| total | 1.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0054ms | +26.38% |
| p50 | 0.04ms | 0.05ms | -0.01ms | -21.92% |
| p95 | 0.12ms | 1.16ms | -1.05ms | -89.98% |
| p99 | 0.16ms | 2.08ms | -1.92ms | -92.21% |
| mean | 0.05ms | 0.22ms | -0.17ms | -78.58% |
| min | 0.03ms | 0.02ms | +0.0057ms | +28.90% |
| max | 0.18ms | 2.40ms | -2.22ms | -92.57% |
| total | 1.42ms | 6.63ms | -5.21ms | -78.58% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.13ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0045ms | +34.05% |
| p50 | 0.02ms | 0.01ms | +0.0044ms | +31.62% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -48.41% |
| p99 | 0.11ms | 0.10ms | +0.0057ms | +5.73% |
| mean | 0.02ms | 0.02ms | +0.0034ms | +16.12% |
| min | 0.02ms | 0.01ms | +0.0028ms | +21.51% |
| max | 0.13ms | 0.11ms | +0.03ms | +27.88% |
| total | 0.73ms | 0.63ms | +0.10ms | +16.12% |

