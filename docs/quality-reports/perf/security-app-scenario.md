# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.04ms | 0.10ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| security_headers_validate_loop (20 build + validate) | 0.0057ms | 0.02ms | 50ms | 0.00042ms | PASS | stable (p10 +25% (閾値未満)、 p95 +44% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| production_hardening_flow (csp + security headers combined) | 0.0017ms | 0.0047ms | 30ms | 0.00042ms | PASS | stable (p10 +3% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.46ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.02ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -7296 B | 0 B | 102400 B | yes | PASS |
| security_headers_validate_loop (20 build + validate) | 920 B | 0 B | 102400 B | yes | PASS |
| production_hardening_flow (csp + security headers combined) | -424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.06ms |
| p95 | 0.10ms |
| p99 | 0.26ms |
| mean | 0.07ms |
| stdev | 0.05ms |
| min | 0.04ms |
| max | 0.33ms |
| total | 2.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0026ms | +6.67% |
| p50 | 0.06ms | 0.05ms | +0.0010ms | +1.85% |
| p95 | 0.10ms | 0.10ms | +0.0053ms | +5.38% |
| p99 | 0.26ms | 0.19ms | +0.07ms | +36.68% |
| mean | 0.07ms | 0.07ms | +0.0049ms | +7.32% |
| min | 0.04ms | 0.04ms | +0.00083ms | +2.16% |
| max | 0.33ms | 0.23ms | +0.10ms | +42.15% |
| total | 2.16ms | 2.01ms | +0.15ms | +7.32% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0057ms |
| p50 | 0.0066ms |
| p95 | 0.02ms |
| p99 | 0.08ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0056ms |
| max | 0.10ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0046ms | +0.0011ms | +24.52% |
| p50 | 0.0066ms | 0.0061ms | +0.00050ms | +8.16% |
| p95 | 0.02ms | 0.02ms | +0.0075ms | +44.31% |
| p99 | 0.08ms | 0.03ms | +0.05ms | +146.82% |
| mean | 0.01ms | 0.0077ms | +0.0034ms | +43.85% |
| min | 0.0056ms | 0.0045ms | +0.0011ms | +23.84% |
| max | 0.10ms | 0.04ms | +0.07ms | +172.79% |
| total | 0.33ms | 0.23ms | +0.10ms | +43.85% |

### production_hardening_flow (csp + security headers combined)

# Perf Report — production_hardening_flow (csp + security headers combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0019ms |
| p95 | 0.0047ms |
| p99 | 0.0063ms |
| mean | 0.0024ms |
| stdev | 0.0012ms |
| min | 0.0017ms |
| max | 0.0069ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0016ms | +0.000046ms | +2.84% |
| p50 | 0.0019ms | 0.0017ms | +0.00021ms | +12.24% |
| p95 | 0.0047ms | 0.0034ms | +0.0013ms | +37.33% |
| p99 | 0.0063ms | 0.0050ms | +0.0014ms | +27.26% |
| mean | 0.0024ms | 0.0021ms | +0.00038ms | +18.53% |
| min | 0.0017ms | 0.0016ms | +0.000083ms | +5.24% |
| max | 0.0069ms | 0.0056ms | +0.0013ms | +22.22% |
| total | 0.07ms | 0.06ms | +0.01ms | +18.53% |

