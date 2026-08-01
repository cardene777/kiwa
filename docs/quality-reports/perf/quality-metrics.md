# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00033ms | 0.0051ms | 5ms | 0.00036ms | PASS | stable (検知には +0.00036ms (baseline 比 +125%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| evaluateReleaseGate_11axis | 0.00025ms | 0.00079ms | 5ms | 0.00036ms | PASS | stable (検知には +0.00036ms (baseline 比 +175%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| diffReports | 0.00042ms | 0.0058ms | 5ms | 0.00036ms | PASS | stable (検知には +0.00036ms (baseline 比 +107%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | cpu | 0.09ms | 0.12ms | 0.00033ms | 0.004 | 0.004 | n/a | 20.0% | 0.00029ms | 0.00029ms |
| evaluateReleaseGate_11axis | cpu | 0.09ms | 0.10ms | 0.00025ms | 0.003 | 0.003 | n/a | 20.0% | 0.00022ms | 0.00021ms |
| diffReports | cpu | 0.09ms | 0.13ms | 0.00042ms | 0.004 | 0.004 | n/a | 20.0% | 0.00036ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.02ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.01ms | 10ms | PASS |
| diffReports | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | -4512 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| evaluateReleaseGate_11axis | 648 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| diffReports | 9104 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### evaluateReleaseGate_7axis

# Perf Report — evaluateReleaseGate_7axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.0051ms |
| p99 | 0.02ms |
| mean | 0.0015ms |
| stdev | 0.0057ms |
| min | 0.00029ms |
| max | 0.07ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.877)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | +9.7e-7ms | +0.33% |
| p50 | 0.00029ms | 0.00033ms | -0.000040ms | -12.06% |
| p95 | 0.0045ms | 0.0025ms | +0.0020ms | +78.68% |
| p99 | 0.02ms | 0.0091ms | +0.01ms | +111.29% |
| mean | 0.0013ms | 0.00077ms | +0.00054ms | +70.77% |
| min | 0.00026ms | 0.00029ms | -0.000036ms | -12.32% |
| max | 0.06ms | 0.01ms | +0.05ms | +475.21% |
| total | 0.26ms | 0.15ms | +0.11ms | +70.77% |

### evaluateReleaseGate_11axis

# Perf Report — evaluateReleaseGate_11axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00079ms |
| p99 | 0.0080ms |
| mean | 0.00044ms |
| stdev | 0.0011ms |
| min | 0.00025ms |
| max | 0.0094ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.877)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00022ms | 0.00021ms | +0.000011ms | +5.43% |
| p50 | 0.00022ms | 0.00025ms | -0.000031ms | -12.28% |
| p95 | 0.00070ms | 0.0048ms | -0.0041ms | -85.49% |
| p99 | 0.0071ms | 0.0087ms | -0.0016ms | -18.79% |
| mean | 0.00039ms | 0.00087ms | -0.00048ms | -55.57% |
| min | 0.00022ms | 0.00021ms | +0.000011ms | +5.43% |
| max | 0.0083ms | 0.01ms | -0.0043ms | -34.14% |
| total | 0.08ms | 0.17ms | -0.10ms | -55.57% |

### diffReports

# Perf Report — diffReports.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0058ms |
| p99 | 0.02ms |
| mean | 0.0016ms |
| stdev | 0.0032ms |
| min | 0.00038ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.859)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00036ms | 0.00033ms | +0.000024ms | +7.28% |
| p50 | 0.00039ms | 0.00038ms | +0.000018ms | +4.88% |
| p95 | 0.0050ms | 0.0038ms | +0.0013ms | +33.73% |
| p99 | 0.01ms | 0.01ms | +0.0020ms | +16.11% |
| mean | 0.0014ms | 0.00090ms | +0.00049ms | +54.97% |
| min | 0.00032ms | 0.00033ms | -0.000011ms | -3.30% |
| max | 0.02ms | 0.02ms | +0.0044ms | +22.06% |
| total | 0.28ms | 0.18ms | +0.10ms | +54.97% |

