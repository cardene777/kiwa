# @kiwa-lab/go-lib

Go web framework request-response mock harness for kiwa — gin / echo / fiber / chi を統一 interface で in-process から叩ける test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/go-lib
# or
npm install -D @kiwa-lab/go-lib
# or
yarn add -D @kiwa-lab/go-lib
```

## Supported providers

| Framework | Status | Primary API |
|---|---|---|
| gin | ✅ Ready | `invokeGinHandler` |
| echo | ✅ Ready | `invokeEchoHandler` |
| fiber | ✅ Ready | `invokeFiberHandler` |
| chi | ✅ Ready | `captureChiRoute` |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import { createGoAppEnv, invokeGinHandler } from '@kiwa-lab/go-lib';

describe('gin handler', () => {
  it('GET /users/:id returns user', async () => {
    const env = createGoAppEnv({ framework: 'gin' });
    const handler = async (c: any) => c.json(200, { id: c.param('id') });
    const result = await invokeGinHandler({
      env,
      handler,
      request: { method: 'GET', path: '/users/42', params: { id: '42' } },
    });
    expect(result.response.status).toBe(200);
    expect(result.response.body).toEqual({ id: '42' });
  });
});
```

## API reference

- `createGoAppEnv({ framework: GoFramework }): GoAppEnv` — framework 別 mock env
- `invokeGinHandler({ env, handler, request }): Promise<InvokeGinHandlerResult>` — gin handler + context invoke
- `invokeEchoHandler({ env, handler, request }): Promise<InvokeEchoHandlerResult>` — echo handler + context invoke
- `invokeFiberHandler({ env, handler, request }): Promise<InvokeFiberHandlerResult>` — fiber handler + context invoke
- `captureChiRoute({ app, request }): Promise<CaptureChiRouteResult>` — chi router pattern matching + middleware trace

## Test integration

vitest + `/kiwa-go-lib` skill で Layer 1 spec (`tests/spec/go-lib/{module}.md`) から Layer 2 test を機械生成、 real Go runtime 不要で handler dispatch を contract level で verify。

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
