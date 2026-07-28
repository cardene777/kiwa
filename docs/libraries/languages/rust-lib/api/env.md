---
title: "@kiwa-lab/rust-lib env の API 契約"
---

# <code v-pre>@kiwa-lab/rust-lib</code> <code v-pre>env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createRustAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/env.ts#L33) <code v-pre>packages/rust-lib/src/env.ts</code>

framework 別 route registry を持つ mock env。 real axum / actix / tower / rocket の router 相当を in-process で保持し、 method + path match で handler を dispatch する。

```ts
export declare function createRustAppEnv(options?: CreateRustAppEnvOptions): RustAppEnv;
```

### 型

#### <code v-pre>RustAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/env.ts#L15) <code v-pre>packages/rust-lib/src/env.ts</code>

```ts
export interface RustAppEnv {
    framework: RustFramework;
    routes: RustRoute[];
    addRoute: (route: RustRoute) => void;
    matchRoute: (method: string, path: string) => RustRoute | undefined;
    listRoutes: () => RustRoute[];
    clear: () => void;
}
```

#### <code v-pre>RustFramework</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/env.ts#L1) <code v-pre>packages/rust-lib/src/env.ts</code>

```ts
export type RustFramework = 'axum' | 'actix-web' | 'tower-http' | 'rocket';
```

#### <code v-pre>RustResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/env.ts#L9) <code v-pre>packages/rust-lib/src/env.ts</code>

```ts
export interface RustResponse {
    status: number;
    body: unknown;
    headers: Record<string, string>;
}
```

#### <code v-pre>RustRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/env.ts#L3) <code v-pre>packages/rust-lib/src/env.ts</code>

```ts
export interface RustRoute {
    method: string;
    path: string;
    handler: (req: unknown) => Promise<unknown> | unknown;
}
```
