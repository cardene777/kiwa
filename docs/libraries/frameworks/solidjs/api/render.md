---
title: "@kiwa-lab/solidjs render の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/solidjs</code> <code v-pre>render</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createRoot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L151) <code v-pre>packages/solidjs/src/render.ts</code>

Emulate Solid's `createRoot(fn)` — runs `fn(dispose)` inside a fresh effect scope and returns the accumulated dispose handle plus a scope object so tests can assert on `scope.disposed()`.

```ts
export declare function createRoot<T>(fn: (dispose: () => void) => T): {
    result: T;
    scope: RootScope;
    dispose: () => void;
};
```

#### <code v-pre>findElements</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L212) <code v-pre>packages/solidjs/src/render.ts</code>

Depth-first traversal of a Solid virtual tree. Collects every element whose `type` matches the predicate; strings / numbers / nulls are skipped.

```ts
export declare function findElements(tree: SolidChild, predicate: (el: SolidElement) => boolean): SolidElement[];
```

#### <code v-pre>h</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L98) <code v-pre>packages/solidjs/src/render.ts</code>

Lightweight JSX-shaped element factory. Callers can write `h('div', { class: 'x' }, 'hello')` in tests and pass the result to `renderSolid` or return it from a component body.

```ts
export declare function h(type: string, props: Record<string, unknown> | null, ...children: SolidChild[]): SolidElement;
```

#### <code v-pre>hydrate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L135) <code v-pre>packages/solidjs/src/render.ts</code>

Mount a component in "hydration" mode. Compares the freshly-rendered HTML against `ssrMarkup` and reports whether hydration matched (mirrors Solid's `hydrate()` mismatch warning path).

```ts
export declare function hydrate<TProps>(opts: HydrateOptions<TProps>): HydrateResult;
```

#### <code v-pre>isSolidElement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L200) <code v-pre>packages/solidjs/src/render.ts</code>

Type guard: recognize a Solid virtual element (used by walkers + tests).

```ts
export declare function isSolidElement(value: unknown): value is SolidElement;
```

#### <code v-pre>popEffectScope</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L79) <code v-pre>packages/solidjs/src/render.ts</code>

Pop the current effect-collection scope and return the collected handles.

```ts
export declare function popEffectScope(): EffectHandle<unknown>[];
```

#### <code v-pre>pushEffectScope</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L74) <code v-pre>packages/solidjs/src/render.ts</code>

Push a fresh effect-collection scope onto the stack. Used internally by `renderSolid` / `createRoot` so any effects registered during the callback are attributed to that scope.

```ts
export declare function pushEffectScope(): void;
```

#### <code v-pre>registerEffect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L88) <code v-pre>packages/solidjs/src/render.ts</code>

Register an effect handle with the innermost active scope (if any). Skill tests call this directly after `mockEffect(...)` when they want the effect cleaned up on `dispose()`.

```ts
export declare function registerEffect(handle: EffectHandle<unknown>): void;
```

#### <code v-pre>renderSolid</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L111) <code v-pre>packages/solidjs/src/render.ts</code>

Mount a Solid component synchronously, capture effects registered during the mount, and expose a `dispose()` handle that tears down every effect.

```ts
export declare function renderSolid<TProps>(opts: RenderSolidOptions<TProps>): RenderSolidResult;
```

#### <code v-pre>SOLID&#95;ELEMENT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L28) <code v-pre>packages/solidjs/src/render.ts</code>

```ts
export declare const SOLID_ELEMENT_SYMBOL: unique symbol;
```

#### <code v-pre>SOLID&#95;ROOT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L29) <code v-pre>packages/solidjs/src/render.ts</code>

```ts
export declare const SOLID_ROOT_SYMBOL: unique symbol;
```

#### <code v-pre>stringify</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L175) <code v-pre>packages/solidjs/src/render.ts</code>

Recursively serialize a Solid virtual tree into an SSR-shaped HTML string. Boolean attributes are elided, `class` maps to the `class` attribute (Solid convention, not React's `className`), and children are stringified without any XSS escaping — tests assert on shape, not on production output.

```ts
export declare function stringify(node: SolidChild): string;
```

### 型

#### <code v-pre>HydrateOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L54) <code v-pre>packages/solidjs/src/render.ts</code>

```ts
export interface HydrateOptions<TProps> extends RenderSolidOptions<TProps> {
    readonly ssrMarkup: string;
}
```

#### <code v-pre>HydrateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L58) <code v-pre>packages/solidjs/src/render.ts</code>

```ts
export interface HydrateResult extends RenderSolidResult {
    readonly hydrated: boolean;
    readonly mismatch: string | null;
}
```

#### <code v-pre>RenderSolidOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L42) <code v-pre>packages/solidjs/src/render.ts</code>

```ts
export interface RenderSolidOptions<TProps> {
    readonly component: SolidComponent<TProps>;
    readonly props?: TProps;
}
```

#### <code v-pre>RenderSolidResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L47) <code v-pre>packages/solidjs/src/render.ts</code>

```ts
export interface RenderSolidResult {
    readonly tree: SolidChild;
    readonly effects: EffectHandle<unknown>[];
    readonly dispose: () => void;
    readonly html: () => string;
}
```

#### <code v-pre>RootScope</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L63) <code v-pre>packages/solidjs/src/render.ts</code>

```ts
export interface RootScope {
    readonly disposed: () => boolean;
}
```

#### <code v-pre>SolidChild</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L31) <code v-pre>packages/solidjs/src/render.ts</code>

```ts
export type SolidChild = SolidElement | string | number | boolean | null | undefined | SolidChild[];
```

#### <code v-pre>SolidComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L40) <code v-pre>packages/solidjs/src/render.ts</code>

```ts
export type SolidComponent<TProps = Record<string, unknown>> = (props: TProps) => SolidChild;
```

#### <code v-pre>SolidElement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L33) <code v-pre>packages/solidjs/src/render.ts</code>

```ts
export interface SolidElement {
    readonly [SOLID_ELEMENT_SYMBOL]: true;
    readonly type: string;
    readonly props: Record<string, unknown>;
    readonly children: SolidChild[];
}
```
