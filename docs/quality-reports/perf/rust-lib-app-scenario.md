# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.0039ms | 0.03ms | 100ms | 0.00041ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_batch (5 tower layer chains) | 0.0035ms | 0.0070ms | 100ms | 0.00042ms | PASS | stable (換算後 p10 +0% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| route_error_handling (5 handler throw + catch) | 0.01ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.03ms | 100ms | 0.00042ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +108% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | cpu | 0.08ms | 0.09ms | 0.0039ms | 0.048 | 0.048 | 0.0039ms | 0.0040ms |
| middleware_chain_batch (5 tower layer chains) | cpu | 0.08ms | 0.11ms | 0.0035ms | 0.042 | 0.042 | 0.0035ms | 0.0035ms |
| route_error_handling (5 handler throw + catch) | cpu | 0.08ms | 0.08ms | 0.01ms | 0.138 | 0.139 | 0.01ms | 0.01ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.08ms | 0.09ms | 0.03ms | 0.341 | 0.328 | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.08ms | 0.09ms | 0.01ms | 0.126 | 0.119 | 0.01ms | 0.0099ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.04ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.08ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 5776 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | 7648 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | 656 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3760 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3984 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0039ms |
| p50 | 0.0043ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.0083ms |
| stdev | 0.0085ms |
| min | 0.0037ms |
| max | 0.03ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.986)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0039ms | 0.0040ms | -0.000059ms | -1.49% |
| p50 | 0.0043ms | 0.0043ms | -0.000018ms | -0.41% |
| p95 | 0.03ms | 0.02ms | +0.0049ms | +20.28% |
| p99 | 0.03ms | 0.04ms | -0.0078ms | -19.62% |
| mean | 0.0082ms | 0.0091ms | -0.00092ms | -10.15% |
| min | 0.0036ms | 0.0039ms | -0.00030ms | -7.65% |
| max | 0.03ms | 0.04ms | -0.01ms | -25.17% |
| total | 0.16ms | 0.18ms | -0.02ms | -10.15% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0035ms |
| p50 | 0.0037ms |
| p95 | 0.0070ms |
| p99 | 0.02ms |
| mean | 0.0049ms |
| stdev | 0.0030ms |
| min | 0.0035ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.000)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0035ms | +0.0000027ms | +0.08% |
| p50 | 0.0037ms | 0.0036ms | +0.00010ms | +2.84% |
| p95 | 0.0070ms | 0.0049ms | +0.0021ms | +42.22% |
| p99 | 0.02ms | 0.0061ms | +0.0090ms | +145.96% |
| mean | 0.0049ms | 0.0039ms | +0.00096ms | +24.46% |
| min | 0.0035ms | 0.0034ms | +0.000082ms | +2.39% |
| max | 0.02ms | 0.0065ms | +0.01ms | +165.70% |
| total | 0.10ms | 0.08ms | +0.02ms | +24.46% |

### route_error_handling (5 handler throw + catch)

# Perf Report — route_error_handling (5 handler throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0015ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.006)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.000066ms | -0.58% |
| p50 | 0.01ms | 0.01ms | +0.00051ms | +4.22% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -54.89% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -52.33% |
| mean | 0.01ms | 0.02ms | -0.0024ms | -15.96% |
| min | 0.01ms | 0.01ms | -0.00019ms | -1.67% |
| max | 0.02ms | 0.04ms | -0.02ms | -51.79% |
| total | 0.25ms | 0.30ms | -0.05ms | -15.96% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.0076ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.67ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.994)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0010ms | +3.87% |
| p50 | 0.03ms | 0.03ms | +0.0030ms | +10.71% |
| p95 | 0.04ms | 0.04ms | +0.0019ms | +4.96% |
| p99 | 0.06ms | 0.04ms | +0.02ms | +43.60% |
| mean | 0.03ms | 0.03ms | +0.0036ms | +12.03% |
| min | 0.03ms | 0.03ms | -0.000048ms | -0.18% |
| max | 0.06ms | 0.04ms | +0.02ms | +53.00% |
| total | 0.66ms | 0.59ms | +0.07ms | +12.03% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0083ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.000)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0099ms | +0.00051ms | +5.18% |
| p50 | 0.02ms | 0.01ms | +0.0059ms | +55.72% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +108.19% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +100.39% |
| mean | 0.02ms | 0.01ms | +0.0061ms | +53.92% |
| min | 0.01ms | 0.0095ms | +0.00050ms | +5.29% |
| max | 0.04ms | 0.02ms | +0.02ms | +99.13% |
| total | 0.35ms | 0.23ms | +0.12ms | +53.92% |

