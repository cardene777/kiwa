# @kiwa-lab/rust-lib

Rust web framework mock harness for kiwa — axum / actix-web / tower-http / rocket を統一 interface で invoke する in-process mock。

## API

- `createRustAppEnv({ framework })` = framework 別 mock app env (route registry + response capture)
- `invokeAxumHandler({ handler, method, path, body, headers })` = axum-style async handler invoke
- `invokeActixHandler({ handler, method, path, body })` = actix-web-style handler invoke
- `captureTowerMiddleware({ middleware, request })` = tower service layer capture
- `invokeRocketRoute({ route, method, path })` = rocket route invoke
