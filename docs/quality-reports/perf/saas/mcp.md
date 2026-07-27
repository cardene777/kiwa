# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| mcpListTools | 0.00ms | 10ms | PASS | stable |
| mcpCallEcho | 0.00ms | 10ms | PASS | stable |
| mcpCallCalc | 0.00ms | 10ms | PASS | stable |
| toolRegistryRegister | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mcpListTools | 0.02ms | 20ms | PASS |
| mcpCallEcho | 0.02ms | 20ms | PASS |
| mcpCallCalc | 0.03ms | 20ms | PASS |
| toolRegistryRegister | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mcpListTools | 12952 B | -59772 B | 102400 B | yes | PASS |
| mcpCallEcho | -400 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | 2592 B | 0 B | 102400 B | yes | PASS |
| toolRegistryRegister | 3440 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mcpListTools

# Perf Report — mcpListTools.serial

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +22.27% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +3.73% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +42.66% |
| mean | 0.00ms | 0.00ms | +0.00ms | +18.29% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.41% |
| max | 0.01ms | 0.01ms | +0.00ms | +3.64% |
| total | 0.24ms | 0.21ms | +0.04ms | +18.29% |

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
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +45.90% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.89% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -34.32% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.76% |
| min | 0.00ms | 0.00ms | +0.00ms | +50.11% |
| max | 0.01ms | 0.04ms | -0.03ms | -75.33% |
| total | 0.33ms | 0.32ms | +0.01ms | +3.76% |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.09ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +21.16% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +27.08% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +53.95% |
| mean | 0.00ms | 0.00ms | +0.00ms | +47.09% |
| min | 0.00ms | 0.00ms | +0.00ms | +18.75% |
| max | 0.09ms | 0.01ms | +0.08ms | +812.66% |
| total | 0.44ms | 0.30ms | +0.14ms | +47.09% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +14.38% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +25.48% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +26.91% |
| mean | 0.00ms | 0.00ms | +0.00ms | +19.03% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.80% |
| max | 0.00ms | 0.00ms | +0.00ms | +18.86% |
| total | 0.08ms | 0.07ms | +0.01ms | +19.03% |

