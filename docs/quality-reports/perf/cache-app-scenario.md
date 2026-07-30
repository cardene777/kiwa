# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.0095ms | 0.02ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.05ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.03ms | 30ms | 0.00043ms | PASS | stable (換算後 p10 -3% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | cpu | 0.08ms | 0.09ms | 0.0095ms | 0.117 | 0.122 | 0.0096ms | 0.01ms |
| pub_sub_burst (subscribe + 50 publish + drain) | cpu | 0.08ms | 0.09ms | 0.02ms | 0.220 | 0.234 | 0.02ms | 0.02ms |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | cpu | 0.08ms | 0.08ms | 0.01ms | 0.139 | 0.144 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.06ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.07ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.05ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -9888 B | 0 B | 102400 B | yes | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 10840 B | 0 B | 102400 B | yes | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 784 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0095ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0042ms |
| min | 0.0090ms |
| max | 0.02ms |
| total | 0.38ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.009)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.01ms | -0.00040ms | -4.02% |
| p50 | 0.01ms | 0.01ms | -0.00063ms | -5.53% |
| p95 | 0.02ms | 0.02ms | -0.000038ms | -0.17% |
| p99 | 0.02ms | 0.03ms | -0.0029ms | -11.25% |
| mean | 0.01ms | 0.01ms | -0.0010ms | -7.42% |
| min | 0.0091ms | 0.0096ms | -0.00050ms | -5.20% |
| max | 0.02ms | 0.03ms | -0.0042ms | -15.64% |
| total | 0.38ms | 0.41ms | -0.03ms | -7.42% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.07ms |
| total | 0.80ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.976)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0011ms | -5.91% |
| p50 | 0.02ms | 0.02ms | -0.0017ms | -8.41% |
| p95 | 0.05ms | 0.07ms | -0.02ms | -33.16% |
| p99 | 0.07ms | 0.18ms | -0.12ms | -63.49% |
| mean | 0.03ms | 0.04ms | -0.0099ms | -27.60% |
| min | 0.02ms | 0.02ms | -0.0010ms | -5.67% |
| max | 0.07ms | 0.22ms | -0.15ms | -67.11% |
| total | 0.78ms | 1.07ms | -0.30ms | -27.60% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 0.51ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.022)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00041ms | -3.46% |
| p50 | 0.01ms | 0.01ms | +0.00017ms | +1.35% |
| p95 | 0.03ms | 0.03ms | +0.0053ms | +20.38% |
| p99 | 0.08ms | 0.03ms | +0.05ms | +144.54% |
| mean | 0.02ms | 0.01ms | +0.0032ms | +22.14% |
| min | 0.01ms | 0.01ms | +0.000073ms | +0.66% |
| max | 0.10ms | 0.04ms | +0.07ms | +184.59% |
| total | 0.52ms | 0.43ms | +0.09ms | +22.14% |

