# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.0014ms | 0.02ms | 20ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.0018ms | 0.01ms | 20ms | 0.00042ms | PASS | stable (p10 -5% (閾値未満)、 p95 +61% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| session_validate_loop (10x getSessionAndUser) | 0.0022ms | 0.0030ms | 30ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | cpu | 0.08ms | 0.0014ms | 0.017 | 0.016 | 0.0014ms | 0.0013ms |
| oauth_flow (upsertUserFromProfile + issueSession) | cpu | 0.08ms | 0.0018ms | 0.023 | 0.024 | 0.0019ms | 0.0020ms |
| session_validate_loop (10x getSessionAndUser) | cpu | 0.08ms | 0.0022ms | 0.028 | 0.026 | 0.0022ms | 0.0021ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.01ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.10ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.14ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -52704 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 1856 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | -376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### login_flow (createUser + issueSession + getSessionAndUser)

# Perf Report — login_flow (createUser + issueSession + getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0014ms |
| p50 | 0.0020ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0041ms |
| stdev | 0.0052ms |
| min | 0.0013ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0013ms | +0.000083ms | +6.42% |
| p50 | 0.0020ms | 0.0021ms | -0.00015ms | -6.78% |
| p95 | 0.02ms | 0.01ms | +0.00017ms | +1.15% |
| p99 | 0.02ms | 0.02ms | -0.00014ms | -0.62% |
| mean | 0.0041ms | 0.0043ms | -0.00023ms | -5.44% |
| min | 0.0013ms | 0.0011ms | +0.00013ms | +11.11% |
| max | 0.02ms | 0.02ms | +0.00033ms | +1.39% |
| total | 0.12ms | 0.13ms | -0.0070ms | -5.44% |

### oauth_flow (upsertUserFromProfile + issueSession)

# Perf Report — oauth_flow (upsertUserFromProfile + issueSession).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0029ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0041ms |
| stdev | 0.0033ms |
| min | 0.0018ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0020ms | -0.00012ms | -6.33% |
| p50 | 0.0029ms | 0.0022ms | +0.00071ms | +32.34% |
| p95 | 0.01ms | 0.0074ms | +0.0044ms | +59.66% |
| p99 | 0.01ms | 0.01ms | +0.0038ms | +36.40% |
| mean | 0.0041ms | 0.0034ms | +0.00072ms | +21.60% |
| min | 0.0018ms | 0.0019ms | -0.000084ms | -4.48% |
| max | 0.01ms | 0.01ms | +0.0033ms | +29.52% |
| total | 0.12ms | 0.10ms | +0.02ms | +21.60% |

### session_validate_loop (10x getSessionAndUser)

# Perf Report — session_validate_loop (10x getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0030ms |
| p99 | 0.0039ms |
| mean | 0.0025ms |
| stdev | 0.00038ms |
| min | 0.0022ms |
| max | 0.0042ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0021ms | +0.00017ms | +8.02% |
| p50 | 0.0024ms | 0.0022ms | +0.00015ms | +6.63% |
| p95 | 0.0030ms | 0.0028ms | +0.00026ms | +9.49% |
| p99 | 0.0039ms | 0.0029ms | +0.0010ms | +35.98% |
| mean | 0.0025ms | 0.0023ms | +0.00019ms | +8.27% |
| min | 0.0022ms | 0.0020ms | +0.00017ms | +8.35% |
| max | 0.0042ms | 0.0029ms | +0.0013ms | +44.90% |
| total | 0.07ms | 0.07ms | +0.0056ms | +8.27% |

