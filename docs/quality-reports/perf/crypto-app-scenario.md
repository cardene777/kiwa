# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.61ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +187%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.07ms | 200ms | PASS | stable (差 0.08ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| kdf_password_batch (5 pbkdf2 derive+verify) | 1.29ms | 1000ms | PASS | stable — gate 無効 (regressionGate=false) |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.23ms | 100ms | PASS | stable (差 0.18ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 2.00ms | 500ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.36ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.21ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 5.72ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.14ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 10.08ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -2528 B | 45568 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -15880 B | 0 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 552 B | 0 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 712 B | -25880 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -3904 B | -16896 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.10ms |
| p95 | 0.61ms |
| p99 | 1.31ms |
| mean | 0.21ms |
| stdev | 0.32ms |
| min | 0.09ms |
| max | 1.49ms |
| total | 4.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.10ms | 0.07ms | +0.03ms | +37.16% |
| p95 | 0.61ms | 0.27ms | +0.35ms | +129.00% |
| p99 | 1.31ms | 0.50ms | +0.82ms | +164.79% |
| mean | 0.21ms | 0.11ms | +0.10ms | +97.56% |
| min | 0.09ms | 0.06ms | +0.03ms | +39.25% |
| max | 1.49ms | 0.71ms | +0.78ms | +110.07% |
| total | 4.24ms | 21.47ms | -17.23ms | -80.24% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.03ms | +0.01ms | +40.38% |
| p95 | 0.07ms | 0.15ms | -0.08ms | -53.47% |
| p99 | 0.07ms | 0.24ms | -0.17ms | -70.40% |
| mean | 0.05ms | 0.05ms | +0.00ms | +0.93% |
| min | 0.04ms | 0.03ms | +0.01ms | +40.16% |
| max | 0.07ms | 0.62ms | -0.55ms | -88.22% |
| total | 1.01ms | 9.98ms | -8.97ms | -89.91% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.93ms |
| p95 | 1.29ms |
| p99 | 1.56ms |
| mean | 1.00ms |
| stdev | 0.17ms |
| min | 0.93ms |
| max | 1.63ms |
| total | 19.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.93ms | 0.90ms | +0.04ms | +3.97% |
| p95 | 1.29ms | 1.43ms | -0.14ms | -9.51% |
| p99 | 1.56ms | 1.98ms | -0.41ms | -20.90% |
| mean | 1.00ms | 1.00ms | -0.00ms | -0.41% |
| min | 0.93ms | 0.85ms | +0.07ms | +8.41% |
| max | 1.63ms | 2.27ms | -0.64ms | -28.31% |
| total | 19.92ms | 200.00ms | -180.08ms | -90.04% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.09ms |
| p95 | 0.23ms |
| p99 | 0.27ms |
| mean | 0.09ms |
| stdev | 0.07ms |
| min | 0.04ms |
| max | 0.28ms |
| total | 1.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.09ms | 0.03ms | +0.05ms | +175.10% |
| p95 | 0.23ms | 0.06ms | +0.18ms | +298.32% |
| p99 | 0.27ms | 0.17ms | +0.10ms | +58.37% |
| mean | 0.09ms | 0.05ms | +0.04ms | +85.72% |
| min | 0.04ms | 0.03ms | +0.01ms | +30.23% |
| max | 0.28ms | 2.61ms | -2.34ms | -89.46% |
| total | 1.84ms | 9.92ms | -8.08ms | -81.43% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 1.18ms |
| p95 | 2.00ms |
| p99 | 2.26ms |
| mean | 1.28ms |
| stdev | 0.30ms |
| min | 1.16ms |
| max | 2.33ms |
| total | 25.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.18ms | 1.19ms | -0.00ms | -0.11% |
| p95 | 2.00ms | 2.26ms | -0.26ms | -11.56% |
| p99 | 2.26ms | 2.81ms | -0.55ms | -19.47% |
| mean | 1.28ms | 1.37ms | -0.09ms | -6.30% |
| min | 1.16ms | 1.09ms | +0.07ms | +6.64% |
| max | 2.33ms | 3.30ms | -0.97ms | -29.48% |
| total | 25.66ms | 273.84ms | -248.18ms | -90.63% |

