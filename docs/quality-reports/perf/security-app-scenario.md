# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.04ms | 0.10ms | 30ms | 0.00041ms | PASS | improved — gate 無効 (regressionGate=false) |
| security_headers_validate_loop (20 build + validate) | 0.0021ms | 0.03ms | 50ms | 0.00041ms | PASS | stable (p10 +14% (閾値未満)、 p95 +98% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| production_hardening_flow (csp + security headers combined) | 0.0016ms | 0.0054ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | cpu | 0.08ms | 0.04ms | 0.506 | 0.656 | 0.04ms | 0.05ms |
| security_headers_validate_loop (20 build + validate) | cpu | 0.08ms | 0.0021ms | 0.026 | 0.023 | 0.0021ms | 0.0019ms |
| production_hardening_flow (csp + security headers combined) | cpu | 0.08ms | 0.0016ms | 0.020 | 0.021 | 0.0017ms | 0.0017ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.42ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.01ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -7328 B | 0 B | 102400 B | yes | PASS |
| security_headers_validate_loop (20 build + validate) | 952 B | 0 B | 102400 B | yes | PASS |
| production_hardening_flow (csp + security headers combined) | -296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.10ms |
| p99 | 0.20ms |
| mean | 0.06ms |
| stdev | 0.04ms |
| min | 0.04ms |
| max | 0.23ms |
| total | 1.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.01ms | -23.47% |
| p50 | 0.05ms | 0.05ms | -0.0036ms | -6.64% |
| p95 | 0.10ms | 0.10ms | +0.0037ms | +3.68% |
| p99 | 0.20ms | 0.20ms | -0.0042ms | -2.10% |
| mean | 0.06ms | 0.07ms | -0.0053ms | -7.94% |
| min | 0.04ms | 0.05ms | -0.01ms | -22.62% |
| max | 0.23ms | 0.24ms | -0.01ms | -4.44% |
| total | 1.86ms | 2.02ms | -0.16ms | -7.94% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0057ms |
| p95 | 0.03ms |
| p99 | 0.11ms |
| mean | 0.01ms |
| stdev | 0.03ms |
| min | 0.0020ms |
| max | 0.14ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0019ms | +0.00025ms | +13.14% |
| p50 | 0.0057ms | 0.0053ms | +0.00046ms | +8.65% |
| p95 | 0.03ms | 0.02ms | +0.02ms | +97.36% |
| p99 | 0.11ms | 0.03ms | +0.08ms | +278.21% |
| mean | 0.01ms | 0.0064ms | +0.0058ms | +90.92% |
| min | 0.0020ms | 0.0018ms | +0.00017ms | +9.32% |
| max | 0.14ms | 0.03ms | +0.11ms | +339.22% |
| total | 0.37ms | 0.19ms | +0.17ms | +90.92% |

### production_hardening_flow (csp + security headers combined)

# Perf Report — production_hardening_flow (csp + security headers combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0016ms |
| p50 | 0.0018ms |
| p95 | 0.0054ms |
| p99 | 0.02ms |
| mean | 0.0028ms |
| stdev | 0.0035ms |
| min | 0.0015ms |
| max | 0.02ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0017ms | -0.000083ms | -4.88% |
| p50 | 0.0018ms | 0.0018ms | -0.000042ms | -2.34% |
| p95 | 0.0054ms | 0.0058ms | -0.00035ms | -6.10% |
| p99 | 0.02ms | 0.02ms | +0.00057ms | +3.57% |
| mean | 0.0028ms | 0.0028ms | +0.000024ms | +0.85% |
| min | 0.0015ms | 0.0017ms | -0.00012ms | -7.44% |
| max | 0.02ms | 0.02ms | +0.0013ms | +6.86% |
| total | 0.08ms | 0.08ms | +0.00071ms | +0.85% |

