# Perf Suite — dogfood-ably-collab-cursor

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| joinBoard | 0.01ms | 50ms | PASS | stable |
| moveCursor | 10.37ms | 100ms | PASS | stable |
| rewindHistory | 0.01ms | 30ms | PASS | improved |
| getPresence | 0.00ms | 30ms | PASS | improved |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinBoard | 0.03ms | 100ms | PASS |
| moveCursor | 10.53ms | 200ms | PASS |
| rewindHistory | 0.01ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| joinBoard | 872504 B | 0 B | 102400 B | PASS |
| moveCursor | -3741096 B | 0 B | 102400 B | PASS |
| rewindHistory | 651384 B | 0 B | 102400 B | PASS |
| getPresence | 223808 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### joinBoard

# Perf Report — joinBoard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.76% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +13.14% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +20.00% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.65% |
| min | 0.00ms | 0.00ms | +0.00ms | +17.57% |
| max | 0.02ms | 0.02ms | +0.00ms | +20.00% |
| total | 0.14ms | 0.13ms | +0.01ms | +7.65% |

### moveCursor

# Perf Report — moveCursor.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 10.29ms |
| p95 | 10.37ms |
| p99 | 10.46ms |
| mean | 10.17ms |
| stdev | 0.35ms |
| min | 9.11ms |
| max | 10.46ms |
| total | 406.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 10.29ms | 10.39ms | -0.11ms | -1.04% |
| p95 | 10.37ms | 11.34ms | -0.97ms | -8.55% |
| p99 | 10.46ms | 11.81ms | -1.34ms | -11.37% |
| mean | 10.17ms | 10.47ms | -0.30ms | -2.90% |
| min | 9.11ms | 9.23ms | -0.12ms | -1.27% |
| max | 10.46ms | 11.81ms | -1.34ms | -11.37% |
| total | 406.75ms | 418.89ms | -12.14ms | -2.90% |

### rewindHistory

# Perf Report — rewindHistory.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -62.50% |
| p95 | 0.01ms | 0.04ms | -0.03ms | -76.63% |
| p99 | 0.02ms | 0.13ms | -0.11ms | -83.48% |
| mean | 0.00ms | 0.01ms | -0.01ms | -80.82% |
| min | 0.00ms | 0.00ms | -0.00ms | -51.01% |
| max | 0.02ms | 0.13ms | -0.11ms | -83.48% |
| total | 0.09ms | 0.48ms | -0.39ms | -80.82% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -62.10% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -64.28% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -62.64% |
| mean | 0.00ms | 0.00ms | -0.00ms | -64.13% |
| min | 0.00ms | 0.00ms | -0.00ms | -62.89% |
| max | 0.01ms | 0.02ms | -0.01ms | -62.64% |
| total | 0.04ms | 0.12ms | -0.08ms | -64.13% |

