# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.02ms | 30ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.07ms | 100ms | 0.00042ms | PASS | stable (p10 +1% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.02ms | 30ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | cpu | 0.08ms | 0.01ms | 0.127 | 0.121 | 0.01ms | 0.0099ms |
| pub_sub_burst (subscribe + 50 publish + drain) | cpu | 0.08ms | 0.02ms | 0.227 | 0.224 | 0.02ms | 0.02ms |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | cpu | 0.08ms | 0.01ms | 0.141 | 0.136 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.07ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.07ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -9792 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 10840 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 704 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0050ms |
| min | 0.0097ms |
| max | 0.02ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0099ms | +0.00022ms | +2.27% |
| p50 | 0.01ms | 0.01ms | +0.0016ms | +14.18% |
| p95 | 0.02ms | 0.02ms | +0.00022ms | +0.91% |
| p99 | 0.02ms | 0.03ms | -0.00068ms | -2.72% |
| mean | 0.01ms | 0.01ms | +0.00074ms | +5.31% |
| min | 0.0097ms | 0.0096ms | +0.000041ms | +0.43% |
| max | 0.02ms | 0.03ms | -0.0011ms | -4.23% |
| total | 0.44ms | 0.42ms | +0.02ms | +5.31% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.07ms |
| p99 | 0.09ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 0.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00030ms | +1.62% |
| p50 | 0.02ms | 0.02ms | +0.0029ms | +15.02% |
| p95 | 0.07ms | 0.05ms | +0.02ms | +30.23% |
| p99 | 0.09ms | 0.07ms | +0.03ms | +37.65% |
| mean | 0.03ms | 0.03ms | +0.0053ms | +20.05% |
| min | 0.02ms | 0.02ms | +0.00017ms | +0.93% |
| max | 0.10ms | 0.07ms | +0.03ms | +36.12% |
| total | 0.96ms | 0.80ms | +0.16ms | +20.05% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00066ms | +6.03% |
| p50 | 0.01ms | 0.01ms | +0.00040ms | +3.19% |
| p95 | 0.02ms | 0.02ms | +0.0014ms | +6.18% |
| p99 | 0.09ms | 0.05ms | +0.04ms | +72.16% |
| mean | 0.02ms | 0.02ms | +0.0021ms | +13.49% |
| min | 0.01ms | 0.01ms | +0.00029ms | +2.72% |
| max | 0.12ms | 0.07ms | +0.05ms | +81.37% |
| total | 0.53ms | 0.47ms | +0.06ms | +13.49% |

