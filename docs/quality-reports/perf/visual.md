# Perf Suite — visual

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| comparePngBuffersIdentical | 1.03ms | 50ms | PASS | regressed |
| comparePngBuffersFullDiff | 7.45ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| comparePngBuffersIdentical | 1.60ms | 100ms | PASS |
| comparePngBuffersFullDiff | 30.02ms | 400ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| comparePngBuffersIdentical | 4831456 B | 4974085 B | 8388608 B | PASS |
| comparePngBuffersFullDiff | -4068888 B | -34464523 B | 16777216 B | PASS |

## Detailed serial reports

### comparePngBuffersIdentical

# Perf Report — comparePngBuffersIdentical.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.52ms |
| p95 | 1.03ms |
| p99 | 1.44ms |
| mean | 0.59ms |
| stdev | 0.21ms |
| min | 0.41ms |
| max | 1.44ms |
| total | 17.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.52ms | 0.31ms | +0.21ms | +67.37% |
| p95 | 1.03ms | 0.56ms | +0.47ms | +83.60% |
| p99 | 1.44ms | 0.58ms | +0.86ms | +147.00% |
| mean | 0.59ms | 0.35ms | +0.23ms | +66.88% |
| min | 0.41ms | 0.27ms | +0.14ms | +50.85% |
| max | 1.44ms | 0.58ms | +0.86ms | +147.00% |
| total | 17.58ms | 10.53ms | +7.05ms | +66.88% |

### comparePngBuffersFullDiff

# Perf Report — comparePngBuffersFullDiff.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 5.79ms |
| p95 | 7.45ms |
| p99 | 10.71ms |
| mean | 6.17ms |
| stdev | 1.11ms |
| min | 5.09ms |
| max | 10.71ms |
| total | 184.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 5.79ms | 5.64ms | +0.15ms | +2.71% |
| p95 | 7.45ms | 7.47ms | -0.03ms | -0.38% |
| p99 | 10.71ms | 8.59ms | +2.12ms | +24.63% |
| mean | 6.17ms | 6.00ms | +0.16ms | +2.71% |
| min | 5.09ms | 5.07ms | +0.02ms | +0.45% |
| max | 10.71ms | 8.59ms | +2.12ms | +24.63% |
| total | 184.96ms | 180.09ms | +4.88ms | +2.71% |

