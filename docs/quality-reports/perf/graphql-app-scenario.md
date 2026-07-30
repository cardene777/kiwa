# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.03ms | 0.18ms | 100ms | 0.00041ms | PASS | stable (換算後 p10 +11% (閾値未満)、 p95 +328% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mutation_batch (5 createUser mutations) | 0.01ms | 0.02ms | 100ms | 0.00040ms | PASS | regressed — gate 無効 (regressionGate=false) |
| subscription_error_handling (5 subscribe + close + invalid) | 0.02ms | 0.06ms | 100ms | 0.00041ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +95% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | cpu | 0.08ms | 0.30ms | 0.03ms | 0.317 | 0.284 | 0.03ms | 0.02ms |
| mutation_batch (5 createUser mutations) | cpu | 0.08ms | 0.09ms | 0.01ms | 0.177 | 0.141 | 0.01ms | 0.01ms |
| subscription_error_handling (5 subscribe + close + invalid) | cpu | 0.08ms | 0.09ms | 0.02ms | 0.263 | 0.269 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.14ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.08ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 58864 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 37256 B | 0 B | 102400 B | yes | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### query_workflow (10 client.query with variables)

# Perf Report — query_workflow (10 client.query with variables).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.18ms |
| p99 | 0.18ms |
| mean | 0.05ms |
| stdev | 0.05ms |
| min | 0.03ms |
| max | 0.18ms |
| total | 1.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.988)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0027ms | +11.43% |
| p50 | 0.03ms | 0.03ms | +0.0031ms | +10.76% |
| p95 | 0.18ms | 0.04ms | +0.13ms | +327.64% |
| p99 | 0.18ms | 0.04ms | +0.14ms | +325.65% |
| mean | 0.05ms | 0.03ms | +0.02ms | +81.89% |
| min | 0.02ms | 0.02ms | +0.0047ms | +23.37% |
| max | 0.18ms | 0.04ms | +0.14ms | +325.17% |
| total | 1.05ms | 0.58ms | +0.47ms | +81.89% |

### mutation_batch (5 createUser mutations)

# Perf Report — mutation_batch (5 createUser mutations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0025ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.957)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0029ms | +26.05% |
| p50 | 0.02ms | 0.01ms | +0.0032ms | +26.02% |
| p95 | 0.02ms | 0.01ms | +0.0042ms | +30.11% |
| p99 | 0.02ms | 0.01ms | +0.0091ms | +63.74% |
| mean | 0.02ms | 0.01ms | +0.0037ms | +30.61% |
| min | 0.01ms | 0.01ms | +0.0026ms | +23.92% |
| max | 0.02ms | 0.01ms | +0.01ms | +71.94% |
| total | 0.32ms | 0.24ms | +0.07ms | +30.61% |

### subscription_error_handling (5 subscribe + close + invalid)

# Perf Report — subscription_error_handling (5 subscribe + close + invalid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.08ms |
| total | 0.56ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.985)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00051ms | -2.36% |
| p50 | 0.02ms | 0.02ms | +0.00077ms | +3.48% |
| p95 | 0.06ms | 0.03ms | +0.03ms | +94.90% |
| p99 | 0.08ms | 0.08ms | -0.0034ms | -4.17% |
| mean | 0.03ms | 0.03ms | +0.0014ms | +5.32% |
| min | 0.02ms | 0.02ms | -0.00012ms | -0.55% |
| max | 0.08ms | 0.09ms | -0.01ms | -11.62% |
| total | 0.55ms | 0.52ms | +0.03ms | +5.32% |

