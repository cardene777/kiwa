# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.07ms | 0.16ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.03ms | 0.05ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.81ms | 0.92ms | 1000ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.03ms | 0.05ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.02ms | 1.21ms | 500ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.34ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.19ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 3.38ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.14ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 4.28ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -20056 B | 0 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -3840 B | 0 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 664 B | 0 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 712 B | -13448 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -8960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.07ms |
| p50 | 0.09ms |
| p95 | 0.16ms |
| p99 | 0.18ms |
| mean | 0.10ms |
| stdev | 0.03ms |
| min | 0.07ms |
| max | 0.18ms |
| total | 1.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.08ms | -0.0047ms | -6.25% |
| p50 | 0.09ms | 0.11ms | -0.01ms | -13.53% |
| p95 | 0.16ms | 0.25ms | -0.09ms | -34.95% |
| p99 | 0.18ms | 0.33ms | -0.16ms | -47.05% |
| mean | 0.10ms | 0.13ms | -0.03ms | -24.35% |
| min | 0.07ms | 0.07ms | -0.0046ms | -6.51% |
| max | 0.18ms | 0.35ms | -0.17ms | -49.14% |
| total | 1.95ms | 2.58ms | -0.63ms | -24.35% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0041ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0020ms | -5.49% |
| p50 | 0.04ms | 0.04ms | -0.0055ms | -12.66% |
| p95 | 0.05ms | 0.06ms | -0.02ms | -25.44% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -23.29% |
| mean | 0.04ms | 0.04ms | -0.0057ms | -12.62% |
| min | 0.03ms | 0.04ms | -0.0021ms | -5.76% |
| max | 0.05ms | 0.06ms | -0.01ms | -22.76% |
| total | 0.79ms | 0.90ms | -0.11ms | -12.62% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.81ms |
| p50 | 0.82ms |
| p95 | 0.92ms |
| p99 | 0.95ms |
| mean | 0.84ms |
| stdev | 0.04ms |
| min | 0.80ms |
| max | 0.96ms |
| total | 16.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.81ms | 0.82ms | -0.01ms | -1.45% |
| p50 | 0.82ms | 0.83ms | -0.01ms | -1.22% |
| p95 | 0.92ms | 1.02ms | -0.10ms | -9.74% |
| p99 | 0.95ms | 1.09ms | -0.13ms | -12.00% |
| mean | 0.84ms | 0.86ms | -0.03ms | -3.31% |
| min | 0.80ms | 0.81ms | -0.0046ms | -0.57% |
| max | 0.96ms | 1.10ms | -0.14ms | -12.52% |
| total | 16.72ms | 17.30ms | -0.57ms | -3.31% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.15ms |
| mean | 0.04ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.17ms |
| total | 0.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.000047ms | -0.15% |
| p50 | 0.03ms | 0.04ms | -0.0013ms | -3.51% |
| p95 | 0.05ms | 0.09ms | -0.04ms | -41.09% |
| p99 | 0.15ms | 0.18ms | -0.03ms | -19.31% |
| mean | 0.04ms | 0.05ms | -0.0060ms | -12.57% |
| min | 0.03ms | 0.03ms | +0.0012ms | +3.89% |
| max | 0.17ms | 0.21ms | -0.03ms | -17.05% |
| total | 0.84ms | 0.96ms | -0.12ms | -12.57% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.02ms |
| p50 | 1.04ms |
| p95 | 1.21ms |
| p99 | 1.26ms |
| mean | 1.08ms |
| stdev | 0.07ms |
| min | 1.00ms |
| max | 1.28ms |
| total | 21.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.02ms | 1.04ms | -0.02ms | -1.62% |
| p50 | 1.04ms | 1.18ms | -0.14ms | -11.82% |
| p95 | 1.21ms | 1.45ms | -0.24ms | -16.39% |
| p99 | 1.26ms | 1.67ms | -0.41ms | -24.47% |
| mean | 1.08ms | 1.21ms | -0.13ms | -10.53% |
| min | 1.00ms | 1.04ms | -0.04ms | -4.11% |
| max | 1.28ms | 1.73ms | -0.45ms | -26.17% |
| total | 21.62ms | 24.16ms | -2.54ms | -10.53% |

