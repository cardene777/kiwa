# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.0016ms | 0.03ms | 30ms | 0.00044ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +90% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| schema_validate_loop (50 validateSchema) | 0.0068ms | 0.03ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_lifecycle (register + unregister × 10 cycle) | 0.0022ms | 0.0025ms | 30ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | cpu | 0.09ms | 0.14ms | 0.0016ms | 0.017 | 0.016 | n/a | 20.0% | 0.0014ms | 0.0013ms |
| schema_validate_loop (50 validateSchema) | cpu | 0.09ms | 0.10ms | 0.0068ms | 0.072 | 0.074 | n/a | 20.0% | 0.0058ms | 0.0060ms |
| server_lifecycle (register + unregister × 10 cycle) | cpu | 0.09ms | 0.09ms | 0.0022ms | 0.024 | 0.024 | n/a | 20.0% | 0.0020ms | 0.0020ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.03ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | -25728 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| schema_validate_loop (50 validateSchema) | 7216 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 9512 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |

## Detailed serial reports

### tool_registration_burst (server + 20 register)

# Perf Report — tool_registration_burst (server + 20 register).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0016ms |
| p50 | 0.0044ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.0081ms |
| stdev | 0.0086ms |
| min | 0.0012ms |
| max | 0.04ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.887)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0013ms | +0.000098ms | +7.47% |
| p50 | 0.0039ms | 0.0038ms | +0.000086ms | +2.27% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +90.10% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +51.71% |
| mean | 0.0072ms | 0.0047ms | +0.0025ms | +54.13% |
| min | 0.0011ms | 0.0010ms | +0.000032ms | +3.03% |
| max | 0.03ms | 0.02ms | +0.0091ms | +39.70% |
| total | 0.22ms | 0.14ms | +0.08ms | +54.13% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0068ms |
| p50 | 0.0070ms |
| p95 | 0.03ms |
| p99 | 0.13ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.0067ms |
| max | 0.17ms |
| total | 0.54ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.850)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0060ms | -0.00015ms | -2.54% |
| p50 | 0.0060ms | 0.0062ms | -0.00024ms | -3.91% |
| p95 | 0.03ms | 0.02ms | +0.0032ms | +12.80% |
| p99 | 0.11ms | 0.03ms | +0.08ms | +303.44% |
| mean | 0.02ms | 0.01ms | +0.0045ms | +42.40% |
| min | 0.0057ms | 0.0058ms | -0.000091ms | -1.58% |
| max | 0.14ms | 0.03ms | +0.12ms | +417.23% |
| total | 0.45ms | 0.32ms | +0.14ms | +42.40% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0025ms |
| p99 | 0.0046ms |
| mean | 0.0024ms |
| stdev | 0.00058ms |
| min | 0.0022ms |
| max | 0.0055ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | -0.000043ms | -2.14% |
| p50 | 0.0020ms | 0.0021ms | -0.000057ms | -2.72% |
| p95 | 0.0022ms | 0.0070ms | -0.0047ms | -67.92% |
| p99 | 0.0041ms | 0.01ms | -0.01ms | -71.82% |
| mean | 0.0021ms | 0.0029ms | -0.00079ms | -27.09% |
| min | 0.0020ms | 0.0020ms | -0.0000056ms | -0.28% |
| max | 0.0048ms | 0.02ms | -0.01ms | -71.26% |
| total | 0.06ms | 0.09ms | -0.02ms | -27.09% |

