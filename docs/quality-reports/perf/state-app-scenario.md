# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00062ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.0085ms | 0.03ms | 100ms | 0.00084ms | PASS | regressed — gate 無効 (regressionGate=false) |
| subscribe_batch (5 listener + 5 state updates) | 0.0026ms | 0.0086ms | 100ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_error_handling (5 unknown action type dispatch) | 0.01ms | 0.02ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | cpu | 0.12ms | 0.13ms | 0.0085ms | 0.070 | 0.039 | n/a | 20.0% | 0.0057ms | 0.0032ms |
| subscribe_batch (5 listener + 5 state updates) | cpu | 0.09ms | 0.10ms | 0.0026ms | 0.028 | 0.028 | n/a | 20.0% | 0.0023ms | 0.0022ms |
| dispatch_error_handling (5 unknown action type dispatch) | cpu | 0.10ms | 0.10ms | 0.01ms | 0.109 | 0.110 | n/a | 20.0% | 0.0090ms | 0.0091ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.20ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.02ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.08ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | -23376 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| subscribe_batch (5 listener + 5 state updates) | -12440 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | -1464 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0086ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0074ms |
| min | 0.0085ms |
| max | 0.03ms |
| total | 0.23ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.675)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0032ms | +0.0025ms | +80.40% |
| p50 | 0.0058ms | 0.0033ms | +0.0026ms | +78.15% |
| p95 | 0.02ms | 0.0049ms | +0.02ms | +346.95% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +88.99% |
| mean | 0.0078ms | 0.0039ms | +0.0039ms | +98.63% |
| min | 0.0057ms | 0.0031ms | +0.0026ms | +85.31% |
| max | 0.02ms | 0.01ms | +0.0088ms | +65.53% |
| total | 0.16ms | 0.08ms | +0.08ms | +98.63% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0086ms |
| p99 | 0.01ms |
| mean | 0.0038ms |
| stdev | 0.0024ms |
| min | 0.0025ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.873)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0022ms | +0.0000094ms | +0.42% |
| p50 | 0.0024ms | 0.0027ms | -0.00035ms | -12.71% |
| p95 | 0.0075ms | 0.0085ms | -0.00096ms | -11.27% |
| p99 | 0.0099ms | 0.01ms | -0.0043ms | -30.14% |
| mean | 0.0033ms | 0.0038ms | -0.00050ms | -12.98% |
| min | 0.0022ms | 0.0022ms | +0.000011ms | +0.48% |
| max | 0.01ms | 0.02ms | -0.0051ms | -32.71% |
| total | 0.07ms | 0.08ms | -0.0099ms | -12.98% |

### dispatch_error_handling (5 unknown action type dispatch)

# Perf Report — dispatch_error_handling (5 unknown action type dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0055ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.842)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0090ms | 0.0091ms | -0.000096ms | -1.06% |
| p50 | 0.0092ms | 0.0092ms | -0.000075ms | -0.81% |
| p95 | 0.02ms | 0.02ms | -0.00072ms | -4.33% |
| p99 | 0.03ms | 0.03ms | -0.0055ms | -17.03% |
| mean | 0.01ms | 0.01ms | -0.00039ms | -3.53% |
| min | 0.0089ms | 0.0090ms | -0.000053ms | -0.58% |
| max | 0.03ms | 0.04ms | -0.0067ms | -18.50% |
| total | 0.21ms | 0.22ms | -0.0078ms | -3.53% |

