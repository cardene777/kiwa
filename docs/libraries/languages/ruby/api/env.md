---
title: "@kiwa-lab/ruby env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ruby</code> <code v-pre>env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createRubyAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L54) <code v-pre>packages/ruby/src/env.ts</code>

Framework 別の request 転送先を返す minimal mock。 Rails は Sinatra 系より complex な before_action chain を持つが、 統一 shape に落とせる範囲は同一 interface で扱う。

```ts
export declare function createRubyAppEnv(options?: CreateRubyAppEnvOptions): RubyAppEnv;
```

### 型

#### <code v-pre>CreateRubyAppEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L31) <code v-pre>packages/ruby/src/env.ts</code>

```ts
export interface CreateRubyAppEnvOptions {
    framework?: RubyFramework;
    routes?: RubyRoute[];
    initialSession?: Record<string, unknown>;
    initialCookies?: Record<string, string>;
}
```

#### <code v-pre>RubyAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L38) <code v-pre>packages/ruby/src/env.ts</code>

```ts
export interface RubyAppEnv {
    framework: RubyFramework;
    routes: RubyRoute[];
    session: Record<string, unknown>;
    cookies: Record<string, string>;
    activeRecordLog: ActiveRecordQuery[];
    addRoute: (route: RubyRoute) => void;
    matchRoute: (method: RubyRequest['method'], path: string) => RubyRoute | undefined;
    recordAR: (query: ActiveRecordQuery) => void;
    clear: () => void;
}
```

#### <code v-pre>RubyFramework</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L3) <code v-pre>packages/ruby/src/env.ts</code>

```ts
export type RubyFramework = 'rails' | 'sinatra' | 'roda' | 'hanami';
```

#### <code v-pre>RubyRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L5) <code v-pre>packages/ruby/src/env.ts</code>

```ts
export interface RubyRequest {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    params?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    body?: unknown;
    session?: Record<string, unknown>;
}
```

#### <code v-pre>RubyResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L15) <code v-pre>packages/ruby/src/env.ts</code>

```ts
export interface RubyResponse {
    status: number;
    body: string;
    headers: Record<string, string>;
    cookies: Record<string, string>;
    session: Record<string, unknown>;
}
```

#### <code v-pre>RubyRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L25) <code v-pre>packages/ruby/src/env.ts</code>

```ts
export interface RubyRoute {
    method: RubyRequest['method'];
    path: string;
    handler: RubyRouteHandler;
}
```

#### <code v-pre>RubyRouteHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/env.ts#L23) <code v-pre>packages/ruby/src/env.ts</code>

```ts
export type RubyRouteHandler = (req: RubyRequest, env: RubyAppEnv) => RubyResponse | Promise<RubyResponse>;
```
