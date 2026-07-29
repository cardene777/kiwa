# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.04ms | 0.12ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| security_headers_validate_loop (20 build + validate) | 0.0046ms | 0.02ms | 50ms | 0.00042ms | PASS | stable (p10 0% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| production_hardening_flow (csp + security headers combined) | 0.0017ms | 0.0034ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.39ms | 60ms | PASS |
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
| p50 | 0.05ms |
| p95 | 0.12ms |
| p99 | 0.23ms |
| mean | 0.07ms |
| stdev | 0.05ms |
| min | 0.04ms |
| max | 0.27ms |
| total | 2.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.00034ms | -0.87% |
| p50 | 0.05ms | 0.05ms | -0.0019ms | -3.58% |
| p95 | 0.12ms | 0.10ms | +0.02ms | +18.10% |
| p99 | 0.23ms | 0.19ms | +0.04ms | +18.83% |
| mean | 0.07ms | 0.07ms | +0.0025ms | +3.79% |
| min | 0.04ms | 0.04ms | -0.00013ms | -0.32% |
| max | 0.27ms | 0.23ms | +0.04ms | +18.39% |
| total | 2.09ms | 2.01ms | +0.08ms | +3.79% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0046ms |
| p50 | 0.0064ms |
| p95 | 0.02ms |
| p99 | 0.10ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0045ms |
| max | 0.13ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0046ms | 0.00ms | 0.00% |
| p50 | 0.0064ms | 0.0061ms | +0.00025ms | +4.08% |
| p95 | 0.02ms | 0.02ms | +0.0048ms | +28.50% |
| p99 | 0.10ms | 0.03ms | +0.07ms | +200.32% |
| mean | 0.01ms | 0.0077ms | +0.0037ms | +48.37% |
| min | 0.0045ms | 0.0045ms | -0.000084ms | -1.85% |
| max | 0.13ms | 0.04ms | +0.09ms | +243.37% |
| total | 0.34ms | 0.23ms | +0.11ms | +48.37% |

### production_hardening_flow (csp + security headers combined)

# Perf Report — production_hardening_flow (csp + security headers combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0017ms |
| p95 | 0.0034ms |
| p99 | 0.0057ms |
| mean | 0.0021ms |
| stdev | 0.0010ms |
| min | 0.0016ms |
| max | 0.0067ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0016ms | +0.000045ms | +2.78% |
| p50 | 0.0017ms | 0.0017ms | -0.000041ms | -2.40% |
| p95 | 0.0034ms | 0.0034ms | +0.000041ms | +1.22% |
| p99 | 0.0057ms | 0.0050ms | +0.00075ms | +15.08% |
| mean | 0.0021ms | 0.0021ms | -0.0000039ms | -0.19% |
| min | 0.0016ms | 0.0016ms | +0.000042ms | +2.65% |
| max | 0.0067ms | 0.0056ms | +0.0010ms | +18.52% |
| total | 0.06ms | 0.06ms | -0.00012ms | -0.19% |

