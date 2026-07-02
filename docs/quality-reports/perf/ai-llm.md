# Perf Suite — ai-llm

| op | p95 | gate | regression | blockers |
|---|---|---|---|---|
| anthropicMessagesCreate | 9.17ms | PASS | n/a | none |
| openAiChatCompletionsCreate | 9.87ms | PASS | n/a | none |
| vercelGenerateText | 9.30ms | PASS | n/a | none |
| langchainInvoke | 9.29ms | PASS | n/a | none |

## anthropic.messages.create

# Perf Report — anthropic.messages.create

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 9.08ms |
| p95 | 9.17ms |
| p99 | 9.22ms |
| mean | 8.98ms |
| stdev | 0.28ms |
| min | 7.94ms |
| max | 9.28ms |
| total | 898.01ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 7.94-8.07 | 2 | # |
| 2 | 8.07-8.21 | 2 | # |
| 3 | 8.21-8.34 | 4 | # |
| 4 | 8.34-8.48 | 1 | # |
| 5 | 8.48-8.61 | 2 | # |
| 6 | 8.61-8.75 | 2 | # |
| 7 | 8.75-8.88 | 5 | # |
| 8 | 8.88-9.01 | 4 | # |
| 9 | 9.01-9.15 | 66 | ########## |
| 10 | 9.15-9.28 | 12 | ## |

## openai.chat.completions.create

# Perf Report — openai.chat.completions.create

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 9.12ms |
| p95 | 9.87ms |
| p99 | 98.52ms |
| mean | 11.17ms |
| stdev | 13.71ms |
| min | 7.45ms |
| max | 111.50ms |
| total | 1116.64ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 7.45-17.85 | 97 | ########## |
| 2 | 17.85-28.26 | 0 |  |
| 3 | 28.26-38.67 | 1 | # |
| 4 | 38.67-49.07 | 0 |  |
| 5 | 49.07-59.48 | 0 |  |
| 6 | 59.48-69.88 | 0 |  |
| 7 | 69.88-80.29 | 0 |  |
| 8 | 80.29-90.69 | 0 |  |
| 9 | 90.69-101.10 | 1 | # |
| 10 | 101.10-111.50 | 1 | # |

## vercel.generateText

# Perf Report — vercel.generateText

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 9.12ms |
| p95 | 9.30ms |
| p99 | 10.08ms |
| mean | 9.12ms |
| stdev | 0.69ms |
| min | 7.33ms |
| max | 15.05ms |
| total | 912.06ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 7.33-8.10 | 3 | # |
| 2 | 8.10-8.87 | 8 | # |
| 3 | 8.87-9.65 | 87 | ########## |
| 4 | 9.65-10.42 | 1 | # |
| 5 | 10.42-11.19 | 0 |  |
| 6 | 11.19-11.96 | 0 |  |
| 7 | 11.96-12.74 | 0 |  |
| 8 | 12.74-13.51 | 0 |  |
| 9 | 13.51-14.28 | 0 |  |
| 10 | 14.28-15.05 | 1 | # |

## langchain.invoke

# Perf Report — langchain.invoke

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 5 |
| p50 | 9.09ms |
| p95 | 9.29ms |
| p99 | 9.41ms |
| mean | 8.97ms |
| stdev | 0.40ms |
| min | 7.83ms |
| max | 9.43ms |
| total | 897.38ms |

## Samples histogram

| bin | range ms | count | bar |
|---|---|---|---|
| 1 | 7.83-7.99 | 8 | ## |
| 2 | 7.99-8.15 | 1 | # |
| 3 | 8.15-8.31 | 2 | # |
| 4 | 8.31-8.47 | 4 | # |
| 5 | 8.47-8.63 | 2 | # |
| 6 | 8.63-8.79 | 1 | # |
| 7 | 8.79-8.95 | 3 | # |
| 8 | 8.95-9.11 | 38 | ########## |
| 9 | 9.11-9.27 | 31 | ######## |
| 10 | 9.27-9.43 | 10 | ### |

