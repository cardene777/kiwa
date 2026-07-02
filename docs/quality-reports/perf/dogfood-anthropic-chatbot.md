# Perf Suite — dogfood-anthropic-chatbot

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| reply | 10.24ms | PASS | stable | none |
| replyStream | 16.64ms | PASS | stable | none |
| toolLoop | 20.23ms | PASS | stable | none |

## reply

# Perf Report — reply

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 10.08ms |
| p95 | 10.24ms |
| p99 | 10.27ms |
| mean | 9.75ms |
| stdev | 0.64ms |
| min | 7.26ms |
| max | 10.28ms |
| total | 975.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 10.08ms | 10.08ms | +0.01ms | +0.07% |
| p95 | 10.24ms | 10.17ms | +0.07ms | +0.70% |
| p99 | 10.27ms | 10.19ms | +0.08ms | +0.75% |
| mean | 9.75ms | 9.84ms | -0.09ms | -0.92% |
| min | 7.26ms | 8.37ms | -1.11ms | -13.30% |
| max | 10.28ms | 10.23ms | +0.05ms | +0.53% |
| total | 975.43ms | 984.46ms | -9.03ms | -0.92% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 7.26-7.56 | 1 | # |
| 2 | 7.56-7.86 | 1 | # |
| 3 | 7.86-8.17 | 0 |  |
| 4 | 8.17-8.47 | 4 | # |
| 5 | 8.47-8.77 | 3 | # |
| 6 | 8.77-9.07 | 9 | # |
| 7 | 9.07-9.38 | 5 | # |
| 8 | 9.38-9.68 | 3 | # |
| 9 | 9.68-9.98 | 6 | # |
| 10 | 9.98-10.28 | 68 | ########## |

## replyStream

# Perf Report — replyStream

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 16.55ms |
| p95 | 16.64ms |
| p99 | 16.68ms |
| mean | 16.38ms |
| stdev | 0.44ms |
| min | 15.29ms |
| max | 16.68ms |
| total | 491.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 16.55ms | 16.71ms | -0.16ms | -0.96% |
| p95 | 16.64ms | 16.85ms | -0.21ms | -1.23% |
| p99 | 16.68ms | 16.93ms | -0.25ms | -1.49% |
| mean | 16.38ms | 16.35ms | +0.03ms | +0.17% |
| min | 15.29ms | 15.39ms | -0.10ms | -0.62% |
| max | 16.68ms | 16.93ms | -0.25ms | -1.49% |
| total | 491.31ms | 490.46ms | +0.85ms | +0.17% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 15.29-15.43 | 4 | ## |
| 2 | 15.43-15.57 | 0 |  |
| 3 | 15.57-15.71 | 0 |  |
| 4 | 15.71-15.85 | 0 |  |
| 5 | 15.85-15.98 | 0 |  |
| 6 | 15.98-16.12 | 0 |  |
| 7 | 16.12-16.26 | 1 | # |
| 8 | 16.26-16.40 | 2 | # |
| 9 | 16.40-16.54 | 6 | #### |
| 10 | 16.54-16.68 | 17 | ########## |

## toolLoop

# Perf Report — toolLoop

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 20.09ms |
| p95 | 20.23ms |
| p99 | 20.28ms |
| mean | 19.75ms |
| stdev | 0.62ms |
| min | 17.85ms |
| max | 20.28ms |
| total | 592.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 20.09ms | 20.16ms | -0.08ms | -0.39% |
| p95 | 20.23ms | 20.23ms | +0.00ms | +0.00% |
| p99 | 20.28ms | 20.33ms | -0.05ms | -0.26% |
| mean | 19.75ms | 19.68ms | +0.07ms | +0.36% |
| min | 17.85ms | 18.15ms | -0.29ms | -1.62% |
| max | 20.28ms | 20.33ms | -0.05ms | -0.26% |
| total | 592.53ms | 590.38ms | +2.15ms | +0.36% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 17.85-18.10 | 1 | # |
| 2 | 18.10-18.34 | 0 |  |
| 3 | 18.34-18.58 | 1 | # |
| 4 | 18.58-18.82 | 1 | # |
| 5 | 18.82-19.07 | 1 | # |
| 6 | 19.07-19.31 | 2 | # |
| 7 | 19.31-19.55 | 2 | # |
| 8 | 19.55-19.80 | 4 | ## |
| 9 | 19.80-20.04 | 1 | # |
| 10 | 20.04-20.28 | 17 | ########## |

