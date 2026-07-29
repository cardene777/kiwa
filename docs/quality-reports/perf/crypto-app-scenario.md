# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.07ms | 0.18ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.04ms | 0.05ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.84ms | 0.90ms | 1000ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.03ms | 0.07ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.03ms | 1.29ms | 500ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.31ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.21ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 3.72ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.14ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 5.24ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -19528 B | 0 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -4320 B | 0 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 664 B | -8352 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 712 B | -12680 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -8960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.07ms |
| p50 | 0.10ms |
| p95 | 0.18ms |
| p99 | 0.21ms |
| mean | 0.10ms |
| stdev | 0.04ms |
| min | 0.07ms |
| max | 0.22ms |
| total | 2.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.08ms | -0.0012ms | -1.61% |
| p50 | 0.10ms | 0.11ms | -0.01ms | -10.33% |
| p95 | 0.18ms | 0.25ms | -0.06ms | -24.61% |
| p99 | 0.21ms | 0.33ms | -0.12ms | -36.00% |
| mean | 0.10ms | 0.13ms | -0.03ms | -21.38% |
| min | 0.07ms | 0.07ms | +0.000042ms | +0.06% |
| max | 0.22ms | 0.35ms | -0.13ms | -37.97% |
| total | 2.03ms | 2.58ms | -0.55ms | -21.38% |

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
| stdev | 0.0046ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0014ms | +3.75% |
| p50 | 0.04ms | 0.04ms | -0.0020ms | -4.72% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -17.46% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -17.43% |
| mean | 0.04ms | 0.04ms | -0.0021ms | -4.59% |
| min | 0.04ms | 0.04ms | +0.0013ms | +3.46% |
| max | 0.05ms | 0.06ms | -0.01ms | -17.42% |
| total | 0.86ms | 0.90ms | -0.04ms | -4.59% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.84ms |
| p50 | 0.84ms |
| p95 | 0.90ms |
| p99 | 0.91ms |
| mean | 0.85ms |
| stdev | 0.02ms |
| min | 0.83ms |
| max | 0.92ms |
| total | 17.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.84ms | 0.82ms | +0.01ms | +1.81% |
| p50 | 0.84ms | 0.83ms | +0.02ms | +1.84% |
| p95 | 0.90ms | 1.02ms | -0.12ms | -12.16% |
| p99 | 0.91ms | 1.09ms | -0.17ms | -15.72% |
| mean | 0.85ms | 0.86ms | -0.01ms | -1.41% |
| min | 0.83ms | 0.81ms | +0.02ms | +2.87% |
| max | 0.92ms | 1.10ms | -0.18ms | -16.55% |
| total | 17.05ms | 17.30ms | -0.24ms | -1.41% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.07ms |
| p99 | 0.14ms |
| mean | 0.04ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.16ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00099ms | -3.08% |
| p50 | 0.03ms | 0.04ms | -0.0021ms | -5.79% |
| p95 | 0.07ms | 0.09ms | -0.02ms | -17.92% |
| p99 | 0.14ms | 0.18ms | -0.04ms | -20.90% |
| mean | 0.04ms | 0.05ms | -0.0051ms | -10.67% |
| min | 0.03ms | 0.03ms | +0.00017ms | +0.55% |
| max | 0.16ms | 0.21ms | -0.04ms | -21.21% |
| total | 0.86ms | 0.96ms | -0.10ms | -10.67% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.03ms |
| p50 | 1.09ms |
| p95 | 1.29ms |
| p99 | 1.29ms |
| mean | 1.11ms |
| stdev | 0.09ms |
| min | 1.03ms |
| max | 1.29ms |
| total | 22.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.03ms | 1.04ms | -0.01ms | -1.10% |
| p50 | 1.09ms | 1.18ms | -0.09ms | -7.59% |
| p95 | 1.29ms | 1.45ms | -0.16ms | -11.32% |
| p99 | 1.29ms | 1.67ms | -0.38ms | -22.76% |
| mean | 1.11ms | 1.21ms | -0.10ms | -8.03% |
| min | 1.03ms | 1.04ms | -0.01ms | -1.39% |
| max | 1.29ms | 1.73ms | -0.43ms | -25.16% |
| total | 22.22ms | 24.16ms | -1.94ms | -8.03% |

