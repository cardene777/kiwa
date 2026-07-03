# Perf Suite — dogfood-storybook-design-system

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| registerAndDiscover | 0.04ms | 50ms | PASS | stable |
| runPlayFunctionsForAll | 0.17ms | 80ms | PASS | stable |
| runA11yForAll | 0.42ms | 80ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| registerAndDiscover | 0.39ms | 100ms | PASS |
| runPlayFunctionsForAll | 1.08ms | 160ms | PASS |
| runA11yForAll | 2.88ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| registerAndDiscover | -5068336 B | 0 B | 102400 B | PASS |
| runPlayFunctionsForAll | 4916000 B | 0 B | 102400 B | PASS |
| runA11yForAll | 714136 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### registerAndDiscover

# Perf Report — registerAndDiscover.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +4.51% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +4.97% |
| p99 | 0.05ms | 0.05ms | -0.00ms | -7.94% |
| mean | 0.03ms | 0.03ms | +0.00ms | +5.05% |
| min | 0.02ms | 0.02ms | +0.00ms | +4.92% |
| max | 0.05ms | 0.05ms | -0.00ms | -7.94% |
| total | 1.09ms | 1.04ms | +0.05ms | +5.05% |

### runPlayFunctionsForAll

# Perf Report — runPlayFunctionsForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.12ms |
| p95 | 0.17ms |
| p99 | 0.34ms |
| mean | 0.13ms |
| stdev | 0.04ms |
| min | 0.10ms |
| max | 0.34ms |
| total | 5.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.12ms | 0.10ms | +0.02ms | +18.92% |
| p95 | 0.17ms | 0.17ms | -0.01ms | -3.46% |
| p99 | 0.34ms | 0.20ms | +0.13ms | +65.78% |
| mean | 0.13ms | 0.11ms | +0.02ms | +16.65% |
| min | 0.10ms | 0.08ms | +0.01ms | +14.05% |
| max | 0.34ms | 0.20ms | +0.13ms | +65.78% |
| total | 5.19ms | 4.45ms | +0.74ms | +16.65% |

### runA11yForAll

# Perf Report — runA11yForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.28ms |
| p95 | 0.42ms |
| p99 | 0.48ms |
| mean | 0.30ms |
| stdev | 0.05ms |
| min | 0.26ms |
| max | 0.48ms |
| total | 12.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.28ms | 0.27ms | +0.02ms | +5.97% |
| p95 | 0.42ms | 0.37ms | +0.05ms | +14.33% |
| p99 | 0.48ms | 0.39ms | +0.09ms | +23.64% |
| mean | 0.30ms | 0.28ms | +0.02ms | +8.42% |
| min | 0.26ms | 0.25ms | +0.01ms | +4.06% |
| max | 0.48ms | 0.39ms | +0.09ms | +23.64% |
| total | 12.08ms | 11.14ms | +0.94ms | +8.42% |

