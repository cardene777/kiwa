# @kiwa-lab/python API reference

## Overview

`@kiwa-lab/python` は Django / Flask / FastAPI / Starlette 4 framework を統一 interface で mock する Python web framework test infra。 real Python runtime 不要で TypeScript から Python framework 相当の request-response cycle + template render + middleware chain を叩ける。

## Supported frameworks

| framework | mode | template engine | ASGI/WSGI |
|---|---|---|---|
| django | WSGI/ASGI | DTL (Django Template Language) | both |
| flask | WSGI | Jinja2 | WSGI |
| fastapi | ASGI | Jinja2 (optional) | ASGI |
| starlette | ASGI | Jinja2 (optional) | ASGI |

## Main API

### `createPythonAppEnv(options: CreatePythonAppEnvOptions): PythonAppEnv`

`{ framework, mode?, routes?, middlewares?, templates? }` で mock app env 生成。

### `dispatchRequest(env, request: PythonRequest): PythonResponse`

`{ method, path, headers?, body?, query? }` を受け取り `{ status, headers, body, contentType }` を返す。 middleware chain 通過 + handler 実行。

### `renderTemplate(env, template: string, context: TemplateContext): TemplateRenderResult`

Jinja2 / DTL 相当の `{{ var }}` + `{% if %}` interpolation。 `{ html, variables, missing }` を返す。

### `captureMiddlewareCall(env): MiddlewareCall[]`

middleware chain の実行 log を snapshot、 `[{ name, request, response, elapsedMs }]` を返す。 test で「middleware N が呼ばれた順序」 を verify。

## Types

- `PythonFramework = 'django' | 'flask' | 'fastapi' | 'starlette'`
- `PythonMode = 'wsgi' | 'asgi'`
- `PythonRequest` = `{ method, path, headers?, body?, query? }`
- `PythonResponse` = `{ status, headers, body, contentType }`
- `TemplateContext = Record<string, unknown>`

## Usage examples

### FastAPI endpoint dispatch

```typescript
import { createPythonAppEnv, dispatchRequest } from '@kiwa-lab/python';
import { describe, expect, it } from 'vitest';

describe('/users/{id} endpoint', () => {
  it('GET /users/1 で 200 + JSON body', () => {
    const env = createPythonAppEnv({
      framework: 'fastapi',
      routes: [
        {
          method: 'GET',
          path: '/users/{id}',
          handler: (req) => ({ status: 200, body: JSON.stringify({ id: req.pathParams.id, name: 'kiwa' }) }),
        },
      ],
    });
    const res = dispatchRequest(env, { method: 'GET', path: '/users/1' });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ id: '1', name: 'kiwa' });
  });
});
```

### Middleware chain trace

```typescript
import { createPythonAppEnv, dispatchRequest, captureMiddlewareCall } from '@kiwa-lab/python';

const env = createPythonAppEnv({
  framework: 'django',
  middlewares: [
    { name: 'AuthMiddleware', fn: (req, next) => next({ ...req, user: 'u1' }) },
    { name: 'LoggingMiddleware', fn: (req, next) => next(req) },
  ],
  routes: [{ method: 'GET', path: '/me', handler: (req) => ({ status: 200, body: req.user }) }],
});
dispatchRequest(env, { method: 'GET', path: '/me' });
const calls = captureMiddlewareCall(env);
expect(calls.map((c) => c.name)).toEqual(['AuthMiddleware', 'LoggingMiddleware']);
```

## Related skills

- [`/kiwa-python`](../skills/kiwa-python) — Python framework test 生成 skill
