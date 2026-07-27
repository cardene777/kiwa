# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.51ms | 30ms | PASS | stable |
| setupComponentEnvRender | 0.19ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 2.45ms | 60ms | PASS |
| setupComponentEnvRender | 0.74ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 135416 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -144904 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.22ms |
| p95 | 0.51ms |
| p99 | 0.59ms |
| mean | 0.26ms |
| stdev | 0.10ms |
| min | 0.19ms |
| max | 0.60ms |
| total | 12.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.22ms | 0.22ms | +0.00ms | +1.06% |
| p95 | 0.51ms | 0.45ms | +0.06ms | +12.31% |
| p99 | 0.59ms | 0.54ms | +0.05ms | +9.62% |
| mean | 0.26ms | 0.25ms | +0.01ms | +4.82% |
| min | 0.19ms | 0.17ms | +0.02ms | +8.77% |
| max | 0.60ms | 0.54ms | +0.06ms | +10.41% |
| total | 12.93ms | 12.34ms | +0.59ms | +4.82% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p50 | 0.13ms |
| p95 | 0.19ms |
| p99 | 0.68ms |
| mean | 0.15ms |
| stdev | 0.14ms |
| min | 0.11ms |
| max | 1.12ms |
| total | 7.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.13ms | 0.18ms | -0.05ms | -27.84% |
| p95 | 0.19ms | 0.30ms | -0.11ms | -35.35% |
| p99 | 0.68ms | 0.73ms | -0.04ms | -6.19% |
| mean | 0.15ms | 0.21ms | -0.06ms | -26.91% |
| min | 0.11ms | 0.16ms | -0.05ms | -31.17% |
| max | 1.12ms | 1.07ms | +0.05ms | +4.70% |
| total | 7.59ms | 10.39ms | -2.79ms | -26.91% |

