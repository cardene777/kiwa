# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.10ms | 100ms | PASS | improved |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.07ms | 200ms | PASS | stable |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.84ms | 1000ms | PASS | n/a (baseline seeded) |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.05ms | 100ms | PASS | n/a (baseline seeded) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.06ms | 500ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.30ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.17ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 3.26ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.13ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 4.26ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 1129432 B | 45568 B | 102400 B | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 365592 B | 14192 B | 102400 B | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 320288 B | 1600 B | 102400 B | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 394368 B | 4400 B | 102400 B | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -7674296 B | -358196 B | 102400 B | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.09ms |
| p95 | 0.10ms |
| p99 | 0.11ms |
| mean | 0.09ms |
| stdev | 0.01ms |
| min | 0.07ms |
| max | 0.12ms |
| total | 1.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.09ms | 0.11ms | -0.02ms | -15.90% |
| p95 | 0.10ms | 0.27ms | -0.17ms | -61.84% |
| p99 | 0.11ms | 0.36ms | -0.25ms | -68.47% |
| mean | 0.09ms | 0.12ms | -0.03ms | -28.28% |
| min | 0.07ms | 0.08ms | -0.01ms | -11.93% |
| max | 0.12ms | 0.39ms | -0.27ms | -69.64% |
| total | 1.76ms | 2.45ms | -0.69ms | -28.28% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.20ms |
| mean | 0.05ms |
| stdev | 0.04ms |
| min | 0.03ms |
| max | 0.23ms |
| total | 0.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.01ms | -13.95% |
| p95 | 0.07ms | 0.05ms | +0.01ms | +21.85% |
| p99 | 0.20ms | 0.06ms | +0.14ms | +230.66% |
| mean | 0.05ms | 0.05ms | +0.00ms | +8.54% |
| min | 0.03ms | 0.04ms | -0.01ms | -14.00% |
| max | 0.23ms | 0.06ms | +0.17ms | +277.42% |
| total | 0.98ms | 0.90ms | +0.08ms | +8.54% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.81ms |
| p95 | 0.84ms |
| p99 | 0.85ms |
| mean | 0.81ms |
| stdev | 0.01ms |
| min | 0.80ms |
| max | 0.85ms |
| total | 16.26ms |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.13ms |
| mean | 0.04ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.15ms |
| total | 0.79ms |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 1.02ms |
| p95 | 1.06ms |
| p99 | 1.11ms |
| mean | 1.03ms |
| stdev | 0.03ms |
| min | 1.00ms |
| max | 1.13ms |
| total | 20.53ms |

