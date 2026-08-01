# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signAndVerifyJWT | 0.0069ms | 0.02ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |
| hashSha256 | 0.0027ms | 0.0088ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |
| aesGcmRoundtrip | 0.0068ms | 0.02ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| signAndVerifyJWT | cpu | 0.09ms | 0.10ms | 0.0069ms | 0.073 | 0.077 | n/a | 20.0% | 0.0060ms | 0.0062ms |
| hashSha256 | cpu | 0.09ms | 0.09ms | 0.0027ms | 0.028 | 0.029 | n/a | 20.0% | 0.0023ms | 0.0023ms |
| aesGcmRoundtrip | cpu | 0.09ms | 0.10ms | 0.0068ms | 0.072 | 0.074 | n/a | 20.0% | 0.0058ms | 0.0060ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.25ms | 10ms | PASS |
| hashSha256 | 0.05ms | 10ms | PASS |
| aesGcmRoundtrip | 0.79ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| signAndVerifyJWT | -34112 B | -55060 B | 102400 B | yes | 220 (20 + 200) | PASS |
| hashSha256 | -27952 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| aesGcmRoundtrip | -17992 B | -17592 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0069ms |
| p50 | 0.0085ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0097ms |
| stdev | 0.0041ms |
| min | 0.0065ms |
| max | 0.03ms |
| total | 1.95ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.861)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0062ms | -0.00025ms | -4.09% |
| p50 | 0.0073ms | 0.0074ms | -0.000093ms | -1.26% |
| p95 | 0.02ms | 0.02ms | +0.0010ms | +6.66% |
| p99 | 0.02ms | 0.02ms | -0.0019ms | -7.81% |
| mean | 0.0084ms | 0.0088ms | -0.00037ms | -4.22% |
| min | 0.0056ms | 0.0059ms | -0.00032ms | -5.42% |
| max | 0.03ms | 0.07ms | -0.05ms | -64.00% |
| total | 1.68ms | 1.75ms | -0.07ms | -4.22% |

### hashSha256

# Perf Report — hashSha256.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0088ms |
| p99 | 0.02ms |
| mean | 0.0038ms |
| stdev | 0.0035ms |
| min | 0.0025ms |
| max | 0.03ms |
| total | 0.76ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.865)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0023ms | -0.000026ms | -1.12% |
| p50 | 0.0025ms | 0.0025ms | -0.000091ms | -3.57% |
| p95 | 0.0076ms | 0.01ms | -0.0037ms | -32.81% |
| p99 | 0.02ms | 0.06ms | -0.04ms | -66.84% |
| mean | 0.0033ms | 0.0045ms | -0.0012ms | -27.09% |
| min | 0.0022ms | 0.0022ms | -0.000051ms | -2.28% |
| max | 0.03ms | 0.07ms | -0.04ms | -60.84% |
| total | 0.66ms | 0.90ms | -0.24ms | -27.09% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0068ms |
| p50 | 0.0074ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.03ms |
| min | 0.0065ms |
| max | 0.37ms |
| total | 2.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.854)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0060ms | -0.00016ms | -2.65% |
| p50 | 0.0063ms | 0.0066ms | -0.00025ms | -3.79% |
| p95 | 0.02ms | 0.02ms | -0.0042ms | -20.62% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -38.95% |
| mean | 0.01ms | 0.0090ms | +0.0011ms | +12.07% |
| min | 0.0056ms | 0.0056ms | -0.000031ms | -0.56% |
| max | 0.31ms | 0.08ms | +0.24ms | +298.49% |
| total | 2.01ms | 1.79ms | +0.22ms | +12.07% |

