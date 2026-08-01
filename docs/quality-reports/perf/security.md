# Perf Suite — security

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildCspHeader | 0.0039ms | 0.02ms | 5ms | 0.00035ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +74% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| validateNonce | 0.00025ms | 0.0043ms | 5ms | 0.00035ms | PASS | stable (検知には +0.00035ms (baseline 比 +169%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| buildCspHeader | cpu | 0.09ms | 0.12ms | 0.0039ms | 0.042 | 0.040 | n/a | 20.0% | 0.0034ms | 0.0032ms |
| validateNonce | cpu | 0.09ms | 0.14ms | 0.00025ms | 0.003 | 0.003 | n/a | 20.0% | 0.00022ms | 0.00021ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildCspHeader | 0.05ms | 10ms | PASS |
| validateNonce | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| buildCspHeader | -3920 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| validateNonce | -3568 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### buildCspHeader

# Perf Report — buildCspHeader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0039ms |
| p50 | 0.0055ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0070ms |
| stdev | 0.0058ms |
| min | 0.0029ms |
| max | 0.04ms |
| total | 1.40ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.870)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0032ms | +0.00017ms | +5.26% |
| p50 | 0.0048ms | 0.0045ms | +0.00028ms | +6.21% |
| p95 | 0.01ms | 0.0082ms | +0.0061ms | +74.47% |
| p99 | 0.03ms | 0.02ms | +0.02ms | +115.64% |
| mean | 0.0061ms | 0.0049ms | +0.0012ms | +24.05% |
| min | 0.0025ms | 0.0024ms | +0.000085ms | +3.52% |
| max | 0.03ms | 0.02ms | +0.01ms | +58.54% |
| total | 1.22ms | 0.98ms | +0.24ms | +24.05% |

### validateNonce

# Perf Report — validateNonce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00033ms |
| p95 | 0.0043ms |
| p99 | 0.01ms |
| mean | 0.0029ms |
| stdev | 0.03ms |
| min | 0.00021ms |
| max | 0.39ms |
| total | 0.58ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.862)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00022ms | 0.00021ms | +0.0000076ms | +3.65% |
| p50 | 0.00029ms | 0.00021ms | +0.000078ms | +37.41% |
| p95 | 0.0037ms | 0.00071ms | +0.0030ms | +416.93% |
| p99 | 0.01ms | 0.0033ms | +0.0069ms | +212.97% |
| mean | 0.0025ms | 0.00034ms | +0.0022ms | +641.59% |
| min | 0.00018ms | 0.00017ms | +0.000013ms | +8.06% |
| max | 0.33ms | 0.0048ms | +0.33ms | +6816.03% |
| total | 0.50ms | 0.07ms | +0.43ms | +641.59% |

