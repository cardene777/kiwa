# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| mcpListTools | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +7216%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| mcpCallEcho | 0.00ms | 10ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| mcpCallCalc | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +29994%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| toolRegistryRegister | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +35131%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mcpListTools | 0.08ms | 20ms | PASS |
| mcpCallEcho | 0.02ms | 20ms | PASS |
| mcpCallCalc | 0.05ms | 20ms | PASS |
| toolRegistryRegister | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mcpListTools | -2776 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | 37888 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | 2544 B | 0 B | 102400 B | yes | PASS |
| toolRegistryRegister | -4504 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mcpListTools

# Perf Report — mcpListTools.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.03ms |
| min | 0.00ms |
| max | 0.46ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +23.08% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -29.75% |
| p99 | 0.02ms | 0.04ms | -0.01ms | -30.75% |
| mean | 0.00ms | 0.00ms | +0.00ms | +40.12% |
| min | 0.00ms | 0.00ms | -0.00ms | -58.33% |
| max | 0.46ms | 0.06ms | +0.40ms | +623.07% |
| total | 0.89ms | 0.63ms | +0.25ms | +40.12% |

### mcpCallEcho

# Perf Report — mcpCallEcho.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -27.80% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -70.73% |
| p99 | 0.01ms | 0.02ms | -0.02ms | -77.13% |
| mean | 0.00ms | 0.00ms | -0.00ms | -52.01% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.66% |
| max | 0.01ms | 0.07ms | -0.06ms | -86.70% |
| total | 0.27ms | 0.57ms | -0.29ms | -52.01% |

### mcpCallCalc

# Perf Report — mcpCallCalc.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.09% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.06% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +216.82% |
| mean | 0.00ms | 0.00ms | +0.00ms | +16.40% |
| min | 0.00ms | 0.00ms | +0.00ms | +6.23% |
| max | 0.02ms | 0.01ms | +0.01ms | +118.84% |
| total | 0.35ms | 0.30ms | +0.05ms | +16.40% |

### toolRegistryRegister

# Perf Report — toolRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -50.07% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -70.70% |
| p99 | 0.00ms | 0.01ms | -0.01ms | -74.96% |
| mean | 0.00ms | 0.00ms | -0.00ms | -68.96% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.40% |
| max | 0.00ms | 0.08ms | -0.07ms | -94.57% |
| total | 0.08ms | 0.27ms | -0.18ms | -68.96% |

