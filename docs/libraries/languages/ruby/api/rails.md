---
title: "@kiwa-lab/ruby rails の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ruby</code> <code v-pre>rails</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/rails.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>dispatchRailsRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/rails.ts#L37) <code v-pre>packages/ruby/src/rails.ts</code>

Rails controller の dispatch simulation。 before_action → action → render の chain を 順に走らせ、 redirect_to() 相当は throw で捕捉する。 実 Rails の render 経路 (json / text / partial) を統一 shape で捕捉して assertion 用に露出する。

```ts
export declare function dispatchRailsRequest(env: RubyAppEnv, req: RubyRequest, controller: RailsControllerAction): Promise<RailsDispatchResult>;
```

### 型

#### <code v-pre>RailsControllerAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/rails.ts#L18) <code v-pre>packages/ruby/src/rails.ts</code>

```ts
export interface RailsControllerAction {
    render?: (call: Omit<RailsRenderCall, 'status'> & {
        status?: number;
    }) => RubyResponse;
    redirectTo?: (url: string, status?: number) => never;
    beforeActions?: Array<(req: RubyRequest, env: RubyAppEnv) => void | Promise<void>>;
    action: (req: RubyRequest, env: RubyAppEnv) => RubyResponse | Promise<RubyResponse>;
}
```

#### <code v-pre>RailsDispatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/rails.ts#L25) <code v-pre>packages/ruby/src/rails.ts</code>

```ts
export interface RailsDispatchResult {
    response: RubyResponse;
    redirect?: RailsRedirectSignal;
    renderCalls: RailsRenderCall[];
    beforeActionCount: number;
}
```

#### <code v-pre>RailsRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/rails.ts#L5) <code v-pre>packages/ruby/src/rails.ts</code>

```ts
export interface RailsRedirectSignal {
    readonly [RAILS_REDIRECT_SYMBOL]: true;
    url: string;
    status: number;
}
```

#### <code v-pre>RailsRenderCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/rails.ts#L11) <code v-pre>packages/ruby/src/rails.ts</code>

```ts
export interface RailsRenderCall {
    template?: string;
    json?: unknown;
    text?: string;
    status: number;
}
```
