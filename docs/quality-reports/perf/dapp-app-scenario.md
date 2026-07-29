# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.04ms | 0.06ms | 30ms | 0.00042ms | PASS | stable (p10 +17% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.11ms | 1.37ms | 50ms | 0.00042ms | PASS | stable (p10 -2% (閾値未満)、 p95 +788% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.04ms | 0.04ms | 30ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.34ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 2.77ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.23ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -50456 B | -20873 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | -50216 B | 0 B | 102400 B | yes | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | -21480 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dapp_spec_parse (10 parseSpec of wallet spec)

# Perf Report — dapp_spec_parse (10 parseSpec of wallet spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.15ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.04ms |
| max | 0.19ms |
| total | 1.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0052ms | +17.07% |
| p50 | 0.04ms | 0.04ms | +0.0087ms | +24.06% |
| p95 | 0.06ms | 0.05ms | +0.02ms | +33.87% |
| p99 | 0.15ms | 0.05ms | +0.11ms | +231.72% |
| mean | 0.05ms | 0.04ms | +0.02ms | +42.82% |
| min | 0.04ms | 0.03ms | +0.0051ms | +16.76% |
| max | 0.19ms | 0.05ms | +0.14ms | +311.57% |
| total | 1.53ms | 1.07ms | +0.46ms | +42.82% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.12ms |
| p95 | 1.37ms |
| p99 | 2.86ms |
| mean | 0.32ms |
| stdev | 0.67ms |
| min | 0.11ms |
| max | 3.44ms |
| total | 9.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.11ms | -0.0023ms | -2.06% |
| p50 | 0.12ms | 0.12ms | -0.000083ms | -0.07% |
| p95 | 1.37ms | 0.15ms | +1.21ms | +787.52% |
| p99 | 2.86ms | 0.16ms | +2.70ms | +1708.59% |
| mean | 0.32ms | 0.12ms | +0.20ms | +164.33% |
| min | 0.11ms | 0.11ms | +0.0010ms | +0.97% |
| max | 3.44ms | 0.16ms | +3.28ms | +2063.65% |
| total | 9.70ms | 3.67ms | +6.03ms | +164.33% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0016ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 1.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0067ms | +20.22% |
| p50 | 0.04ms | 0.03ms | +0.0079ms | +23.56% |
| p95 | 0.04ms | 0.04ms | +0.0056ms | +14.85% |
| p99 | 0.05ms | 0.04ms | +0.0070ms | +17.69% |
| mean | 0.04ms | 0.03ms | +0.0070ms | +20.16% |
| min | 0.04ms | 0.03ms | +0.0053ms | +16.12% |
| max | 0.05ms | 0.04ms | +0.0077ms | +19.03% |
| total | 1.24ms | 1.04ms | +0.21ms | +20.16% |

