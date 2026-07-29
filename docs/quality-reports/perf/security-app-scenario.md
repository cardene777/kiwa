# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.04ms | 0.13ms | 30ms | 0.00042ms | PASS | stable (p10 -1% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| security_headers_validate_loop (20 build + validate) | 0.0063ms | 0.03ms | 50ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| production_hardening_flow (csp + security headers combined) | 0.0016ms | 0.0034ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.52ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.02ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -7296 B | 0 B | 102400 B | yes | PASS |
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
| p50 | 0.06ms |
| p95 | 0.13ms |
| p99 | 0.28ms |
| mean | 0.08ms |
| stdev | 0.05ms |
| min | 0.04ms |
| max | 0.33ms |
| total | 2.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.00041ms | -1.04% |
| p50 | 0.06ms | 0.05ms | +0.0039ms | +7.21% |
| p95 | 0.13ms | 0.10ms | +0.03ms | +33.75% |
| p99 | 0.28ms | 0.19ms | +0.09ms | +47.51% |
| mean | 0.08ms | 0.07ms | +0.0089ms | +13.33% |
| min | 0.04ms | 0.04ms | -0.00025ms | -0.65% |
| max | 0.33ms | 0.23ms | +0.10ms | +45.64% |
| total | 2.28ms | 2.01ms | +0.27ms | +13.33% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0063ms |
| p50 | 0.0072ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0059ms |
| max | 0.10ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0063ms | 0.0046ms | +0.0017ms | +36.79% |
| p50 | 0.0072ms | 0.0061ms | +0.0011ms | +18.03% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +68.28% |
| p99 | 0.08ms | 0.03ms | +0.05ms | +142.66% |
| mean | 0.01ms | 0.0077ms | +0.0048ms | +62.31% |
| min | 0.0059ms | 0.0045ms | +0.0013ms | +29.35% |
| max | 0.10ms | 0.04ms | +0.06ms | +165.38% |
| total | 0.37ms | 0.23ms | +0.14ms | +62.31% |

### production_hardening_flow (csp + security headers combined)

# Perf Report — production_hardening_flow (csp + security headers combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0016ms |
| p50 | 0.0016ms |
| p95 | 0.0034ms |
| p99 | 0.0055ms |
| mean | 0.0020ms |
| stdev | 0.00096ms |
| min | 0.0015ms |
| max | 0.0063ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0016ms | -0.000038ms | -2.34% |
| p50 | 0.0016ms | 0.0017ms | -0.000083ms | -4.86% |
| p95 | 0.0034ms | 0.0034ms | +0.000041ms | +1.22% |
| p99 | 0.0055ms | 0.0050ms | +0.00048ms | +9.72% |
| mean | 0.0020ms | 0.0021ms | -0.000053ms | -2.56% |
| min | 0.0015ms | 0.0016ms | -0.000041ms | -2.59% |
| max | 0.0063ms | 0.0056ms | +0.00067ms | +11.84% |
| total | 0.06ms | 0.06ms | -0.0016ms | -2.56% |

