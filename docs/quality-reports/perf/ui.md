# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.38ms | 30ms | PASS | stable |
| setupComponentEnvRender | 0.36ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 2.04ms | 60ms | PASS |
| setupComponentEnvRender | 0.58ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 65776 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | 67352 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.22ms |
| p95 | 0.38ms |
| p99 | 0.52ms |
| mean | 0.24ms |
| stdev | 0.08ms |
| min | 0.17ms |
| max | 0.53ms |
| total | 12.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.22ms | 0.22ms | -0.00ms | -1.29% |
| p95 | 0.38ms | 0.45ms | -0.07ms | -15.83% |
| p99 | 0.52ms | 0.54ms | -0.02ms | -3.10% |
| mean | 0.24ms | 0.25ms | -0.01ms | -2.32% |
| min | 0.17ms | 0.17ms | -0.01ms | -3.63% |
| max | 0.53ms | 0.54ms | -0.02ms | -3.08% |
| total | 12.05ms | 12.34ms | -0.29ms | -2.32% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.17ms |
| p95 | 0.36ms |
| p99 | 0.71ms |
| mean | 0.21ms |
| stdev | 0.12ms |
| min | 0.14ms |
| max | 0.84ms |
| total | 10.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.17ms | 0.18ms | -0.02ms | -8.64% |
| p95 | 0.36ms | 0.30ms | +0.06ms | +21.63% |
| p99 | 0.71ms | 0.73ms | -0.02ms | -2.27% |
| mean | 0.21ms | 0.21ms | -0.00ms | -0.94% |
| min | 0.14ms | 0.16ms | -0.01ms | -9.09% |
| max | 0.84ms | 1.07ms | -0.23ms | -21.49% |
| total | 10.29ms | 10.39ms | -0.10ms | -0.94% |

