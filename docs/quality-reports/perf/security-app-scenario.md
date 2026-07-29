# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.04ms | 0.11ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| security_headers_validate_loop (20 build + validate) | 0.0052ms | 0.04ms | 50ms | 0.00049ms | PASS | stable (p10 +13% (閾値未満)、 p95 +156% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| production_hardening_flow (csp + security headers combined) | 0.0018ms | 0.0038ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.67ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.02ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -6672 B | 0 B | 102400 B | yes | PASS |
| security_headers_validate_loop (20 build + validate) | 424 B | 0 B | 102400 B | yes | PASS |
| production_hardening_flow (csp + security headers combined) | 232 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.09ms |
| p95 | 0.11ms |
| p99 | 0.26ms |
| mean | 0.08ms |
| stdev | 0.05ms |
| min | 0.04ms |
| max | 0.32ms |
| total | 2.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0038ms | +9.59% |
| p50 | 0.09ms | 0.05ms | +0.03ms | +58.73% |
| p95 | 0.11ms | 0.10ms | +0.0058ms | +5.81% |
| p99 | 0.26ms | 0.19ms | +0.07ms | +35.93% |
| mean | 0.08ms | 0.07ms | +0.01ms | +19.35% |
| min | 0.04ms | 0.04ms | +0.0036ms | +9.29% |
| max | 0.32ms | 0.23ms | +0.09ms | +40.88% |
| total | 2.40ms | 2.01ms | +0.39ms | +19.35% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0052ms |
| p50 | 0.0068ms |
| p95 | 0.04ms |
| p99 | 0.11ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0050ms |
| max | 0.13ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0046ms | +0.00057ms | +12.52% |
| p50 | 0.0068ms | 0.0061ms | +0.00065ms | +10.55% |
| p95 | 0.04ms | 0.02ms | +0.03ms | +156.37% |
| p99 | 0.11ms | 0.03ms | +0.08ms | +237.73% |
| mean | 0.01ms | 0.0077ms | +0.0057ms | +74.67% |
| min | 0.0050ms | 0.0045ms | +0.00050ms | +11.01% |
| max | 0.13ms | 0.04ms | +0.10ms | +257.75% |
| total | 0.40ms | 0.23ms | +0.17ms | +74.67% |

### production_hardening_flow (csp + security headers combined)

# Perf Report — production_hardening_flow (csp + security headers combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0018ms |
| p95 | 0.0038ms |
| p99 | 0.01ms |
| mean | 0.0025ms |
| stdev | 0.0022ms |
| min | 0.0017ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0016ms | +0.00013ms | +7.96% |
| p50 | 0.0018ms | 0.0017ms | +0.00012ms | +7.32% |
| p95 | 0.0038ms | 0.0034ms | +0.00036ms | +10.60% |
| p99 | 0.01ms | 0.0050ms | +0.0059ms | +118.15% |
| mean | 0.0025ms | 0.0021ms | +0.00042ms | +20.21% |
| min | 0.0017ms | 0.0016ms | +0.00013ms | +7.90% |
| max | 0.01ms | 0.0056ms | +0.0081ms | +144.44% |
| total | 0.07ms | 0.06ms | +0.01ms | +20.21% |

