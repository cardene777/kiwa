# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.65ms | 200ms | PASS | stable (差 0.24ms が下限 0.5ms 未満で判定を保留) |
| query_workload (100 insert + 100 select) | 0.56ms | 200ms | PASS | stable (差 0.15ms が下限 0.5ms 未満で判定を保留) |
| crud_cycle (10 rows × insert+update+delete) | 0.48ms | 200ms | PASS | stable (差 0.18ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 1.07ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 1.24ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 0.86ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -53792 B | -5 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -22016 B | 5 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -34656 B | 4 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.46ms |
| p95 | 0.65ms |
| p99 | 0.71ms |
| mean | 0.47ms |
| stdev | 0.10ms |
| min | 0.35ms |
| max | 0.72ms |
| total | 7.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.46ms | 0.39ms | +0.08ms | +19.86% |
| p95 | 0.65ms | 0.88ms | -0.24ms | -26.79% |
| p99 | 0.71ms | 1.52ms | -0.81ms | -53.49% |
| mean | 0.47ms | 0.46ms | +0.02ms | +4.08% |
| min | 0.35ms | 0.24ms | +0.11ms | +46.65% |
| max | 0.72ms | 1.92ms | -1.20ms | -62.38% |
| total | 7.11ms | 91.06ms | -83.95ms | -92.19% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.44ms |
| p95 | 0.56ms |
| p99 | 0.57ms |
| mean | 0.45ms |
| stdev | 0.07ms |
| min | 0.34ms |
| max | 0.58ms |
| total | 6.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.44ms | 0.29ms | +0.15ms | +53.66% |
| p95 | 0.56ms | 0.41ms | +0.15ms | +37.04% |
| p99 | 0.57ms | 0.45ms | +0.12ms | +27.34% |
| mean | 0.45ms | 0.30ms | +0.15ms | +48.86% |
| min | 0.34ms | 0.22ms | +0.12ms | +53.65% |
| max | 0.58ms | 0.46ms | +0.12ms | +26.31% |
| total | 6.80ms | 60.93ms | -54.13ms | -88.84% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.35ms |
| p95 | 0.48ms |
| p99 | 0.50ms |
| mean | 0.37ms |
| stdev | 0.07ms |
| min | 0.28ms |
| max | 0.50ms |
| total | 5.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.35ms | 0.22ms | +0.13ms | +58.78% |
| p95 | 0.48ms | 0.30ms | +0.18ms | +58.68% |
| p99 | 0.50ms | 0.33ms | +0.17ms | +50.95% |
| mean | 0.37ms | 0.23ms | +0.14ms | +63.46% |
| min | 0.28ms | 0.17ms | +0.11ms | +67.56% |
| max | 0.50ms | 0.53ms | -0.03ms | -5.75% |
| total | 5.58ms | 45.52ms | -39.94ms | -87.74% |

