# Perf Suite — dogfood-alert-orchestrator

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateRules | 0.0029ms | 0.0055ms | 30ms | 0.00092ms | PASS | stable (差 0.00075ms が下限 0.00092ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| routeAlert | 0.0011ms | 0.0035ms | 20ms | 0.00092ms | PASS | stable — gate 無効 (regressionGate=false) |
| advanceEscalation | 0.0017ms | 0.0026ms | 20ms | 0.00092ms | PASS | stable (差 0.00029ms が下限 0.00092ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateRules | 0.23ms | 60ms | PASS |
| routeAlert | 0.02ms | 40ms | PASS |
| advanceEscalation | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateRules | 19712 B | -37580 B | 102400 B | yes | PASS |
| routeAlert | 47328 B | 0 B | 102400 B | yes | PASS |
| advanceEscalation | 21944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateRules

# Perf Report — evaluateRules.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0029ms |
| p95 | 0.0055ms |
| p99 | 0.01ms |
| mean | 0.0036ms |
| stdev | 0.0022ms |
| min | 0.0028ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0021ms | +0.00075ms | +35.56% |
| p50 | 0.0029ms | 0.0021ms | +0.00079ms | +37.25% |
| p95 | 0.0055ms | 0.0055ms | +0.000015ms | +0.26% |
| p99 | 0.01ms | 0.01ms | +0.00022ms | +1.77% |
| mean | 0.0036ms | 0.0031ms | +0.00051ms | +16.76% |
| min | 0.0028ms | 0.0021ms | +0.00075ms | +36.01% |
| max | 0.02ms | 0.02ms | +0.00017ms | +1.03% |
| total | 0.14ms | 0.12ms | +0.02ms | +16.76% |

### routeAlert

# Perf Report — routeAlert.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.0035ms |
| p99 | 0.0061ms |
| mean | 0.0015ms |
| stdev | 0.0011ms |
| min | 0.0011ms |
| max | 0.0075ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.00096ms | +0.00017ms | +17.43% |
| p50 | 0.0012ms | 0.0010ms | +0.00013ms | +12.10% |
| p95 | 0.0035ms | 0.0035ms | +0.0000062ms | +0.18% |
| p99 | 0.0061ms | 0.0049ms | +0.0013ms | +26.10% |
| mean | 0.0015ms | 0.0014ms | +0.00019ms | +13.96% |
| min | 0.0011ms | 0.00096ms | +0.00017ms | +17.43% |
| max | 0.0075ms | 0.0055ms | +0.0020ms | +36.62% |
| total | 0.06ms | 0.05ms | +0.0076ms | +13.96% |

### advanceEscalation

# Perf Report — advanceEscalation.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0018ms |
| p95 | 0.0026ms |
| p99 | 0.0041ms |
| mean | 0.0019ms |
| stdev | 0.00055ms |
| min | 0.0017ms |
| max | 0.0045ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0014ms | +0.00029ms | +20.33% |
| p50 | 0.0018ms | 0.0015ms | +0.00029ms | +20.03% |
| p95 | 0.0026ms | 0.0027ms | -0.000054ms | -2.00% |
| p99 | 0.0041ms | 0.0041ms | +0.000064ms | +1.58% |
| mean | 0.0019ms | 0.0017ms | +0.00027ms | +16.60% |
| min | 0.0017ms | 0.0014ms | +0.00029ms | +21.16% |
| max | 0.0045ms | 0.0043ms | +0.00029ms | +6.87% |
| total | 0.08ms | 0.07ms | +0.01ms | +16.60% |

