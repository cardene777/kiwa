# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.18ms | 100ms | PASS | stable |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.05ms | 200ms | PASS | stable |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.89ms | 1000ms | PASS | stable |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.07ms | 100ms | PASS | stable |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.11ms | 500ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.32ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.19ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 3.33ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.14ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 4.41ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 120 B | 0 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -12632 B | 0 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 7840 B | 0 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 2520 B | -13260 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -6712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.10ms |
| p95 | 0.18ms |
| p99 | 0.23ms |
| mean | 0.11ms |
| stdev | 0.04ms |
| min | 0.07ms |
| max | 0.24ms |
| total | 2.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.10ms | 0.10ms | -0.00ms | -4.37% |
| p95 | 0.18ms | 0.47ms | -0.29ms | -62.49% |
| p99 | 0.23ms | 0.55ms | -0.32ms | -58.91% |
| mean | 0.11ms | 0.16ms | -0.05ms | -32.60% |
| min | 0.07ms | 0.08ms | -0.01ms | -10.03% |
| max | 0.24ms | 0.57ms | -0.33ms | -58.17% |
| total | 2.10ms | 3.12ms | -1.02ms | -32.60% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.01ms | -16.77% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -24.81% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -11.65% |
| mean | 0.04ms | 0.04ms | -0.01ms | -13.81% |
| min | 0.03ms | 0.04ms | -0.00ms | -11.43% |
| max | 0.06ms | 0.06ms | -0.01ms | -8.38% |
| total | 0.76ms | 0.88ms | -0.12ms | -13.81% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.82ms |
| p95 | 0.89ms |
| p99 | 0.91ms |
| mean | 0.83ms |
| stdev | 0.03ms |
| min | 0.80ms |
| max | 0.91ms |
| total | 16.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.82ms | 0.84ms | -0.02ms | -2.78% |
| p95 | 0.89ms | 0.97ms | -0.08ms | -8.52% |
| p99 | 0.91ms | 0.99ms | -0.08ms | -8.01% |
| mean | 0.83ms | 0.87ms | -0.04ms | -4.53% |
| min | 0.80ms | 0.82ms | -0.01ms | -1.84% |
| max | 0.91ms | 0.99ms | -0.08ms | -7.89% |
| total | 16.64ms | 17.43ms | -0.79ms | -4.53% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 0.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.01ms | -17.52% |
| p95 | 0.07ms | 0.06ms | +0.02ms | +33.59% |
| p99 | 0.08ms | 0.15ms | -0.07ms | -47.66% |
| mean | 0.04ms | 0.05ms | -0.01ms | -17.96% |
| min | 0.03ms | 0.04ms | -0.01ms | -14.44% |
| max | 0.08ms | 0.18ms | -0.10ms | -54.00% |
| total | 0.77ms | 0.94ms | -0.17ms | -17.96% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 1.05ms |
| p95 | 1.11ms |
| p99 | 1.13ms |
| mean | 1.05ms |
| stdev | 0.03ms |
| min | 1.00ms |
| max | 1.13ms |
| total | 21.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.05ms | 1.20ms | -0.16ms | -13.02% |
| p95 | 1.11ms | 1.46ms | -0.35ms | -23.92% |
| p99 | 1.13ms | 1.48ms | -0.35ms | -23.69% |
| mean | 1.05ms | 1.25ms | -0.20ms | -15.63% |
| min | 1.00ms | 1.07ms | -0.07ms | -6.29% |
| max | 1.13ms | 1.48ms | -0.35ms | -23.64% |
| total | 21.08ms | 24.98ms | -3.90ms | -15.63% |

