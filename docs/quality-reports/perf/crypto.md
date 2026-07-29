# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signAndVerifyJWT | 0.0059ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| hashSha256 | 0.0024ms | 0.0076ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| aesGcmRoundtrip | 0.0062ms | 0.02ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| signAndVerifyJWT | cpu | 0.08ms | 0.0059ms | 0.073 | 0.071 | 0.0059ms | 0.0057ms |
| hashSha256 | cpu | 0.08ms | 0.0024ms | 0.029 | 0.029 | 0.0024ms | 0.0024ms |
| aesGcmRoundtrip | cpu | 0.09ms | 0.0062ms | 0.071 | 0.075 | 0.0057ms | 0.0061ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.10ms | 10ms | PASS |
| hashSha256 | 0.04ms | 10ms | PASS |
| aesGcmRoundtrip | 0.15ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -29536 B | -55631 B | 102400 B | yes | PASS |
| hashSha256 | -28352 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | 10384 B | -24831 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0059ms |
| p50 | 0.0073ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0089ms |
| stdev | 0.0066ms |
| min | 0.0056ms |
| max | 0.08ms |
| total | 1.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0057ms | +0.00013ms | +2.17% |
| p50 | 0.0073ms | 0.0073ms | +0.000021ms | +0.29% |
| p95 | 0.02ms | 0.02ms | -0.0014ms | -7.48% |
| p99 | 0.03ms | 0.05ms | -0.01ms | -29.76% |
| mean | 0.0089ms | 0.0092ms | -0.00024ms | -2.65% |
| min | 0.0056ms | 0.0055ms | +0.000042ms | +0.76% |
| max | 0.08ms | 0.10ms | -0.02ms | -21.07% |
| total | 1.79ms | 1.84ms | -0.05ms | -2.65% |

### hashSha256

# Perf Report — hashSha256.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.0076ms |
| p99 | 0.02ms |
| mean | 0.0035ms |
| stdev | 0.0038ms |
| min | 0.0023ms |
| max | 0.04ms |
| total | 0.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | 0.00ms | 0.00% |
| p50 | 0.0025ms | 0.0026ms | -0.000084ms | -3.20% |
| p95 | 0.0076ms | 0.0065ms | +0.0012ms | +17.87% |
| p99 | 0.02ms | 0.02ms | +0.00098ms | +5.68% |
| mean | 0.0035ms | 0.0034ms | +0.00014ms | +4.01% |
| min | 0.0023ms | 0.0023ms | +0.0000010ms | +0.04% |
| max | 0.04ms | 0.04ms | +0.0053ms | +14.14% |
| total | 0.70ms | 0.68ms | +0.03ms | +4.01% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0062ms |
| p50 | 0.0065ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0080ms |
| stdev | 0.0039ms |
| min | 0.0059ms |
| max | 0.03ms |
| total | 1.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0061ms | +0.000084ms | +1.38% |
| p50 | 0.0065ms | 0.0067ms | -0.00021ms | -3.08% |
| p95 | 0.02ms | 0.02ms | +0.000064ms | +0.43% |
| p99 | 0.02ms | 0.03ms | -0.0022ms | -8.00% |
| mean | 0.0080ms | 0.0083ms | -0.00033ms | -3.97% |
| min | 0.0059ms | 0.0058ms | +0.000084ms | +1.44% |
| max | 0.03ms | 0.08ms | -0.05ms | -62.43% |
| total | 1.59ms | 1.66ms | -0.07ms | -3.97% |

