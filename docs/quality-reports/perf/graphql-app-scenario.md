# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.07ms | 0.18ms | 100ms | 0.00078ms | PASS | regressed — gate 無効 (regressionGate=false) |
| mutation_batch (5 createUser mutations) | 0.02ms | 0.10ms | 100ms | 0.00095ms | PASS | stable (換算後 p10 +9% (閾値未満)、 p95 +461% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| subscription_error_handling (5 subscribe + close + invalid) | 0.02ms | 0.03ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | cpu | 0.12ms | 0.16ms | 0.07ms | 0.563 | 0.284 | n/a | 20.0% | 0.05ms | 0.02ms |
| mutation_batch (5 createUser mutations) | cpu | 0.10ms | 0.12ms | 0.02ms | 0.153 | 0.141 | n/a | 20.0% | 0.01ms | 0.01ms |
| subscription_error_handling (5 subscribe + close + invalid) | cpu | 0.09ms | 0.09ms | 0.02ms | 0.254 | 0.269 | n/a | 20.0% | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.15ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.10ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 46992 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| mutation_batch (5 createUser mutations) | 37872 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 296 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### query_workflow (10 client.query with variables)

# Perf Report — query_workflow (10 client.query with variables).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.07ms |
| p50 | 0.08ms |
| p95 | 0.18ms |
| p99 | 0.21ms |
| mean | 0.10ms |
| stdev | 0.04ms |
| min | 0.07ms |
| max | 0.21ms |
| total | 1.98ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.670)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.02ms | +0.02ms | +98.01% |
| p50 | 0.06ms | 0.03ms | +0.03ms | +98.19% |
| p95 | 0.12ms | 0.04ms | +0.08ms | +189.82% |
| p99 | 0.14ms | 0.04ms | +0.10ms | +229.73% |
| mean | 0.07ms | 0.03ms | +0.04ms | +130.41% |
| min | 0.04ms | 0.02ms | +0.02ms | +116.80% |
| max | 0.14ms | 0.04ms | +0.10ms | +239.41% |
| total | 1.33ms | 0.58ms | +0.75ms | +130.41% |

### mutation_batch (5 createUser mutations)

# Perf Report — mutation_batch (5 createUser mutations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.10ms |
| p99 | 0.12ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 0.59ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.813)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00099ms | +8.86% |
| p50 | 0.02ms | 0.01ms | +0.0029ms | +24.27% |
| p95 | 0.08ms | 0.01ms | +0.06ms | +460.85% |
| p99 | 0.09ms | 0.01ms | +0.08ms | +559.45% |
| mean | 0.02ms | 0.01ms | +0.01ms | +95.85% |
| min | 0.01ms | 0.01ms | +0.00054ms | +4.87% |
| max | 0.10ms | 0.01ms | +0.08ms | +583.49% |
| total | 0.48ms | 0.24ms | +0.23ms | +95.85% |

### subscription_error_handling (5 subscribe + close + invalid)

# Perf Report — subscription_error_handling (5 subscribe + close + invalid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0011ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.859)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0013ms | -5.82% |
| p50 | 0.02ms | 0.02ms | -0.00094ms | -4.24% |
| p95 | 0.02ms | 0.03ms | -0.0055ms | -19.61% |
| p99 | 0.02ms | 0.08ms | -0.06ms | -70.21% |
| mean | 0.02ms | 0.03ms | -0.0046ms | -17.84% |
| min | 0.02ms | 0.02ms | -0.00074ms | -3.53% |
| max | 0.02ms | 0.09ms | -0.07ms | -74.01% |
| total | 0.43ms | 0.52ms | -0.09ms | -17.84% |

