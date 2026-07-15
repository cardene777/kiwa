# @kiwa-lab/ruby API reference

## Overview

`@kiwa-lab/ruby` は Rails / Sinatra / Roda / Hanami 4 framework を統一 interface で mock する Ruby framework test infra。 controller action + ERB render + ActiveRecord query snapshot を real Ruby runtime 不要で叩ける。

## Supported frameworks

| framework | controller pattern | template | ORM |
|---|---|---|---|
| rails | class < ApplicationController | ERB / Haml | ActiveRecord |
| sinatra | get/post block | ERB / Slim | (any) |
| roda | route tree | ERB | (any) |
| hanami | Action class | ERB / Haml / Slim | ROM / Sequel |

## Main API

### `createRubyAppEnv(options: CreateRubyAppEnvOptions): RubyAppEnv`

`{ framework, routes, controllers?, activeRecord? }` で mock env 生成。

### `dispatchRailsRequest(env, request): RailsDispatchResult`

Rails 特化 dispatch、 `{ status, body, headers, renderCalls, redirectSignal?, activeRecordOps }` を返す。 `render :json / render :html / redirect_to` を捕捉。

### `dispatchGenericRequest(env, request): GenericDispatchResult`

Sinatra / Roda / Hanami 用 generic dispatch、 route matching + handler exec + response wrap。

### `renderERB(template: string, locals: ERBLocals): ERBRenderResult`

`<%= var %>` + `<% if %>` interpolation、 `{ html, variables, missing }`。

### `captureActiveRecord(env): ActiveRecordSnapshot`

AR query log を snapshot、 `{ ops: [{ type: 'select'|'insert'|'update'|'delete', table, sql, args }] }`。 test で「query N 個実行」 「N+1 未発生」 を verify。

## Types

- `RubyFramework = 'rails' | 'sinatra' | 'roda' | 'hanami'`
- `RubyRequest` = `{ method, path, headers?, body?, params? }`
- `RubyResponse` = `{ status, body, headers }`
- `RailsRenderCall` = `{ format: 'json'|'html'|'xml', body, statusOverride? }`
- `ActiveRecordOp` = `{ type, table, sql, args? }`

## Usage examples

### Rails controller test

```typescript
import { createRubyAppEnv, dispatchRailsRequest } from '@kiwa-lab/ruby';
import { describe, expect, it } from 'vitest';

describe('OrdersController', () => {
  it('POST /orders で order create + json render', () => {
    const env = createRubyAppEnv({
      framework: 'rails',
      controllers: {
        OrdersController: {
          create: (req) => ({
            renderCalls: [{ format: 'json', body: JSON.stringify({ id: 'o-1', total: req.params.total }) }],
            activeRecordOps: [{ type: 'insert', table: 'orders', sql: 'INSERT INTO orders ...' }],
          }),
        },
      },
      routes: [{ method: 'POST', path: '/orders', controller: 'OrdersController', action: 'create' }],
    });
    const res = dispatchRailsRequest(env, { method: 'POST', path: '/orders', params: { total: 1000 } });
    expect(res.status).toBe(200);
    expect(res.activeRecordOps).toHaveLength(1);
  });
});
```

### N+1 detection

```typescript
import { createRubyAppEnv, dispatchRailsRequest, captureActiveRecord } from '@kiwa-lab/ruby';

const env = createRubyAppEnv({
  framework: 'rails',
  routes: [/* ... */],
  activeRecord: { simulateNPlusOne: true },
});
dispatchRailsRequest(env, { method: 'GET', path: '/users' });
const snap = captureActiveRecord(env);
const selectCount = snap.ops.filter((o) => o.type === 'select').length;
expect(selectCount).toBeLessThan(5); // N+1 だと 100+ になる
```

## Related skills

- [`/kiwa-ruby`](../skills/kiwa-ruby) — Ruby framework test 生成 skill
