# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signAndVerifyJWT | 0.0064ms | 0.02ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| hashSha256 | 0.0023ms | 0.0058ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| aesGcmRoundtrip | 0.0062ms | 0.02ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| signAndVerifyJWT | cpu | 0.08ms | 0.09ms | 0.0064ms | 0.078 | 0.077 | 0.0063ms | 0.0062ms |
| hashSha256 | cpu | 0.08ms | 0.08ms | 0.0023ms | 0.028 | 0.029 | 0.0023ms | 0.0023ms |
| aesGcmRoundtrip | cpu | 0.08ms | 0.10ms | 0.0062ms | 0.075 | 0.074 | 0.0060ms | 0.0060ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.12ms | 10ms | PASS |
| hashSha256 | 0.04ms | 10ms | PASS |
| aesGcmRoundtrip | 0.11ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -28720 B | 0 B | 102400 B | yes | PASS |
| hashSha256 | -26624 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -17096 B | -30965 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0064ms |
| p50 | 0.0075ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.0099ms |
| min | 0.0057ms |
| max | 0.09ms |
| total | 2.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.990)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0063ms | 0.0062ms | +0.00010ms | +1.68% |
| p50 | 0.0074ms | 0.0074ms | +0.000011ms | +0.15% |
| p95 | 0.02ms | 0.02ms | +0.0065ms | +42.60% |
| p99 | 0.06ms | 0.02ms | +0.04ms | +156.71% |
| mean | 0.01ms | 0.0088ms | +0.0013ms | +15.28% |
| min | 0.0057ms | 0.0059ms | -0.00026ms | -4.45% |
| max | 0.09ms | 0.07ms | +0.02ms | +30.20% |
| total | 2.02ms | 1.75ms | +0.27ms | +15.28% |

### hashSha256

# Perf Report — hashSha256.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0025ms |
| p95 | 0.0058ms |
| p99 | 0.02ms |
| mean | 0.0033ms |
| stdev | 0.0041ms |
| min | 0.0022ms |
| max | 0.05ms |
| total | 0.66ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.995)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0023ms | -0.000054ms | -2.30% |
| p50 | 0.0024ms | 0.0025ms | -0.000097ms | -3.80% |
| p95 | 0.0057ms | 0.01ms | -0.0056ms | -49.32% |
| p99 | 0.02ms | 0.06ms | -0.04ms | -66.36% |
| mean | 0.0033ms | 0.0045ms | -0.0012ms | -27.13% |
| min | 0.0022ms | 0.0022ms | -0.000053ms | -2.37% |
| max | 0.05ms | 0.07ms | -0.02ms | -25.17% |
| total | 0.66ms | 0.90ms | -0.24ms | -27.13% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0062ms |
| p50 | 0.0071ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0088ms |
| stdev | 0.0064ms |
| min | 0.0058ms |
| max | 0.07ms |
| total | 1.75ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.970)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0060ms | +0.000063ms | +1.06% |
| p50 | 0.0068ms | 0.0066ms | +0.00027ms | +4.04% |
| p95 | 0.02ms | 0.02ms | -0.0052ms | -25.30% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -33.47% |
| mean | 0.0085ms | 0.0090ms | -0.00045ms | -5.03% |
| min | 0.0057ms | 0.0056ms | +0.000074ms | +1.33% |
| max | 0.07ms | 0.08ms | -0.0099ms | -12.56% |
| total | 1.70ms | 1.79ms | -0.09ms | -5.03% |

