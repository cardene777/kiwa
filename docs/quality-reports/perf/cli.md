# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| runSpecToTest | 0.12ms | 20ms | PASS | improved |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 0.44ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 13880 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.09ms |
| p95 | 0.12ms |
| p99 | 0.15ms |
| mean | 0.09ms |
| stdev | 0.02ms |
| min | 0.08ms |
| max | 0.29ms |
| total | 9.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.09ms | 0.12ms | -0.03ms | -26.00% |
| p95 | 0.12ms | 0.65ms | -0.53ms | -81.55% |
| p99 | 0.15ms | 0.98ms | -0.83ms | -84.83% |
| mean | 0.09ms | 0.20ms | -0.11ms | -53.45% |
| min | 0.08ms | 0.09ms | -0.01ms | -11.35% |
| max | 0.29ms | 1.85ms | -1.56ms | -84.52% |
| total | 9.46ms | 20.33ms | -10.87ms | -53.45% |

