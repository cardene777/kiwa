---
title: "@kiwa-lab/python env の API 契約"
---

# <code v-pre>@kiwa-lab/python</code> <code v-pre>env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createPythonAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts#L35) <code v-pre>packages/python/src/env.ts</code>

framework 別 mock env を返す。 real Django/Flask/FastAPI/Starlette の request pipeline を再現する in-process env。 django/flask = WSGI default、 fastapi/starlette = ASGI default (option で override 可能)。

```ts
export declare function createPythonAppEnv(options?: CreatePythonAppEnvOptions): PythonAppEnv;
```

### 型

#### <code v-pre>CreatePythonAppEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts#L24) <code v-pre>packages/python/src/env.ts</code>

```ts
export interface CreatePythonAppEnvOptions {
    framework?: PythonFramework;
    mode?: PythonMode;
    now?: () => number;
}
```

#### <code v-pre>MiddlewareEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts#L7) <code v-pre>packages/python/src/env.ts</code>

```ts
export interface MiddlewareEntry {
    name: string;
    handler: (req: PythonRequest, next: () => Promise<PythonResponse>) => Promise<PythonResponse>;
}
```

#### <code v-pre>PythonAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts#L12) <code v-pre>packages/python/src/env.ts</code>

```ts
export interface PythonAppEnv {
    framework: PythonFramework;
    mode: PythonMode;
    routes: Map<string, (req: PythonRequest) => Promise<PythonResponse>>;
    middleware: MiddlewareEntry[];
    templates: Map<string, string>;
    middlewareCalls: Array<{
        name: string;
        path: string;
        at: number;
    }>;
    registerRoute: (method: string, path: string, handler: (req: PythonRequest) => Promise<PythonResponse>) => void;
    registerMiddleware: (entry: MiddlewareEntry) => void;
    registerTemplate: (name: string, tmpl: string) => void;
}
```

#### <code v-pre>PythonFramework</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts#L3) <code v-pre>packages/python/src/env.ts</code>

```ts
export type PythonFramework = 'django' | 'flask' | 'fastapi' | 'starlette';
```

#### <code v-pre>PythonMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/env.ts#L5) <code v-pre>packages/python/src/env.ts</code>

```ts
export type PythonMode = 'wsgi' | 'asgi';
```
