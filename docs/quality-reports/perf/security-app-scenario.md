# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.06ms | 0.11ms | 30ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |
| security_headers_validate_loop (20 build + validate) | 0.0022ms | 0.03ms | 50ms | 0.00038ms | PASS | stable (換算後 p10 -9% (閾値未満)、 p95 +91% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| production_hardening_flow (csp + security headers combined) | 0.0018ms | 0.01ms | 30ms | 0.00038ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +267% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | cpu | 0.09ms | 0.11ms | 0.06ms | 0.655 | 0.625 | 0.05ms | 0.05ms |
| security_headers_validate_loop (20 build + validate) | cpu | 0.09ms | 0.10ms | 0.0022ms | 0.025 | 0.027 | 0.0020ms | 0.0022ms |
| production_hardening_flow (csp + security headers combined) | cpu | 0.09ms | 0.10ms | 0.0018ms | 0.020 | 0.020 | 0.0017ms | 0.0016ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.48ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.01ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -7328 B | 0 B | 102400 B | yes | PASS |
| security_headers_validate_loop (20 build + validate) | 456 B | 0 B | 102400 B | yes | PASS |
| production_hardening_flow (csp + security headers combined) | 264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.11ms |
| p99 | 0.28ms |
| mean | 0.08ms |
| stdev | 0.05ms |
| min | 0.05ms |
| max | 0.35ms |
| total | 2.44ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.913)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0024ms | +4.75% |
| p50 | 0.06ms | 0.06ms | +0.0030ms | +5.26% |
| p95 | 0.10ms | 0.09ms | +0.0053ms | +5.79% |
| p99 | 0.25ms | 0.25ms | +0.0044ms | +1.76% |
| mean | 0.07ms | 0.07ms | +0.0055ms | +7.96% |
| min | 0.05ms | 0.04ms | +0.01ms | +26.99% |
| max | 0.32ms | 0.31ms | +0.0059ms | +1.89% |
| total | 2.23ms | 2.07ms | +0.16ms | +7.96% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0064ms |
| p95 | 0.03ms |
| p99 | 0.11ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0020ms |
| max | 0.14ms |
| total | 0.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.898)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0022ms | -0.00020ms | -9.13% |
| p50 | 0.0057ms | 0.0053ms | +0.00041ms | +7.76% |
| p95 | 0.03ms | 0.01ms | +0.01ms | +91.00% |
| p99 | 0.10ms | 0.02ms | +0.08ms | +385.02% |
| mean | 0.01ms | 0.0061ms | +0.0043ms | +70.07% |
| min | 0.0018ms | 0.0019ms | -0.000041ms | -2.20% |
| max | 0.12ms | 0.02ms | +0.10ms | +467.13% |
| total | 0.31ms | 0.18ms | +0.13ms | +70.07% |

### production_hardening_flow (csp + security headers combined)

# Perf Report — production_hardening_flow (csp + security headers combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0030ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0047ms |
| stdev | 0.0071ms |
| min | 0.0018ms |
| max | 0.04ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.907)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0016ms | +0.000039ms | +2.41% |
| p50 | 0.0027ms | 0.0017ms | +0.0010ms | +59.26% |
| p95 | 0.01ms | 0.0030ms | +0.0081ms | +267.30% |
| p99 | 0.03ms | 0.0050ms | +0.02ms | +490.59% |
| mean | 0.0043ms | 0.0020ms | +0.0023ms | +114.52% |
| min | 0.0016ms | 0.0016ms | +0.000042ms | +2.66% |
| max | 0.04ms | 0.0057ms | +0.03ms | +522.53% |
| total | 0.13ms | 0.06ms | +0.07ms | +114.52% |

