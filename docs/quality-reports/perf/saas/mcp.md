# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

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
| mcpCallCalc | 0.02ms | 20ms | PASS |
| toolRegistryRegister | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mcpListTools | -5096 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | -384 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | -15304 B | 0 B | 102400 B | yes | PASS |
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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.07% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -5.92% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +17.22% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.81% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.24% |
| max | 0.02ms | 0.01ms | +0.00ms | +36.16% |
| total | 0.23ms | 0.21ms | +0.02ms | +10.81% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -17.00% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -22.81% |
| mean | 0.00ms | 0.00ms | -0.00ms | -15.81% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| max | 0.01ms | 0.04ms | -0.03ms | -77.88% |
| total | 0.27ms | 0.32ms | -0.05ms | -15.81% |

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
| max | 0.08ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.05% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +14.98% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +180.50% |
| mean | 0.00ms | 0.00ms | +0.00ms | +33.02% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.15% |
| max | 0.08ms | 0.01ms | +0.07ms | +731.22% |
| total | 0.40ms | 0.30ms | +0.10ms | +33.02% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.28% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +0.30% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.54% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +8.27% |
| total | 0.07ms | 0.07ms | +0.00ms | +5.54% |

