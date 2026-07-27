# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.02ms | 100ms | PASS | stable |
| streaming_workload (5 runStream + chunk collect) | 17.69ms | 100ms | PASS | stable |
| multi_turn_conversation (10-turn chat + reset) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.05ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 17.76ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.21ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 806152 B | 0 B | 102400 B | PASS |
| streaming_workload (5 runStream + chunk collect) | 909928 B | 0 B | 102400 B | PASS |
| multi_turn_conversation (10-turn chat + reset) | 519640 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### chat_completion (10x runChat + getMetrics)

# Perf Report — chat_completion (10x runChat + getMetrics).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +17.23% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +12.25% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +9.16% |
| mean | 0.01ms | 0.01ms | +0.00ms | +8.06% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.00% |
| max | 0.02ms | 0.02ms | +0.00ms | +8.44% |
| total | 0.20ms | 0.19ms | +0.02ms | +8.06% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 17.39ms |
| p95 | 17.69ms |
| p99 | 17.69ms |
| mean | 17.05ms |
| stdev | 0.58ms |
| min | 16.16ms |
| max | 17.69ms |
| total | 340.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 17.39ms | 19.10ms | -1.71ms | -8.95% |
| p95 | 17.69ms | 19.37ms | -1.68ms | -8.67% |
| p99 | 17.69ms | 19.38ms | -1.69ms | -8.72% |
| mean | 17.05ms | 18.72ms | -1.67ms | -8.92% |
| min | 16.16ms | 16.64ms | -0.48ms | -2.88% |
| max | 17.69ms | 19.39ms | -1.69ms | -8.74% |
| total | 340.97ms | 374.35ms | -33.38ms | -8.92% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +51.73% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +52.81% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +51.91% |
| mean | 0.01ms | 0.01ms | +0.00ms | +50.19% |
| min | 0.01ms | 0.00ms | +0.00ms | +44.01% |
| max | 0.02ms | 0.01ms | +0.01ms | +51.79% |
| total | 0.16ms | 0.11ms | +0.05ms | +50.19% |

