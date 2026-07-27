# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.11ms | 100ms | PASS | stable |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.04ms | 200ms | PASS | stable |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.89ms | 1000ms | PASS | stable |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.10ms | 100ms | PASS | stable |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.66ms | 500ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.29ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.18ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 3.64ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.15ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 5.02ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 488 B | 0 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -13368 B | 0 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 6512 B | -9616 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 5392 B | -13152 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -6712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.09ms |
| p95 | 0.11ms |
| p99 | 0.12ms |
| mean | 0.09ms |
| stdev | 0.02ms |
| min | 0.07ms |
| max | 0.13ms |
| total | 1.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.09ms | 0.10ms | -0.01ms | -13.80% |
| p95 | 0.11ms | 0.47ms | -0.36ms | -77.23% |
| p99 | 0.12ms | 0.55ms | -0.43ms | -77.46% |
| mean | 0.09ms | 0.16ms | -0.07ms | -43.83% |
| min | 0.07ms | 0.08ms | -0.01ms | -11.40% |
| max | 0.13ms | 0.57ms | -0.44ms | -77.51% |
| total | 1.75ms | 3.12ms | -1.37ms | -43.83% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.01ms | -16.33% |
| p95 | 0.04ms | 0.06ms | -0.02ms | -26.94% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -20.73% |
| mean | 0.04ms | 0.04ms | -0.01ms | -15.83% |
| min | 0.03ms | 0.04ms | -0.00ms | -10.99% |
| max | 0.05ms | 0.06ms | -0.01ms | -19.18% |
| total | 0.74ms | 0.88ms | -0.14ms | -15.83% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.83ms |
| p95 | 0.89ms |
| p99 | 0.92ms |
| mean | 0.84ms |
| stdev | 0.03ms |
| min | 0.81ms |
| max | 0.93ms |
| total | 16.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.83ms | 0.84ms | -0.01ms | -1.65% |
| p95 | 0.89ms | 0.97ms | -0.08ms | -8.15% |
| p99 | 0.92ms | 0.99ms | -0.07ms | -6.71% |
| mean | 0.84ms | 0.87ms | -0.03ms | -3.45% |
| min | 0.81ms | 0.82ms | -0.00ms | -0.56% |
| max | 0.93ms | 0.99ms | -0.06ms | -6.36% |
| total | 16.82ms | 17.43ms | -0.60ms | -3.45% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.10ms |
| p99 | 0.13ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.14ms |
| total | 0.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -7.19% |
| p95 | 0.10ms | 0.06ms | +0.04ms | +70.04% |
| p99 | 0.13ms | 0.15ms | -0.02ms | -13.46% |
| mean | 0.05ms | 0.05ms | -0.00ms | -4.23% |
| min | 0.03ms | 0.04ms | -0.00ms | -9.47% |
| max | 0.14ms | 0.18ms | -0.04ms | -19.98% |
| total | 0.90ms | 0.94ms | -0.04ms | -4.23% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 1.17ms |
| p95 | 1.66ms |
| p99 | 1.73ms |
| mean | 1.21ms |
| stdev | 0.18ms |
| min | 1.03ms |
| max | 1.75ms |
| total | 24.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.17ms | 1.20ms | -0.03ms | -2.53% |
| p95 | 1.66ms | 1.46ms | +0.20ms | +13.33% |
| p99 | 1.73ms | 1.48ms | +0.25ms | +17.10% |
| mean | 1.21ms | 1.25ms | -0.04ms | -2.99% |
| min | 1.03ms | 1.07ms | -0.04ms | -3.95% |
| max | 1.75ms | 1.48ms | +0.27ms | +18.03% |
| total | 24.24ms | 24.98ms | -0.75ms | -2.99% |

