# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.04ms | 30ms | PASS | stable |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.14ms | 50ms | PASS | stable |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.04ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.17ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.61ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.17ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -56248 B | 0 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | -30584 B | 0 B | 102400 B | yes | PASS |
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
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.01ms | -18.14% |
| p95 | 0.04ms | 0.13ms | -0.09ms | -66.91% |
| p99 | 0.04ms | 0.35ms | -0.30ms | -87.24% |
| mean | 0.04ms | 0.07ms | -0.03ms | -46.21% |
| min | 0.03ms | 0.03ms | -0.00ms | -11.66% |
| max | 0.04ms | 0.43ms | -0.39ms | -89.67% |
| total | 1.05ms | 1.96ms | -0.90ms | -46.21% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.12ms |
| p95 | 0.14ms |
| p99 | 0.17ms |
| mean | 0.12ms |
| stdev | 0.01ms |
| min | 0.11ms |
| max | 0.18ms |
| total | 3.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.12ms | 0.14ms | -0.01ms | -10.35% |
| p95 | 0.14ms | 0.15ms | -0.01ms | -4.04% |
| p99 | 0.17ms | 0.15ms | +0.02ms | +16.15% |
| mean | 0.12ms | 0.14ms | -0.01ms | -8.70% |
| min | 0.11ms | 0.12ms | -0.01ms | -11.40% |
| max | 0.18ms | 0.15ms | +0.03ms | +23.24% |
| total | 3.72ms | 4.07ms | -0.35ms | -8.70% |

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
| total | 1.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -2.53% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +9.25% |
| p99 | 0.05ms | 0.04ms | +0.00ms | +8.01% |
| mean | 0.04ms | 0.04ms | -0.00ms | -1.09% |
| min | 0.03ms | 0.04ms | -0.00ms | -5.79% |
| max | 0.05ms | 0.04ms | +0.00ms | +9.40% |
| total | 1.12ms | 1.13ms | -0.01ms | -1.09% |

