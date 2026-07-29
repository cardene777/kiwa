# Perf Suite — auth-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.0015ms | 0.01ms | 20ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.0019ms | 0.01ms | 20ms | 0.00042ms | PASS | stable (p10 -4% (閾値未満)、 p95 +61% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| session_validate_loop (10x getSessionAndUser) | 0.0021ms | 0.0030ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | 0.01ms | 40ms | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 0.01ms | 40ms | PASS |
| session_validate_loop (10x getSessionAndUser) | 0.12ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| login_flow (createUser + issueSession + getSessionAndUser) | -53056 B | 0 B | 102400 B | yes | PASS |
| oauth_flow (upsertUserFromProfile + issueSession) | 7696 B | 0 B | 102400 B | yes | PASS |
| session_validate_loop (10x getSessionAndUser) | -1264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### login_flow (createUser + issueSession + getSessionAndUser)

# Perf Report — login_flow (createUser + issueSession + getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0018ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0036ms |
| stdev | 0.0036ms |
| min | 0.0014ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0014ms | +0.000083ms | +5.86% |
| p50 | 0.0018ms | 0.0016ms | +0.00017ms | +10.12% |
| p95 | 0.01ms | 0.01ms | -0.00013ms | -1.13% |
| p99 | 0.02ms | 0.01ms | +0.00058ms | +4.04% |
| mean | 0.0036ms | 0.0033ms | +0.00031ms | +9.41% |
| min | 0.0014ms | 0.0013ms | +0.000042ms | +3.15% |
| max | 0.02ms | 0.02ms | +0.00058ms | +3.83% |
| total | 0.11ms | 0.10ms | +0.0093ms | +9.41% |

### oauth_flow (upsertUserFromProfile + issueSession)

# Perf Report — oauth_flow (upsertUserFromProfile + issueSession).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0028ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0041ms |
| stdev | 0.0031ms |
| min | 0.0018ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0020ms | -0.000083ms | -4.24% |
| p50 | 0.0028ms | 0.0022ms | +0.00062ms | +28.54% |
| p95 | 0.01ms | 0.0069ms | +0.0042ms | +60.56% |
| p99 | 0.01ms | 0.0095ms | +0.0029ms | +30.67% |
| mean | 0.0041ms | 0.0030ms | +0.0011ms | +35.01% |
| min | 0.0018ms | 0.0019ms | -0.00013ms | -6.52% |
| max | 0.01ms | 0.01ms | +0.0023ms | +22.41% |
| total | 0.12ms | 0.09ms | +0.03ms | +35.01% |

### session_validate_loop (10x getSessionAndUser)

# Perf Report — session_validate_loop (10x getSessionAndUser).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0022ms |
| p95 | 0.0030ms |
| p99 | 0.0032ms |
| mean | 0.0023ms |
| stdev | 0.00030ms |
| min | 0.0021ms |
| max | 0.0033ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.000087ms | -3.94% |
| p50 | 0.0022ms | 0.0023ms | -0.000082ms | -3.58% |
| p95 | 0.0030ms | 0.0030ms | +0.000056ms | +1.88% |
| p99 | 0.0032ms | 0.0031ms | +0.00018ms | +5.75% |
| mean | 0.0023ms | 0.0024ms | -0.000055ms | -2.33% |
| min | 0.0021ms | 0.0021ms | -0.000042ms | -1.98% |
| max | 0.0033ms | 0.0031ms | +0.00025ms | +8.07% |
| total | 0.07ms | 0.07ms | -0.0017ms | -2.33% |

