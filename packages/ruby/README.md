# @kiwa-lab/ruby

Ruby framework mock harness for kiwa — Rails / Sinatra / Roda / Hanami の request → controller → response cycle を TypeScript から in-process で叩く test infra。 real Ruby runtime 不要。

## Installation

```bash
pnpm add -D @kiwa-lab/ruby
# or
npm install -D @kiwa-lab/ruby
# or
yarn add -D @kiwa-lab/ruby
```

## Supported frameworks

| Framework | Dispatch style | Status |
|---|---|---|
| Rails | ActionController (before_action / render / redirect_to) | ✅ |
| Sinatra | generic route | ✅ |
| Roda | generic route | ✅ |
| Hanami | generic route | ✅ |

## Quick start

```ts
import {
  createRubyAppEnv,
  dispatchRailsRequest,
  dispatchGenericRequest,
  renderERB,
  captureActiveRecord,
} from '@kiwa-lab/ruby';

const env = createRubyAppEnv({ framework: 'rails' });

const result = await dispatchRailsRequest(env, {
  controller: 'UsersController',
  action: 'show',
  request: { method: 'GET', path: '/users/1' },
  handler: async (ctx) => {
    ctx.render({ status: 200, template: 'users/show', locals: { name: 'kiwa' } });
  },
});
// result = { status: 200, renderCalls: [...], redirectSignals: [...] }

const rendered = renderERB('<h1><%= name %></h1>', { name: 'kiwa' });

const ar = captureActiveRecord(env);
env.record({ op: 'select', sql: 'SELECT * FROM users', bindings: [] });
```

## API reference

- `createRubyAppEnv(options: CreateRubyAppEnvOptions): RubyAppEnv` — Rails / Sinatra / Roda / Hanami mock env 生成
- `RubyAppEnv.route(method, path, handler): void` — generic route 登録
- `dispatchRailsRequest(env, options): Promise<RailsDispatchResult>` — Rails controller 経路 dispatch
- `dispatchGenericRequest(env, req): Promise<GenericDispatchResult>` — Sinatra / Roda / Hanami 経路
- `renderERB(template: string, locals: ERBLocals): ERBRenderResult` — ERB `<%= %>` interpolation
- `captureActiveRecord(env): ActiveRecordSnapshot` — ActiveRecord query log snapshot

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createRubyAppEnv, dispatchRailsRequest } from '@kiwa-lab/ruby';

describe('users#show', () => {
  it('200 で render される', async () => {
    const env = createRubyAppEnv({ framework: 'rails' });
    const r = await dispatchRailsRequest(env, {
      controller: 'UsersController', action: 'show',
      request: { method: 'GET', path: '/users/1' },
      handler: async (ctx) => { ctx.render({ status: 200, template: 'users/show' }); },
    });
    expect(r.status).toBe(200);
  });
});
```

`/kiwa-ruby` skill を起動すると Rails controller + ERB + ActiveRecord 3 経路の test を生成できる。

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
