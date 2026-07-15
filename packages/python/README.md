# @kiwa-lab/python

Python web framework mock harness for kiwa — Django / Flask / FastAPI / Starlette の request-response cycle を TypeScript から in-process で叩く test infra。 real Python runtime 不要。

## Installation

```bash
pnpm add -D @kiwa-lab/python
# or
npm install -D @kiwa-lab/python
# or
yarn add -D @kiwa-lab/python
```

## Supported frameworks

| Framework | Mode | Status |
|---|---|---|
| Django | WSGI | ✅ |
| Flask | WSGI | ✅ |
| FastAPI | ASGI | ✅ |
| Starlette | ASGI | ✅ |

## Quick start

```ts
import {
  createPythonAppEnv,
  dispatchRequest,
  renderTemplate,
  captureMiddlewareCall,
} from '@kiwa-lab/python';

const env = createPythonAppEnv({ framework: 'fastapi' });

env.route('GET', '/users/{id}', async (req) => ({
  status: 200,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ id: req.pathParams?.id, name: 'kiwa' }),
}));

const res = await dispatchRequest(env, {
  method: 'GET', path: '/users/u1',
});
// res = { status: 200, headers, body: '{"id":"u1","name":"kiwa"}' }

const rendered = renderTemplate('<h1>{{name}}</h1>', { name: 'kiwa' });
const middlewareCalls = captureMiddlewareCall(env);
```

## API reference

- `createPythonAppEnv(options: CreatePythonAppEnvOptions): PythonAppEnv` — WSGI / ASGI mock env 生成
- `PythonAppEnv.route(method, path, handler): void` — route 登録
- `PythonAppEnv.use(middleware): void` — middleware 登録
- `dispatchRequest(env, req: PythonRequest): Promise<PythonResponse>` — request → response cycle
- `renderTemplate(template: string, ctx: TemplateContext): TemplateRenderResult` — Jinja2 相当 `{{var}}` interpolation
- `captureMiddlewareCall(env): MiddlewareCall[]` — middleware 実行履歴

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createPythonAppEnv, dispatchRequest } from '@kiwa-lab/python';

describe('fastapi users endpoint', () => {
  it('GET /users/u1 = 200', async () => {
    const env = createPythonAppEnv({ framework: 'fastapi' });
    env.route('GET', '/users/{id}', async () => ({ status: 200, body: 'ok' }));
    const r = await dispatchRequest(env, { method: 'GET', path: '/users/u1' });
    expect(r.status).toBe(200);
  });
});
```

`/kiwa-python` skill を起動すると request / template / middleware 3 経路の test を生成できる。

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
