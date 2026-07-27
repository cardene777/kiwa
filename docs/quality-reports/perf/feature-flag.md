# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluateFlag | 0.00ms | 5ms | PASS | stable |
| evaluateAllFlags | 0.00ms | 5ms | PASS | stable |
| registerRule | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.01ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 239640 B | -48654 B | 102400 B | yes | PASS |
| evaluateAllFlags | 94584 B | 0 B | 102400 B | yes | PASS |
| registerRule | 20344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.56% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.35% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +11.19% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.26% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +3.08% |
| total | 0.16ms | 0.14ms | +0.01ms | +7.26% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.04ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.16ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +62.19% |
| p99 | 0.04ms | 0.00ms | +0.04ms | +2136.39% |
| mean | 0.00ms | 0.00ms | +0.00ms | +139.65% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.16ms | 0.00ms | +0.15ms | +4299.19% |
| total | 0.48ms | 0.20ms | +0.28ms | +139.65% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +43.22% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +1.84% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.39% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -14.22% |
| total | 0.06ms | 0.06ms | +0.00ms | +7.39% |

