# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.05ms | 0.11ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| security_headers_validate_loop (20 build + validate) | 0.0048ms | 0.02ms | 50ms | 0.00042ms | PASS | stable (p10 +6% (閾値未満)、 p95 +38% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| production_hardening_flow (csp + security headers combined) | 0.0017ms | 0.0048ms | 30ms | 0.00042ms | PASS | stable (p10 +3% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.42ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.01ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -7296 B | -9949 B | 102400 B | yes | PASS |
| security_headers_validate_loop (20 build + validate) | -72 B | 0 B | 102400 B | yes | PASS |
| production_hardening_flow (csp + security headers combined) | 232 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.11ms |
| p99 | 0.26ms |
| mean | 0.08ms |
| stdev | 0.05ms |
| min | 0.04ms |
| max | 0.31ms |
| total | 2.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.04ms | +0.010ms | +25.49% |
| p50 | 0.06ms | 0.05ms | +0.0030ms | +5.55% |
| p95 | 0.11ms | 0.10ms | +0.01ms | +12.86% |
| p99 | 0.26ms | 0.19ms | +0.07ms | +34.72% |
| mean | 0.08ms | 0.07ms | +0.0096ms | +14.24% |
| min | 0.04ms | 0.04ms | +0.0026ms | +6.80% |
| max | 0.31ms | 0.23ms | +0.08ms | +36.84% |
| total | 2.30ms | 2.01ms | +0.29ms | +14.24% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0048ms |
| p50 | 0.0065ms |
| p95 | 0.02ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0044ms |
| max | 0.09ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0048ms | 0.0046ms | +0.00026ms | +5.62% |
| p50 | 0.0065ms | 0.0061ms | +0.00033ms | +5.44% |
| p95 | 0.02ms | 0.02ms | +0.0064ms | +37.71% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +109.67% |
| mean | 0.01ms | 0.0077ms | +0.0027ms | +34.60% |
| min | 0.0044ms | 0.0045ms | -0.00013ms | -2.75% |
| max | 0.09ms | 0.04ms | +0.05ms | +126.33% |
| total | 0.31ms | 0.23ms | +0.08ms | +34.60% |

### production_hardening_flow (csp + security headers combined)

# Perf Report — production_hardening_flow (csp + security headers combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0017ms |
| p95 | 0.0048ms |
| p99 | 0.0086ms |
| mean | 0.0023ms |
| stdev | 0.0016ms |
| min | 0.0016ms |
| max | 0.0098ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0016ms | +0.000041ms | +2.53% |
| p50 | 0.0017ms | 0.0017ms | +0.0000010ms | +0.06% |
| p95 | 0.0048ms | 0.0034ms | +0.0014ms | +40.93% |
| p99 | 0.0086ms | 0.0050ms | +0.0037ms | +73.28% |
| mean | 0.0023ms | 0.0021ms | +0.00025ms | +12.37% |
| min | 0.0016ms | 0.0016ms | +0.000042ms | +2.65% |
| max | 0.0098ms | 0.0056ms | +0.0042ms | +74.83% |
| total | 0.07ms | 0.06ms | +0.0076ms | +12.37% |

