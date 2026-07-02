# Perf Suite — dogfood-openai-tool-agent

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| validateToolSchemas | 33.65ms | PASS | n/a | none |
| runToolLoop | 29.89ms | PASS | n/a | none |
| runParallelToolCall | 15.24ms | PASS | n/a | none |

## validateToolSchemas

# Perf Report — validateToolSchemas

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 33.17ms |
| p95 | 33.65ms |
| p99 | 36.53ms |
| mean | 33.28ms |
| stdev | 1.82ms |
| min | 31.56ms |
| max | 50.41ms |
| total | 3327.83ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 31.56-33.45 | 85 | ########## |
| 2 | 33.45-35.33 | 13 | ## |
| 3 | 35.33-37.22 | 1 | # |
| 4 | 37.22-39.10 | 0 |  |
| 5 | 39.10-40.99 | 0 |  |
| 6 | 40.99-42.87 | 0 |  |
| 7 | 42.87-44.76 | 0 |  |
| 8 | 44.76-46.64 | 0 |  |
| 9 | 46.64-48.53 | 0 |  |
| 10 | 48.53-50.41 | 1 | # |

## runToolLoop

# Perf Report — runToolLoop

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 27.53ms |
| p95 | 29.89ms |
| p99 | 40.12ms |
| mean | 28.04ms |
| stdev | 2.42ms |
| min | 26.28ms |
| max | 40.12ms |
| total | 841.20ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 26.28-27.67 | 19 | ########## |
| 2 | 27.67-29.05 | 7 | #### |
| 3 | 29.05-30.43 | 3 | ## |
| 4 | 30.43-31.82 | 0 |  |
| 5 | 31.82-33.20 | 0 |  |
| 6 | 33.20-34.59 | 0 |  |
| 7 | 34.59-35.97 | 0 |  |
| 8 | 35.97-37.35 | 0 |  |
| 9 | 37.35-38.74 | 0 |  |
| 10 | 38.74-40.12 | 1 | # |

## runParallelToolCall

# Perf Report — runParallelToolCall

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 13.78ms |
| p95 | 15.24ms |
| p99 | 15.96ms |
| mean | 13.78ms |
| stdev | 0.73ms |
| min | 11.86ms |
| max | 15.96ms |
| total | 413.38ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 11.86-12.27 | 1 | # |
| 2 | 12.27-12.68 | 1 | # |
| 3 | 12.68-13.09 | 1 | # |
| 4 | 13.09-13.50 | 3 | ## |
| 5 | 13.50-13.91 | 13 | ########## |
| 6 | 13.91-14.32 | 8 | ###### |
| 7 | 14.32-14.73 | 1 | # |
| 8 | 14.73-15.14 | 0 |  |
| 9 | 15.14-15.55 | 1 | # |
| 10 | 15.55-15.96 | 1 | # |

