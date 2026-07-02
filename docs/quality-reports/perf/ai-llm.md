# Perf Suite — ai-llm

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| anthropicMessagesCreate | 10.14ms | PASS | stable | none |
| openAiChatCompletionsCreate | 10.11ms | PASS | stable | none |
| vercelGenerateText | 10.14ms | PASS | stable | none |
| langchainInvoke | 10.21ms | PASS | stable | none |

## anthropic.messages.create

# Perf Report — anthropic.messages.create

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 10.05ms |
| p95 | 10.14ms |
| p99 | 10.17ms |
| mean | 9.73ms |
| stdev | 0.61ms |
| min | 8.10ms |
| max | 10.20ms |
| total | 973.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 10.05ms | 10.07ms | -0.01ms | -0.11% |
| p95 | 10.14ms | 10.16ms | -0.02ms | -0.19% |
| p99 | 10.17ms | 10.21ms | -0.05ms | -0.45% |
| mean | 9.73ms | 9.74ms | -0.01ms | -0.11% |
| min | 8.10ms | 8.09ms | +0.01ms | +0.06% |
| max | 10.20ms | 10.22ms | -0.02ms | -0.16% |
| total | 973.11ms | 974.19ms | -1.08ms | -0.11% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 8.10-8.31 | 6 | # |
| 2 | 8.31-8.52 | 4 | # |
| 3 | 8.52-8.73 | 1 | # |
| 4 | 8.73-8.94 | 2 | # |
| 5 | 8.94-9.15 | 7 | # |
| 6 | 9.15-9.36 | 1 | # |
| 7 | 9.36-9.57 | 5 | # |
| 8 | 9.57-9.78 | 1 | # |
| 9 | 9.78-9.99 | 4 | # |
| 10 | 9.99-10.20 | 69 | ########## |

## openai.chat.completions.create

# Perf Report — openai.chat.completions.create

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 10.08ms |
| p95 | 10.11ms |
| p99 | 10.12ms |
| mean | 9.72ms |
| stdev | 0.61ms |
| min | 8.13ms |
| max | 10.13ms |
| total | 972.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 10.08ms | 10.07ms | +0.01ms | +0.11% |
| p95 | 10.11ms | 10.14ms | -0.03ms | -0.28% |
| p99 | 10.12ms | 10.17ms | -0.05ms | -0.48% |
| mean | 9.72ms | 9.69ms | +0.03ms | +0.32% |
| min | 8.13ms | 8.15ms | -0.01ms | -0.16% |
| max | 10.13ms | 10.20ms | -0.07ms | -0.70% |
| total | 972.16ms | 969.10ms | +3.06ms | +0.32% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 8.13-8.33 | 5 | # |
| 2 | 8.33-8.53 | 2 | # |
| 3 | 8.53-8.73 | 3 | # |
| 4 | 8.73-8.93 | 8 | # |
| 5 | 8.93-9.13 | 2 | # |
| 6 | 9.13-9.33 | 3 | # |
| 7 | 9.33-9.53 | 4 | # |
| 8 | 9.53-9.73 | 2 | # |
| 9 | 9.73-9.93 | 3 | # |
| 10 | 9.93-10.13 | 68 | ########## |

## vercel.generateText

# Perf Report — vercel.generateText

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 10.06ms |
| p95 | 10.14ms |
| p99 | 10.20ms |
| mean | 9.74ms |
| stdev | 0.62ms |
| min | 7.40ms |
| max | 10.24ms |
| total | 974.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 10.06ms | 10.07ms | -0.01ms | -0.10% |
| p95 | 10.14ms | 10.18ms | -0.04ms | -0.37% |
| p99 | 10.20ms | 10.24ms | -0.05ms | -0.45% |
| mean | 9.74ms | 9.87ms | -0.13ms | -1.33% |
| min | 7.40ms | 8.23ms | -0.83ms | -10.07% |
| max | 10.24ms | 10.25ms | -0.01ms | -0.07% |
| total | 974.29ms | 987.41ms | -13.12ms | -1.33% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 7.40-7.68 | 1 | # |
| 2 | 7.68-7.97 | 0 |  |
| 3 | 7.97-8.25 | 1 | # |
| 4 | 8.25-8.54 | 5 | # |
| 5 | 8.54-8.82 | 9 | # |
| 6 | 8.82-9.10 | 2 | # |
| 7 | 9.10-9.39 | 4 | # |
| 8 | 9.39-9.67 | 3 | # |
| 9 | 9.67-9.96 | 5 | # |
| 10 | 9.96-10.24 | 70 | ########## |

## langchain.invoke

# Perf Report — langchain.invoke

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 10.07ms |
| p95 | 10.21ms |
| p99 | 10.56ms |
| mean | 9.79ms |
| stdev | 0.64ms |
| min | 7.46ms |
| max | 11.60ms |
| total | 978.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 10.07ms | 10.06ms | +0.01ms | +0.06% |
| p95 | 10.21ms | 10.16ms | +0.04ms | +0.43% |
| p99 | 10.56ms | 10.26ms | +0.30ms | +2.88% |
| mean | 9.79ms | 9.80ms | -0.01ms | -0.14% |
| min | 7.46ms | 8.15ms | -0.69ms | -8.42% |
| max | 11.60ms | 10.73ms | +0.88ms | +8.19% |
| total | 978.76ms | 980.17ms | -1.42ms | -0.14% |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 7.46-7.88 | 1 | # |
| 2 | 7.88-8.29 | 3 | # |
| 3 | 8.29-8.70 | 3 | # |
| 4 | 8.70-9.12 | 9 | # |
| 5 | 9.12-9.53 | 10 | ## |
| 6 | 9.53-9.95 | 5 | # |
| 7 | 9.95-10.36 | 66 | ########## |
| 8 | 10.36-10.78 | 2 | # |
| 9 | 10.78-11.19 | 0 |  |
| 10 | 11.19-11.60 | 1 | # |

