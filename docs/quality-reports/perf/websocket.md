# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| sendMessage | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +52192%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| broadcastMessage | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +91358%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| captureBinaryFrame | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +119589%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendMessage | -8984 B | 0 B | 102400 B | yes | PASS |
| broadcastMessage | 25992 B | 0 B | 102400 B | yes | PASS |
| captureBinaryFrame | 2656 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendMessage

# Perf Report — sendMessage.serial

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -17.11% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -66.03% |
| mean | 0.00ms | 0.00ms | -0.00ms | -17.91% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.17% |
| max | 0.01ms | 0.01ms | -0.00ms | -31.27% |
| total | 0.12ms | 0.14ms | -0.03ms | -17.91% |

### broadcastMessage

# Perf Report — broadcastMessage.serial

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -8.26% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +37.19% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.64% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +8.78% |
| total | 0.09ms | 0.09ms | +0.00ms | +0.64% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.01ms |
| stdev | 0.08ms |
| min | 0.00ms |
| max | 1.07ms |
| total | 1.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +22.09% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +40.88% |
| mean | 0.01ms | 0.00ms | +0.01ms | +1142.87% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.40% |
| max | 1.07ms | 0.01ms | +1.05ms | +8402.77% |
| total | 1.15ms | 0.09ms | +1.06ms | +1142.87% |

