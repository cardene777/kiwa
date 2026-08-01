# Perf Suite — cache-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.01ms | 0.08ms | 30ms | 0.00044ms | PASS | regressed — gate 無効 (regressionGate=false) |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.02ms | 0.06ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.01ms | 0.10ms | 30ms | 0.00044ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +249% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | cpu | 0.09ms | 0.15ms | 0.01ms | 0.153 | 0.122 | n/a | 20.0% | 0.01ms | 0.01ms |
| pub_sub_burst (subscribe + 50 publish + drain) | cpu | 0.09ms | 0.18ms | 0.02ms | 0.222 | 0.234 | n/a | 20.0% | 0.02ms | 0.02ms |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | cpu | 0.09ms | 0.15ms | 0.01ms | 0.147 | 0.144 | n/a | 20.0% | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | 0.09ms | 60ms | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 0.08ms | 200ms | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 0.06ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| read_heavy_workload (80 get / 20 set / 100 ops burst) | -16032 B | -15301 B | 102400 B | yes | 33 (3 + 30) | PASS |
| pub_sub_burst (subscribe + 50 publish + drain) | 10696 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| ttl_expiry_cycle (set with TTL + get + assertTTL loop) | 2928 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |

## Detailed serial reports

### read_heavy_workload (80 get / 20 set / 100 ops burst)

# Perf Report — read_heavy_workload (80 get / 20 set / 100 ops burst).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.08ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.08ms |
| total | 0.98ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.874)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0025ms | +24.78% |
| p50 | 0.02ms | 0.01ms | +0.0049ms | +42.94% |
| p95 | 0.07ms | 0.02ms | +0.05ms | +217.68% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +173.51% |
| mean | 0.03ms | 0.01ms | +0.01ms | +106.76% |
| min | 0.0095ms | 0.0096ms | -0.000088ms | -0.92% |
| max | 0.07ms | 0.03ms | +0.04ms | +158.72% |
| total | 0.86ms | 0.41ms | +0.44ms | +106.76% |

### pub_sub_burst (subscribe + 50 publish + drain)

# Perf Report — pub_sub_burst (subscribe + 50 publish + drain).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.10ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.11ms |
| total | 1.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.862)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00094ms | -4.99% |
| p50 | 0.02ms | 0.02ms | +0.00088ms | +4.42% |
| p95 | 0.06ms | 0.07ms | -0.02ms | -24.99% |
| p99 | 0.08ms | 0.18ms | -0.10ms | -54.80% |
| mean | 0.03ms | 0.04ms | -0.0049ms | -13.62% |
| min | 0.02ms | 0.02ms | -0.00089ms | -4.84% |
| max | 0.09ms | 0.22ms | -0.13ms | -57.53% |
| total | 0.93ms | 1.07ms | -0.15ms | -13.62% |

### ttl_expiry_cycle (set with TTL + get + assertTTL loop)

# Perf Report — ttl_expiry_cycle (set with TTL + get + assertTTL loop).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.10ms |
| p99 | 0.16ms |
| mean | 0.03ms |
| stdev | 0.04ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 0.91ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.874)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00020ms | +1.67% |
| p50 | 0.01ms | 0.01ms | +0.00011ms | +0.89% |
| p95 | 0.09ms | 0.03ms | +0.06ms | +249.26% |
| p99 | 0.14ms | 0.03ms | +0.10ms | +300.33% |
| mean | 0.03ms | 0.01ms | +0.01ms | +84.37% |
| min | 0.01ms | 0.01ms | +0.00020ms | +1.82% |
| max | 0.15ms | 0.04ms | +0.11ms | +311.07% |
| total | 0.79ms | 0.43ms | +0.36ms | +84.37% |

