# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.02ms | 100ms | PASS | stable |
| streaming_workload (5 runStream + chunk collect) | 19.36ms | 100ms | PASS | stable |
| multi_turn_conversation (10-turn chat + reset) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.05ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 19.35ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | -16624 B | 0 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | 8248 B | 0 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | -16328 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -41.58% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -9.60% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +6.73% |
| mean | 0.01ms | 0.01ms | -0.00ms | -26.46% |
| min | 0.01ms | 0.01ms | -0.00ms | -37.17% |
| max | 0.02ms | 0.02ms | +0.00ms | +10.49% |
| total | 0.17ms | 0.24ms | -0.06ms | -26.46% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 19.13ms |
| p95 | 19.36ms |
| p99 | 19.38ms |
| mean | 18.87ms |
| stdev | 0.57ms |
| min | 17.74ms |
| max | 19.39ms |
| total | 377.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 19.13ms | 16.78ms | +2.36ms | +14.06% |
| p95 | 19.36ms | 17.91ms | +1.45ms | +8.11% |
| p99 | 19.38ms | 17.97ms | +1.41ms | +7.85% |
| mean | 18.87ms | 16.82ms | +2.05ms | +12.18% |
| min | 17.74ms | 15.05ms | +2.69ms | +17.88% |
| max | 19.39ms | 17.99ms | +1.40ms | +7.78% |
| total | 377.34ms | 336.36ms | +40.98ms | +12.18% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +20.62% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +87.62% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +78.85% |
| mean | 0.01ms | 0.01ms | +0.00ms | +27.58% |
| min | 0.01ms | 0.01ms | +0.00ms | +7.84% |
| max | 0.02ms | 0.01ms | +0.01ms | +76.96% |
| total | 0.18ms | 0.14ms | +0.04ms | +27.58% |

