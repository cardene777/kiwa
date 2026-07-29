# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.05ms | 0.24ms | 30ms | 0.00050ms | PASS | stable (p10 +26% (閾値未満)、 p95 +143% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| security_headers_validate_loop (20 build + validate) | 0.0061ms | 0.04ms | 50ms | 0.00050ms | PASS | stable (p10 +32% (閾値未満)、 p95 +157% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| production_hardening_flow (csp + security headers combined) | 0.0016ms | 0.0049ms | 30ms | 0.00050ms | PASS | stable (p10 -2% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 1.36ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.03ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -7296 B | 0 B | 102400 B | yes | PASS |
| security_headers_validate_loop (20 build + validate) | 5240 B | 0 B | 102400 B | yes | PASS |
| production_hardening_flow (csp + security headers combined) | -424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.24ms |
| p99 | 0.41ms |
| mean | 0.09ms |
| stdev | 0.08ms |
| min | 0.04ms |
| max | 0.44ms |
| total | 2.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.04ms | +0.01ms | +25.75% |
| p50 | 0.06ms | 0.05ms | +0.0023ms | +4.24% |
| p95 | 0.24ms | 0.10ms | +0.14ms | +142.88% |
| p99 | 0.41ms | 0.19ms | +0.21ms | +111.56% |
| mean | 0.09ms | 0.07ms | +0.02ms | +34.38% |
| min | 0.04ms | 0.04ms | +0.00088ms | +2.27% |
| max | 0.44ms | 0.23ms | +0.21ms | +93.20% |
| total | 2.71ms | 2.01ms | +0.69ms | +34.38% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0061ms |
| p50 | 0.0063ms |
| p95 | 0.04ms |
| p99 | 0.19ms |
| mean | 0.02ms |
| stdev | 0.05ms |
| min | 0.0050ms |
| max | 0.25ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0046ms | +0.0015ms | +32.08% |
| p50 | 0.0063ms | 0.0061ms | +0.00017ms | +2.73% |
| p95 | 0.04ms | 0.02ms | +0.03ms | +156.70% |
| p99 | 0.19ms | 0.03ms | +0.16ms | +489.02% |
| mean | 0.02ms | 0.0077ms | +0.0096ms | +124.81% |
| min | 0.0050ms | 0.0045ms | +0.00042ms | +9.16% |
| max | 0.25ms | 0.04ms | +0.21ms | +561.74% |
| total | 0.52ms | 0.23ms | +0.29ms | +124.81% |

### production_hardening_flow (csp + security headers combined)

# Perf Report — production_hardening_flow (csp + security headers combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0016ms |
| p50 | 0.0017ms |
| p95 | 0.0049ms |
| p99 | 0.0079ms |
| mean | 0.0022ms |
| stdev | 0.0015ms |
| min | 0.0015ms |
| max | 0.0087ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0016ms | -0.000038ms | -2.34% |
| p50 | 0.0017ms | 0.0017ms | -0.000042ms | -2.43% |
| p95 | 0.0049ms | 0.0034ms | +0.0015ms | +42.73% |
| p99 | 0.0079ms | 0.0050ms | +0.0029ms | +59.08% |
| mean | 0.0022ms | 0.0021ms | +0.00019ms | +9.20% |
| min | 0.0015ms | 0.0016ms | -0.000041ms | -2.59% |
| max | 0.0087ms | 0.0056ms | +0.0030ms | +54.08% |
| total | 0.07ms | 0.06ms | +0.0057ms | +9.20% |

