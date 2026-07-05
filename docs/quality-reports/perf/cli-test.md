# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| writeFile | 1.57ms | 20ms | PASS | regressed |
| readFile | 2.23ms | 10ms | PASS | regressed |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 7.04ms | 40ms | PASS |
| readFile | 1.69ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| writeFile | 1423408 B | 60000 B | 102400 B | PASS |
| readFile | 1210648 B | 60500 B | 102400 B | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.35ms |
| p95 | 1.57ms |
| p99 | 4.01ms |
| mean | 0.60ms |
| stdev | 0.76ms |
| min | 0.12ms |
| max | 5.08ms |
| total | 60.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.35ms | 0.10ms | +0.25ms | +260.82% |
| p95 | 1.57ms | 0.12ms | +1.45ms | +1187.88% |
| p99 | 4.01ms | 0.14ms | +3.87ms | +2814.42% |
| mean | 0.60ms | 0.10ms | +0.50ms | +501.09% |
| min | 0.12ms | 0.08ms | +0.04ms | +50.23% |
| max | 5.08ms | 0.20ms | +4.88ms | +2453.08% |
| total | 60.21ms | 10.02ms | +50.20ms | +501.09% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.22ms |
| p95 | 2.23ms |
| p99 | 3.02ms |
| mean | 0.50ms |
| stdev | 0.69ms |
| min | 0.06ms |
| max | 4.16ms |
| total | 50.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.22ms | 0.04ms | +0.18ms | +466.91% |
| p95 | 2.23ms | 0.05ms | +2.17ms | +4020.56% |
| p99 | 3.02ms | 0.08ms | +2.94ms | +3525.21% |
| mean | 0.50ms | 0.04ms | +0.46ms | +1088.41% |
| min | 0.06ms | 0.03ms | +0.03ms | +90.85% |
| max | 4.16ms | 0.09ms | +4.07ms | +4528.34% |
| total | 50.33ms | 4.23ms | +46.09ms | +1088.41% |

