# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.04ms | 0.34ms | 30ms | 0.00042ms | PASS | stable (p10 +8% (閾値未満)、 p95 +240% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| security_headers_validate_loop (20 build + validate) | 0.0070ms | 0.04ms | 50ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| production_hardening_flow (csp + security headers combined) | 0.0018ms | 0.0036ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.50ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.03ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -7280 B | 0 B | 102400 B | yes | PASS |
| security_headers_validate_loop (20 build + validate) | 5088 B | 0 B | 102400 B | yes | PASS |
| production_hardening_flow (csp + security headers combined) | 104 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.07ms |
| p95 | 0.34ms |
| p99 | 0.39ms |
| mean | 0.12ms |
| stdev | 0.10ms |
| min | 0.04ms |
| max | 0.40ms |
| total | 3.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0032ms | +8.06% |
| p50 | 0.07ms | 0.05ms | +0.01ms | +24.28% |
| p95 | 0.34ms | 0.10ms | +0.24ms | +240.04% |
| p99 | 0.39ms | 0.19ms | +0.20ms | +103.66% |
| mean | 0.12ms | 0.07ms | +0.05ms | +74.71% |
| min | 0.04ms | 0.04ms | +0.00017ms | +0.43% |
| max | 0.40ms | 0.23ms | +0.17ms | +76.08% |
| total | 3.52ms | 2.01ms | +1.50ms | +74.71% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0070ms |
| p50 | 0.0075ms |
| p95 | 0.04ms |
| p99 | 0.13ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.0068ms |
| max | 0.17ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0046ms | +0.0025ms | +53.51% |
| p50 | 0.0075ms | 0.0061ms | +0.0014ms | +22.11% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +115.61% |
| p99 | 0.13ms | 0.03ms | +0.10ms | +287.57% |
| mean | 0.02ms | 0.0077ms | +0.0077ms | +100.27% |
| min | 0.0068ms | 0.0045ms | +0.0023ms | +50.44% |
| max | 0.17ms | 0.04ms | +0.13ms | +338.62% |
| total | 0.46ms | 0.23ms | +0.23ms | +100.27% |

### production_hardening_flow (csp + security headers combined)

# Perf Report — production_hardening_flow (csp + security headers combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0018ms |
| p95 | 0.0036ms |
| p99 | 0.0057ms |
| mean | 0.0022ms |
| stdev | 0.00097ms |
| min | 0.0017ms |
| max | 0.0065ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0016ms | +0.00013ms | +7.96% |
| p50 | 0.0018ms | 0.0017ms | +0.00012ms | +7.32% |
| p95 | 0.0036ms | 0.0034ms | +0.00024ms | +6.92% |
| p99 | 0.0057ms | 0.0050ms | +0.00068ms | +13.57% |
| mean | 0.0022ms | 0.0021ms | +0.00015ms | +7.50% |
| min | 0.0017ms | 0.0016ms | +0.00013ms | +7.90% |
| max | 0.0065ms | 0.0056ms | +0.00083ms | +14.83% |
| total | 0.07ms | 0.06ms | +0.0046ms | +7.50% |

