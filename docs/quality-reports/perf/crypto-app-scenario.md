# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.07ms | 0.38ms | 100ms | 0.00050ms | PASS | stable (p10 -10% (閾値未満)、 p95 +56% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.04ms | 0.05ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.94ms | 1.44ms | 1000ms | 0.00050ms | PASS | stable (p10 +14% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.03ms | 0.30ms | 100ms | 0.00050ms | PASS | stable (p10 +3% (閾値未満)、 p95 +247% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.05ms | 1.64ms | 500ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.33ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.38ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 5.09ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.51ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 7.76ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -20528 B | -107392 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -3808 B | -29704 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 664 B | -288 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 712 B | -20168 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -9056 B | -456192 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.07ms |
| p50 | 0.10ms |
| p95 | 0.38ms |
| p99 | 0.56ms |
| mean | 0.15ms |
| stdev | 0.14ms |
| min | 0.07ms |
| max | 0.60ms |
| total | 3.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.08ms | -0.0074ms | -9.74% |
| p50 | 0.10ms | 0.11ms | -0.0082ms | -7.74% |
| p95 | 0.38ms | 0.25ms | +0.14ms | +56.12% |
| p99 | 0.56ms | 0.33ms | +0.22ms | +67.71% |
| mean | 0.15ms | 0.13ms | +0.02ms | +18.62% |
| min | 0.07ms | 0.07ms | -0.0047ms | -6.75% |
| max | 0.60ms | 0.35ms | +0.25ms | +69.71% |
| total | 3.06ms | 2.58ms | +0.48ms | +18.62% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0049ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.00060ms | +1.64% |
| p50 | 0.04ms | 0.04ms | -0.0032ms | -7.32% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -18.24% |
| p99 | 0.05ms | 0.06ms | -0.0083ms | -13.52% |
| mean | 0.04ms | 0.04ms | -0.0027ms | -6.08% |
| min | 0.04ms | 0.04ms | +0.00058ms | +1.61% |
| max | 0.05ms | 0.06ms | -0.0076ms | -12.36% |
| total | 0.85ms | 0.90ms | -0.05ms | -6.08% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.94ms |
| p50 | 1.04ms |
| p95 | 1.44ms |
| p99 | 1.69ms |
| mean | 1.09ms |
| stdev | 0.20ms |
| min | 0.93ms |
| max | 1.75ms |
| total | 21.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.94ms | 0.82ms | +0.12ms | +14.14% |
| p50 | 1.04ms | 0.83ms | +0.21ms | +25.87% |
| p95 | 1.44ms | 1.02ms | +0.42ms | +41.56% |
| p99 | 1.69ms | 1.09ms | +0.60ms | +55.52% |
| mean | 1.09ms | 0.86ms | +0.23ms | +26.33% |
| min | 0.93ms | 0.81ms | +0.12ms | +14.71% |
| max | 1.75ms | 1.10ms | +0.65ms | +58.75% |
| total | 21.85ms | 17.30ms | +4.55ms | +26.33% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.05ms |
| p95 | 0.30ms |
| p99 | 0.36ms |
| mean | 0.10ms |
| stdev | 0.10ms |
| min | 0.03ms |
| max | 0.38ms |
| total | 2.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00088ms | +2.74% |
| p50 | 0.05ms | 0.04ms | +0.02ms | +47.86% |
| p95 | 0.30ms | 0.09ms | +0.21ms | +246.56% |
| p99 | 0.36ms | 0.18ms | +0.18ms | +100.51% |
| mean | 0.10ms | 0.05ms | +0.05ms | +113.63% |
| min | 0.03ms | 0.03ms | +0.0025ms | +8.33% |
| max | 0.38ms | 0.21ms | +0.18ms | +85.33% |
| total | 2.05ms | 0.96ms | +1.09ms | +113.63% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.05ms |
| p50 | 1.12ms |
| p95 | 1.64ms |
| p99 | 2.06ms |
| mean | 1.19ms |
| stdev | 0.26ms |
| min | 1.04ms |
| max | 2.16ms |
| total | 23.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.05ms | 1.04ms | +0.0095ms | +0.91% |
| p50 | 1.12ms | 1.18ms | -0.06ms | -5.44% |
| p95 | 1.64ms | 1.45ms | +0.19ms | +12.92% |
| p99 | 2.06ms | 1.67ms | +0.38ms | +22.91% |
| mean | 1.19ms | 1.21ms | -0.02ms | -1.70% |
| min | 1.04ms | 1.04ms | -0.0020ms | -0.19% |
| max | 2.16ms | 1.73ms | +0.43ms | +25.01% |
| total | 23.75ms | 24.16ms | -0.41ms | -1.70% |

