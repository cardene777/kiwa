# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.23ms | 100ms | PASS | stable |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.05ms | 200ms | PASS | stable |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.96ms | 1000ms | PASS | stable |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.09ms | 100ms | PASS | stable |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.24ms | 500ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.31ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.20ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 3.71ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.16ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 4.86ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -960 B | 0 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -2312 B | 0 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 8248 B | 0 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 5488 B | -14228 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -6808 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.10ms |
| p95 | 0.23ms |
| p99 | 0.23ms |
| mean | 0.11ms |
| stdev | 0.05ms |
| min | 0.07ms |
| max | 0.24ms |
| total | 2.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.10ms | 0.10ms | +0.00ms | +1.29% |
| p95 | 0.23ms | 0.47ms | -0.24ms | -51.76% |
| p99 | 0.23ms | 0.55ms | -0.32ms | -57.61% |
| mean | 0.11ms | 0.16ms | -0.04ms | -27.84% |
| min | 0.07ms | 0.08ms | -0.01ms | -7.12% |
| max | 0.24ms | 0.57ms | -0.34ms | -58.81% |
| total | 2.25ms | 3.12ms | -0.87ms | -27.84% |

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
| min | 0.04ms |
| max | 0.06ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -10.19% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -15.17% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -9.84% |
| mean | 0.04ms | 0.04ms | -0.00ms | -7.12% |
| min | 0.04ms | 0.04ms | -0.00ms | -3.02% |
| max | 0.06ms | 0.06ms | -0.01ms | -8.52% |
| total | 0.82ms | 0.88ms | -0.06ms | -7.12% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.87ms |
| p95 | 0.96ms |
| p99 | 1.12ms |
| mean | 0.90ms |
| stdev | 0.07ms |
| min | 0.86ms |
| max | 1.16ms |
| total | 17.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.87ms | 0.84ms | +0.03ms | +3.30% |
| p95 | 0.96ms | 0.97ms | -0.01ms | -1.04% |
| p99 | 1.12ms | 0.99ms | +0.14ms | +13.81% |
| mean | 0.90ms | 0.87ms | +0.02ms | +2.77% |
| min | 0.86ms | 0.82ms | +0.04ms | +4.79% |
| max | 1.16ms | 0.99ms | +0.17ms | +17.44% |
| total | 17.91ms | 17.43ms | +0.48ms | +2.77% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.09ms |
| p99 | 0.11ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.12ms |
| total | 0.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -9.34% |
| p95 | 0.09ms | 0.06ms | +0.03ms | +54.06% |
| p99 | 0.11ms | 0.15ms | -0.04ms | -28.25% |
| mean | 0.04ms | 0.05ms | -0.00ms | -7.00% |
| min | 0.03ms | 0.04ms | -0.00ms | -8.76% |
| max | 0.12ms | 0.18ms | -0.06ms | -34.67% |
| total | 0.88ms | 0.94ms | -0.07ms | -7.00% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 1.13ms |
| p95 | 1.24ms |
| p99 | 1.52ms |
| mean | 1.16ms |
| stdev | 0.11ms |
| min | 1.10ms |
| max | 1.59ms |
| total | 23.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.13ms | 1.20ms | -0.07ms | -5.85% |
| p95 | 1.24ms | 1.46ms | -0.22ms | -15.02% |
| p99 | 1.52ms | 1.48ms | +0.04ms | +2.70% |
| mean | 1.16ms | 1.25ms | -0.09ms | -7.24% |
| min | 1.10ms | 1.07ms | +0.03ms | +2.68% |
| max | 1.59ms | 1.48ms | +0.10ms | +7.08% |
| total | 23.18ms | 24.98ms | -1.81ms | -7.24% |

