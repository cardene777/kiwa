# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.0022ms | 0.02ms | 50ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_thread_conversation (5 thread × 3 message) | 0.0070ms | 0.01ms | 100ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |
| tool_call_chain (10 toolCall build) | 0.0018ms | 0.0039ms | 30ms | 0.00044ms | PASS | stable (換算後 p10 +0% (閾値未満)、 p95 +46% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | cpu | 0.09ms | 0.11ms | 0.0022ms | 0.023 | 0.022 | n/a | 20.0% | 0.0020ms | 0.0018ms |
| multi_thread_conversation (5 thread × 3 message) | cpu | 0.09ms | 0.10ms | 0.0070ms | 0.076 | 0.076 | n/a | 20.0% | 0.0062ms | 0.0062ms |
| tool_call_chain (10 toolCall build) | cpu | 0.09ms | 0.12ms | 0.0018ms | 0.019 | 0.019 | n/a | 20.0% | 0.0016ms | 0.0016ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.01ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.06ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | -13920 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| multi_thread_conversation (5 thread × 3 message) | -6032 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| tool_call_chain (10 toolCall build) | 8976 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0042ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0078ms |
| stdev | 0.0070ms |
| min | 0.0020ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.909)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0018ms | +0.00014ms | +7.72% |
| p50 | 0.0038ms | 0.0031ms | +0.00072ms | +23.64% |
| p95 | 0.01ms | 0.01ms | +0.0013ms | +9.41% |
| p99 | 0.02ms | 0.02ms | +0.000055ms | +0.23% |
| mean | 0.0071ms | 0.0063ms | +0.00074ms | +11.67% |
| min | 0.0019ms | 0.0018ms | +0.00011ms | +6.04% |
| max | 0.03ms | 0.03ms | -0.00025ms | -0.95% |
| total | 0.14ms | 0.13ms | +0.01ms | +11.67% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0070ms |
| p50 | 0.0080ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0083ms |
| stdev | 0.0018ms |
| min | 0.0069ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.883)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0062ms | -0.000027ms | -0.43% |
| p50 | 0.0070ms | 0.0071ms | -0.000054ms | -0.76% |
| p95 | 0.0089ms | 0.01ms | -0.0022ms | -19.94% |
| p99 | 0.01ms | 0.01ms | -0.00019ms | -1.53% |
| mean | 0.0074ms | 0.0076ms | -0.00022ms | -2.88% |
| min | 0.0061ms | 0.0062ms | -0.000058ms | -0.95% |
| max | 0.01ms | 0.01ms | +0.00031ms | +2.39% |
| total | 0.15ms | 0.15ms | -0.0044ms | -2.88% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0018ms |
| p50 | 0.0018ms |
| p95 | 0.0039ms |
| p99 | 0.02ms |
| mean | 0.0030ms |
| stdev | 0.0048ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.885)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0016ms | +0.0000015ms | +0.09% |
| p50 | 0.0016ms | 0.0016ms | +0.000018ms | +1.09% |
| p95 | 0.0035ms | 0.0024ms | +0.0011ms | +46.01% |
| p99 | 0.02ms | 0.0033ms | +0.01ms | +429.52% |
| mean | 0.0027ms | 0.0017ms | +0.00093ms | +53.10% |
| min | 0.0015ms | 0.0015ms | +0.0000062ms | +0.40% |
| max | 0.02ms | 0.0035ms | +0.02ms | +495.06% |
| total | 0.05ms | 0.03ms | +0.02ms | +53.10% |

