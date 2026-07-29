# Perf Suite — cli-test-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 9.39ms | 19.44ms | 500ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| batch_cli_run (5x echo test) | 46.29ms | 179.06ms | 1000ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| setup_cleanup_cycle (5 sequential setup+stop) | 28.79ms | 74.12ms | 500ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | 37.91ms | 1000ms | PASS |
| batch_cli_run (5x echo test) | 92.67ms | 2000ms | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | 50.24ms | 1000ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| file_scaffold_workflow (setup + 20 writeFile + listFiles) | -42264 B | -39174 B | 102400 B | yes | WAIVED (fs の Buffer pool の伸びを拾うため実装の保持量を表さない (#1719)) |
| batch_cli_run (5x echo test) | 22496 B | -10277 B | 102400 B | yes | PASS |
| setup_cleanup_cycle (5 sequential setup+stop) | -22264 B | -30644 B | 102400 B | yes | PASS |

## Detailed serial reports

### file_scaffold_workflow (setup + 20 writeFile + listFiles)

# Perf Report — file_scaffold_workflow (setup + 20 writeFile + listFiles).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 9.39ms |
| p50 | 12.06ms |
| p95 | 19.44ms |
| p99 | 19.78ms |
| mean | 12.84ms |
| stdev | 3.46ms |
| min | 7.91ms |
| max | 19.86ms |
| total | 192.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 9.39ms | 4.67ms | +4.72ms | +100.93% |
| p50 | 12.06ms | 6.16ms | +5.90ms | +95.83% |
| p95 | 19.44ms | 8.98ms | +10.46ms | +116.50% |
| p99 | 19.78ms | 9.49ms | +10.28ms | +108.35% |
| mean | 12.84ms | 6.54ms | +6.30ms | +96.35% |
| min | 7.91ms | 4.43ms | +3.48ms | +78.48% |
| max | 19.86ms | 9.62ms | +10.24ms | +106.45% |
| total | 192.60ms | 98.09ms | +94.51ms | +96.35% |

### batch_cli_run (5x echo test)

# Perf Report — batch_cli_run (5x echo test).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 46.29ms |
| p50 | 68.75ms |
| p95 | 179.06ms |
| p99 | 198.28ms |
| mean | 85.35ms |
| stdev | 48.57ms |
| min | 42.87ms |
| max | 203.09ms |
| total | 1280.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 46.29ms | 14.41ms | +31.88ms | +221.13% |
| p50 | 68.75ms | 18.71ms | +50.04ms | +267.50% |
| p95 | 179.06ms | 27.98ms | +151.08ms | +539.91% |
| p99 | 198.28ms | 28.59ms | +169.69ms | +593.49% |
| mean | 85.35ms | 20.54ms | +64.81ms | +315.44% |
| min | 42.87ms | 14.06ms | +28.82ms | +204.98% |
| max | 203.09ms | 28.74ms | +174.35ms | +606.53% |
| total | 1280.29ms | 308.17ms | +972.11ms | +315.44% |

### setup_cleanup_cycle (5 sequential setup+stop)

# Perf Report — setup_cleanup_cycle (5 sequential setup+stop).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 28.79ms |
| p50 | 39.69ms |
| p95 | 74.12ms |
| p99 | 82.64ms |
| mean | 46.28ms |
| stdev | 18.11ms |
| min | 17.42ms |
| max | 84.77ms |
| total | 694.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 28.79ms | 4.21ms | +24.58ms | +583.32% |
| p50 | 39.69ms | 5.76ms | +33.92ms | +588.53% |
| p95 | 74.12ms | 9.97ms | +64.15ms | +643.68% |
| p99 | 82.64ms | 14.01ms | +68.63ms | +489.90% |
| mean | 46.28ms | 6.43ms | +39.85ms | +620.19% |
| min | 17.42ms | 3.59ms | +13.83ms | +385.07% |
| max | 84.77ms | 15.02ms | +69.75ms | +464.39% |
| total | 694.18ms | 96.39ms | +597.79ms | +620.19% |

