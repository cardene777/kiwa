# @kiwa-lab/rust-lib

Rust web framework request-response mock harness for kiwa — axum / actix-web / tower-http / rocket を統一 interface で in-process から叩ける test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/rust-lib
# or
npm install -D @kiwa-lab/rust-lib
# or
yarn add -D @kiwa-lab/rust-lib
```

## Supported providers

| Framework | Status | Primary API |
|---|---|---|
| axum | ✅ Ready | `invokeAxumHandler` |
| actix-web | ✅ Ready | `invokeActixHandler` |
| tower-http | ✅ Ready | `captureTowerMiddleware` |
| rocket | ✅ Ready | `invokeRocketRoute` |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import { createRustAppEnv, invokeAxumHandler } from '@kiwa-lab/rust-lib';

describe('axum handler', () => {
  it('GET /health returns ok', async () => {
    const env = createRustAppEnv({ framework: 'axum' });
    const handler = async () => ({ status: 200, body: { ok: true } });
    const result = await invokeAxumHandler({
      env,
      handler,
      request: { method: 'GET', path: '/health' },
    });
    expect(result.response.status).toBe(200);
  });
});
```

## API reference

- `createRustAppEnv({ framework: RustFramework }): RustAppEnv` — framework 別 mock env
- `invokeAxumHandler({ env, handler, request }): Promise<InvokeAxumResult>` — axum handler direct invoke
- `invokeActixHandler({ env, handler, request }): Promise<InvokeActixResult>` — actix service invoke
- `captureTowerMiddleware({ middleware, request }): Promise<TowerTrace>` — tower service layer trace
- `invokeRocketRoute({ env, route, request }): Promise<InvokeRocketResult>` — rocket route invoke

## Test integration

vitest + `/kiwa-rust-lib` skill で Layer 1 spec (`tests/spec/rust-lib/{module}.md`) から Layer 2 test を機械生成、 real Rust runtime 不要で contract level で verify。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/languages/rust-lib/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/languages/rust-lib/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/languages/rust-lib/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/languages/rust-lib/reference)

編集元は [docs/libraries/languages/rust-lib](../../docs/libraries/languages/rust-lib/) です。
<!-- kiwa-docs:end -->

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
