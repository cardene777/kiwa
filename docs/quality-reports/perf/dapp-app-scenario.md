# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.04ms | 30ms | PASS | stable |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.13ms | 50ms | PASS | stable |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.04ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.13ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.69ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.16ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -57624 B | 0 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | -42512 B | 0 B | 102400 B | yes | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 3536 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dapp_spec_parse (10 parseSpec of wallet spec)

# Perf Report — dapp_spec_parse (10 parseSpec of wallet spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.01ms | -22.48% |
| p95 | 0.04ms | 0.13ms | -0.09ms | -66.26% |
| p99 | 0.05ms | 0.35ms | -0.30ms | -86.41% |
| mean | 0.04ms | 0.07ms | -0.03ms | -46.20% |
| min | 0.03ms | 0.03ms | -0.00ms | -10.58% |
| max | 0.05ms | 0.43ms | -0.38ms | -88.93% |
| total | 1.05ms | 1.96ms | -0.90ms | -46.20% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.11ms |
| p95 | 0.13ms |
| p99 | 0.13ms |
| mean | 0.11ms |
| stdev | 0.01ms |
| min | 0.10ms |
| max | 0.13ms |
| total | 3.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.11ms | 0.14ms | -0.03ms | -20.25% |
| p95 | 0.13ms | 0.15ms | -0.02ms | -11.59% |
| p99 | 0.13ms | 0.15ms | -0.02ms | -10.04% |
| mean | 0.11ms | 0.14ms | -0.02ms | -15.52% |
| min | 0.10ms | 0.12ms | -0.02ms | -16.31% |
| max | 0.13ms | 0.15ms | -0.02ms | -10.01% |
| total | 3.44ms | 4.07ms | -0.63ms | -15.52% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 1.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -4.33% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +9.32% |
| p99 | 0.05ms | 0.04ms | +0.01ms | +14.77% |
| mean | 0.04ms | 0.04ms | -0.00ms | -1.65% |
| min | 0.03ms | 0.04ms | -0.00ms | -9.65% |
| max | 0.05ms | 0.04ms | +0.01ms | +18.70% |
| total | 1.11ms | 1.13ms | -0.02ms | -1.65% |

