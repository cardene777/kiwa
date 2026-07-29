# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.06ms | 0.11ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.03ms | 0.05ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.79ms | 0.90ms | 1000ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.03ms | 0.07ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.01ms | 1.11ms | 500ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.29ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.30ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 3.39ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.15ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 4.27ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -19440 B | 0 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -3808 B | -9740 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 664 B | 0 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 616 B | -12240 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -8960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.09ms |
| p95 | 0.11ms |
| p99 | 0.12ms |
| mean | 0.09ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.13ms |
| total | 1.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.08ms | -0.01ms | -15.87% |
| p50 | 0.09ms | 0.11ms | -0.02ms | -17.91% |
| p95 | 0.11ms | 0.25ms | -0.14ms | -56.04% |
| p99 | 0.12ms | 0.33ms | -0.21ms | -62.74% |
| mean | 0.09ms | 0.13ms | -0.04ms | -33.10% |
| min | 0.06ms | 0.07ms | -0.0076ms | -10.83% |
| max | 0.13ms | 0.35ms | -0.23ms | -63.90% |
| total | 1.72ms | 2.58ms | -0.85ms | -33.10% |

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
| stdev | 0.0058ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0019ms | -5.18% |
| p50 | 0.04ms | 0.04ms | -0.0045ms | -10.30% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -18.80% |
| p99 | 0.05ms | 0.06ms | -0.0082ms | -13.31% |
| mean | 0.04ms | 0.04ms | -0.0041ms | -9.07% |
| min | 0.03ms | 0.04ms | -0.0021ms | -5.76% |
| max | 0.05ms | 0.06ms | -0.0074ms | -11.95% |
| total | 0.82ms | 0.90ms | -0.08ms | -9.07% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.79ms |
| p50 | 0.81ms |
| p95 | 0.90ms |
| p99 | 0.92ms |
| mean | 0.82ms |
| stdev | 0.04ms |
| min | 0.79ms |
| max | 0.92ms |
| total | 16.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.79ms | 0.82ms | -0.03ms | -3.52% |
| p50 | 0.81ms | 0.83ms | -0.02ms | -2.16% |
| p95 | 0.90ms | 1.02ms | -0.12ms | -12.11% |
| p99 | 0.92ms | 1.09ms | -0.17ms | -15.47% |
| mean | 0.82ms | 0.86ms | -0.04ms | -4.61% |
| min | 0.79ms | 0.81ms | -0.02ms | -2.37% |
| max | 0.92ms | 1.10ms | -0.18ms | -16.25% |
| total | 16.50ms | 17.30ms | -0.80ms | -4.61% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 0.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0017ms | -5.20% |
| p50 | 0.03ms | 0.04ms | -0.0020ms | -5.56% |
| p95 | 0.07ms | 0.09ms | -0.01ms | -15.36% |
| p99 | 0.08ms | 0.18ms | -0.10ms | -53.16% |
| mean | 0.04ms | 0.05ms | -0.0088ms | -18.40% |
| min | 0.03ms | 0.03ms | -0.00046ms | -1.53% |
| max | 0.09ms | 0.21ms | -0.12ms | -57.09% |
| total | 0.78ms | 0.96ms | -0.18ms | -18.40% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.01ms |
| p50 | 1.03ms |
| p95 | 1.11ms |
| p99 | 1.14ms |
| mean | 1.04ms |
| stdev | 0.04ms |
| min | 1.00ms |
| max | 1.14ms |
| total | 20.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.01ms | 1.04ms | -0.03ms | -3.03% |
| p50 | 1.03ms | 1.18ms | -0.15ms | -12.79% |
| p95 | 1.11ms | 1.45ms | -0.34ms | -23.54% |
| p99 | 1.14ms | 1.67ms | -0.54ms | -32.06% |
| mean | 1.04ms | 1.21ms | -0.17ms | -13.74% |
| min | 1.00ms | 1.04ms | -0.04ms | -3.89% |
| max | 1.14ms | 1.73ms | -0.59ms | -33.85% |
| total | 20.84ms | 24.16ms | -3.32ms | -13.74% |

