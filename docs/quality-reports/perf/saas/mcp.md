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
| mcpListTools | 0.01ms | 20ms | PASS |
| mcpCallEcho | 0.02ms | 20ms | PASS |
| mcpCallCalc | 0.02ms | 20ms | PASS |
| toolRegistryRegister | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mcpListTools | -4336 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | 23560 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | 2464 B | 0 B | 102400 B | yes | PASS |
| toolRegistryRegister | 912 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -1.44% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +33.44% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.67% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.00ms | +35.55% |
| total | 0.21ms | 0.21ms | +0.00ms | +1.67% |

### mcpCallEcho

# Perf Report — mcpCallEcho.serial

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
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.15% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -34.48% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -39.92% |
| mean | 0.00ms | 0.00ms | -0.00ms | -23.51% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.04ms | -0.03ms | -80.83% |
| total | 0.24ms | 0.32ms | -0.07ms | -23.51% |

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
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.34% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +274.50% |
| mean | 0.00ms | 0.00ms | +0.00ms | +35.94% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.23% |
| max | 0.09ms | 0.01ms | +0.08ms | +858.23% |
| total | 0.41ms | 0.30ms | +0.11ms | +35.94% |

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +3.20% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.53% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +10.59% |
| total | 0.07ms | 0.07ms | +0.00ms | +1.53% |

