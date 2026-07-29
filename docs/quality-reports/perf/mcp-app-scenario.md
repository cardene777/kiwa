# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +1351%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| schema_validate_loop (50 validateSchema) | 0.33ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +2092%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| server_lifecycle (register + unregister × 10 cycle) | 0.00ms | 30ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.10ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.03ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 1104 B | -596 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | -7600 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 10296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### tool_registration_burst (server + 20 register)

# Perf Report — tool_registration_burst (server + 20 register).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.01ms | -56.43% |
| p95 | 0.01ms | 0.04ms | -0.02ms | -62.73% |
| p99 | 0.02ms | 0.07ms | -0.04ms | -65.45% |
| mean | 0.01ms | 0.01ms | -0.01ms | -59.44% |
| min | 0.00ms | 0.01ms | -0.00ms | -58.08% |
| max | 0.02ms | 0.08ms | -0.05ms | -67.14% |
| total | 0.17ms | 0.41ms | -0.25ms | -59.44% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.33ms |
| p99 | 0.68ms |
| mean | 0.05ms |
| stdev | 0.16ms |
| min | 0.01ms |
| max | 0.73ms |
| total | 1.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -60.35% |
| p95 | 0.33ms | 0.02ms | +0.30ms | +1267.67% |
| p99 | 0.68ms | 0.03ms | +0.66ms | +2506.70% |
| mean | 0.05ms | 0.02ms | +0.03ms | +158.47% |
| min | 0.01ms | 0.02ms | -0.01ms | -62.06% |
| max | 0.73ms | 0.03ms | +0.70ms | +2599.01% |
| total | 1.63ms | 0.63ms | +1.00ms | +158.47% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
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
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.21% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +70.71% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +54.30% |
| mean | 0.00ms | 0.00ms | +0.00ms | +28.06% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.40% |
| max | 0.00ms | 0.00ms | +0.00ms | +50.02% |
| total | 0.08ms | 0.06ms | +0.02ms | +28.06% |

