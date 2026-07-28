# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| mcpListTools | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +7216%) 以上の悪化が必要) |
| mcpCallEcho | 0.00ms | 10ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |
| mcpCallCalc | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +29994%) 以上の悪化が必要) |
| toolRegistryRegister | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +35131%) 以上の悪化が必要) |

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
| mcpListTools | -2696 B | 0 B | 102400 B | yes | PASS |
| mcpCallEcho | -664 B | 0 B | 102400 B | yes | PASS |
| mcpCallCalc | 616 B | 0 B | 102400 B | yes | PASS |
| toolRegistryRegister | 6776 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -51.26% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -62.06% |
| p99 | 0.01ms | 0.04ms | -0.03ms | -73.18% |
| mean | 0.00ms | 0.00ms | -0.00ms | -62.36% |
| min | 0.00ms | 0.00ms | -0.00ms | -63.93% |
| max | 0.01ms | 0.06ms | -0.05ms | -79.34% |
| total | 0.24ms | 0.63ms | -0.40ms | -62.36% |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -33.33% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -74.47% |
| p99 | 0.01ms | 0.02ms | -0.02ms | -78.51% |
| mean | 0.00ms | 0.00ms | -0.00ms | -55.85% |
| min | 0.00ms | 0.00ms | -0.00ms | -15.42% |
| max | 0.01ms | 0.07ms | -0.07ms | -88.17% |
| total | 0.25ms | 0.57ms | -0.32ms | -55.85% |

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
| max | 0.01ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.44% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +173.30% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.67% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.15% |
| max | 0.01ms | 0.01ms | +0.00ms | +49.28% |
| total | 0.31ms | 0.30ms | +0.01ms | +3.67% |

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
| max | 0.06ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +6.15% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -38.52% |
| p99 | 0.00ms | 0.01ms | -0.01ms | -70.66% |
| mean | 0.00ms | 0.00ms | -0.00ms | -18.34% |
| min | 0.00ms | 0.00ms | +0.00ms | +166.40% |
| max | 0.06ms | 0.08ms | -0.02ms | -27.58% |
| total | 0.22ms | 0.27ms | -0.05ms | -18.34% |

