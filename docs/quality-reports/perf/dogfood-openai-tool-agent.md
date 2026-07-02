# Perf Suite — dogfood-openai-tool-agent

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| validateToolSchemas | 36.40ms | FAIL | stable | perf.p95Ms |
| runToolLoop | 30.54ms | PASS | stable | none |
| runParallelToolCall | 15.31ms | PASS | stable | none |

## validateToolSchemas

# Perf Report — validateToolSchemas

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 35.85ms |
| p95 | 36.40ms |
| p99 | 36.65ms |
| mean | 35.43ms |
| stdev | 1.04ms |
| min | 31.68ms |
| max | 36.85ms |
| total | 3543.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 35.85ms | 35.55ms | +0.30ms | +0.85% |
| p95 | 36.40ms | 36.38ms | +0.02ms | +0.05% |
| p99 | 36.65ms | 36.46ms | +0.19ms | +0.52% |
| mean | 35.43ms | 35.28ms | +0.15ms | +0.43% |
| min | 31.68ms | 31.24ms | +0.44ms | +1.40% |
| max | 36.85ms | 36.47ms | +0.38ms | +1.04% |
| total | 3543.31ms | 3528.09ms | +15.22ms | +0.43% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 31.68-32.20 | 1 | # |
| 2 | 32.20-32.71 | 1 | # |
| 3 | 32.71-33.23 | 1 | # |
| 4 | 33.23-33.75 | 5 | # |
| 5 | 33.75-34.26 | 7 | ## |
| 6 | 34.26-34.78 | 8 | ## |
| 7 | 34.78-35.30 | 15 | #### |
| 8 | 35.30-35.82 | 11 | ### |
| 9 | 35.82-36.33 | 41 | ########## |
| 10 | 36.33-36.85 | 10 | ## |

## runToolLoop

# Perf Report — runToolLoop

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 29.51ms |
| p95 | 30.54ms |
| p99 | 30.68ms |
| mean | 29.44ms |
| stdev | 0.95ms |
| min | 27.36ms |
| max | 30.68ms |
| total | 883.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 29.51ms | 30.22ms | -0.71ms | -2.36% |
| p95 | 30.54ms | 30.63ms | -0.10ms | -0.31% |
| p99 | 30.68ms | 30.88ms | -0.20ms | -0.65% |
| mean | 29.44ms | 29.83ms | -0.39ms | -1.31% |
| min | 27.36ms | 28.20ms | -0.85ms | -3.00% |
| max | 30.68ms | 30.88ms | -0.20ms | -0.65% |
| total | 883.26ms | 895.03ms | -11.77ms | -1.31% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 27.36-27.69 | 2 | ### |
| 2 | 27.69-28.02 | 1 | # |
| 3 | 28.02-28.35 | 3 | #### |
| 4 | 28.35-28.69 | 0 |  |
| 5 | 28.69-29.02 | 2 | ### |
| 6 | 29.02-29.35 | 5 | ###### |
| 7 | 29.35-29.68 | 4 | ##### |
| 8 | 29.68-30.02 | 2 | ### |
| 9 | 30.02-30.35 | 3 | #### |
| 10 | 30.35-30.68 | 8 | ########## |

## runParallelToolCall

# Perf Report — runParallelToolCall

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 14.84ms |
| p95 | 15.31ms |
| p99 | 15.35ms |
| mean | 14.69ms |
| stdev | 0.63ms |
| min | 13.15ms |
| max | 15.35ms |
| total | 440.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 14.84ms | 15.11ms | -0.27ms | -1.78% |
| p95 | 15.31ms | 15.30ms | +0.01ms | +0.06% |
| p99 | 15.35ms | 16.35ms | -1.00ms | -6.12% |
| mean | 14.69ms | 14.79ms | -0.10ms | -0.66% |
| min | 13.15ms | 12.77ms | +0.38ms | +2.95% |
| max | 15.35ms | 16.35ms | -1.00ms | -6.12% |
| total | 440.64ms | 443.56ms | -2.92ms | -0.66% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 13.15-13.37 | 1 | # |
| 2 | 13.37-13.59 | 0 |  |
| 3 | 13.59-13.81 | 3 | ### |
| 4 | 13.81-14.03 | 1 | # |
| 5 | 14.03-14.25 | 2 | ## |
| 6 | 14.25-14.47 | 4 | ### |
| 7 | 14.47-14.69 | 1 | # |
| 8 | 14.69-14.91 | 4 | ### |
| 9 | 14.91-15.13 | 2 | ## |
| 10 | 15.13-15.35 | 12 | ########## |

