# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.04ms | 30ms | 0.00042ms | PASS | stable (換算後 p10 +9% (閾値未満)、 p95 +86% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.07ms | 100ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.03ms | 30ms | 0.00040ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | cpu | 0.08ms | 0.12ms | 0.01ms | 0.133 | 0.122 | 0.01ms | 0.01ms |
| pub_sub_burst (subscribe + 50 publish + drain) | cpu | 0.09ms | 0.11ms | 0.02ms | 0.225 | 0.234 | 0.02ms | 0.02ms |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | cpu | 0.08ms | 0.12ms | 0.01ms | 0.140 | 0.144 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.07ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.13ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.06ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -11224 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 10920 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 4328 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0089ms |
| min | 0.0096ms |
| max | 0.05ms |
| total | 0.52ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.020)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00090ms | +9.00% |
| p50 | 0.01ms | 0.01ms | +0.0033ms | +29.39% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +86.21% |
| p99 | 0.04ms | 0.03ms | +0.02ms | +75.19% |
| mean | 0.02ms | 0.01ms | +0.0040ms | +28.98% |
| min | 0.0098ms | 0.0096ms | +0.00015ms | +1.53% |
| max | 0.05ms | 0.03ms | +0.02ms | +69.55% |
| total | 0.54ms | 0.41ms | +0.12ms | +28.98% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.07ms |
| p99 | 0.10ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 1.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.894)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00071ms | -3.79% |
| p50 | 0.02ms | 0.02ms | +0.00074ms | +3.73% |
| p95 | 0.07ms | 0.07ms | -0.0079ms | -10.61% |
| p99 | 0.09ms | 0.18ms | -0.10ms | -52.09% |
| mean | 0.03ms | 0.04ms | -0.0046ms | -12.73% |
| min | 0.02ms | 0.02ms | -0.00062ms | -3.38% |
| max | 0.09ms | 0.22ms | -0.13ms | -57.83% |
| total | 0.94ms | 1.07ms | -0.14ms | -12.73% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.13ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.18ms |
| total | 0.68ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.964)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00035ms | -2.94% |
| p50 | 0.02ms | 0.01ms | +0.0038ms | +30.13% |
| p95 | 0.03ms | 0.03ms | +0.0035ms | +13.55% |
| p99 | 0.13ms | 0.03ms | +0.10ms | +280.65% |
| mean | 0.02ms | 0.01ms | +0.0077ms | +53.75% |
| min | 0.01ms | 0.01ms | -0.00043ms | -3.91% |
| max | 0.17ms | 0.04ms | +0.13ms | +366.92% |
| total | 0.66ms | 0.43ms | +0.23ms | +53.75% |

