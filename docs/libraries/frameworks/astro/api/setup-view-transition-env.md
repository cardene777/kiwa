---
title: "@kiwa-lab/astro setup-view-transition-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/astro</code> <code v-pre>setup-view-transition-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>setupAstroViewTransitionEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L262) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export declare function setupAstroViewTransitionEnv(options: SetupAstroViewTransitionEnvOptions): AstroViewTransitionEnv;
```

### 型

#### <code v-pre>AstroAfterPreparationEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L61) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

Astro 公式 router は `triggerEvent(TRANSITION_AFTER_PREPARATION)` で plain `Event` を dispatch する。 listener は `e.type` だけ参照可能で、 from / to / newDocument は持たない。

```ts
export interface AstroAfterPreparationEvent {
    readonly type: 'astro:after-preparation';
}
```

#### <code v-pre>AstroAfterSwapEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L80) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

Astro 公式 router は `triggerEvent(TRANSITION_AFTER_SWAP)` で plain `Event` を dispatch する。 listener は `e.type` だけ参照可能で、 from / to は持たない (nav 後 URL は `document.location.href`)。

```ts
export interface AstroAfterSwapEvent {
    readonly type: 'astro:after-swap';
}
```

#### <code v-pre>AstroBeforePreparationEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L49) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export interface AstroBeforePreparationEvent extends AstroViewTransitionEventPayload {
    readonly type: 'astro:before-preparation';
    defaultPrevented: boolean;
    preventDefault(): void;
    /** Loader を override 可能 (公式 router 互換、 navigate cancellation / replace 用) */
    loader: (() => Promise<void>) | undefined;
}
```

#### <code v-pre>AstroBeforeSwapEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L65) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export interface AstroBeforeSwapEvent extends AstroViewTransitionEventPayload {
    readonly type: 'astro:before-swap';
    /**
     * DOM swap 関数 (公式 router 互換)。 listener が override 可。
     * 公式 router は listener dispatch 後に必ず event.swap() を 1 回呼ぶため、
     * listener が swap() を呼ぶと swap が計 2 回実行される (swapCallCount で観測可能)。
     * listener が swap を no-op 化したい場合は `event.swap = () => {}` で上書きする。
     */
    swap: () => void;
}
```

#### <code v-pre>AstroViewTransitionDispatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L168) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export interface AstroViewTransitionDispatchResult {
    readonly beforePreparation: AstroBeforePreparationEvent | null;
    readonly afterPreparation: AstroAfterPreparationEvent | null;
    readonly beforeSwap: AstroBeforeSwapEvent | null;
    readonly afterSwap: AstroAfterSwapEvent | null;
    /**
     * swap() が呼ばれた回数。 公式 router は listener dispatch 後に必ず 1 回呼ぶため、
     * listener が swap() を呼ばなければ 1、 listener も呼べば 2 になる。
     * 2 を期待しない user code は double-swap bug 候補。
     */
    readonly swapCallCount: number;
    /** before-preparation で preventDefault された場合 true (preparation 中断) */
    readonly cancelled: boolean;
}
```

#### <code v-pre>AstroViewTransitionDomDiff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L183) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export interface AstroViewTransitionDomDiff {
    /** from-page にあって to-page にない top-level tag (順序保持) */
    readonly removed: string[];
    /** to-page にあって from-page にない top-level tag */
    readonly added: string[];
    /** 両方にある top-level tag */
    readonly kept: string[];
}
```

#### <code v-pre>AstroViewTransitionEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L124) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export interface AstroViewTransitionEnv {
    readonly fromUrl: URL;
    readonly toUrl: URL;
    /** named transition name (Astro `transition:name` SSOT) */
    readonly transitionName: string;
    /** browser supportsViewTransitions snapshot */
    readonly supportsViewTransitions: boolean;
    /**
     * to-page 側 Document (newDocument)、 before-swap listener が mutate 可能。
     * dispatchAll() の前後で同一参照、 reset() 後に initial HTML へ復元される。
     */
    readonly newDocument: Document;
    /**
     * 各 lifecycle event の listener を登録する (公式 `document.addEventListener` 相当)。
     * 同型 event 複数登録時は登録順に呼ばれる。
     */
    on<TType extends AstroViewTransitionEventType>(type: TType, listener: AstroViewTransitionListener<Extract<AstroViewTransitionEvent, {
        type: TType;
    }>>): void;
    /** 1 listener を解除 */
    off<TType extends AstroViewTransitionEventType>(type: TType, listener: AstroViewTransitionListener<Extract<AstroViewTransitionEvent, {
        type: TType;
    }>>): void;
    /**
     * 4 event を順に dispatch ... before-preparation → after-preparation → before-swap → after-swap。
     * before-preparation で preventDefault() / signal abort された場合は preparation 経路を中断
     * (公式 `doPreparation` 同等、 router は event を return するが後続 transition は走らない)。
     */
    dispatchAll(): Promise<AstroViewTransitionDispatchResult>;
    /** 個別 event のみ dispatch (sequence 検証用) */
    dispatch<TType extends AstroViewTransitionEventType>(type: TType): Promise<Extract<AstroViewTransitionEvent, {
        type: TType;
    }>>;
    /**
     * from-page DOM と to-page DOM の root-level innerHTML 差分を抽出。
     * 子要素 tag-name 列で簡易比較する (real diff library は意図的に依存しない)。
     */
    diffDom(): AstroViewTransitionDomDiff;
    /** newDocument / listener / formData を初期 snapshot に戻す */
    reset(): void;
}
```

#### <code v-pre>AstroViewTransitionEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L84) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export type AstroViewTransitionEvent = AstroBeforePreparationEvent | AstroAfterPreparationEvent | AstroBeforeSwapEvent | AstroAfterSwapEvent;
```

#### <code v-pre>AstroViewTransitionEventPayload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L37) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export interface AstroViewTransitionEventPayload {
    readonly from: URL;
    readonly to: URL;
    readonly navigationType: 'traverse' | 'push' | 'replace';
    readonly direction: 'forward' | 'back' | string;
    readonly sourceElement: Element | undefined;
    readonly info: unknown;
    readonly newDocument: Document;
    readonly viewTransition: {
        skipTransition(): void;
    } | undefined;
    readonly formData: FormData | undefined;
}
```

#### <code v-pre>AstroViewTransitionEventType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L90) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export type AstroViewTransitionEventType = AstroViewTransitionEvent['type'];
```

#### <code v-pre>AstroViewTransitionListener</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L92) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export type AstroViewTransitionListener<TEvent extends AstroViewTransitionEvent = AstroViewTransitionEvent> = (event: TEvent) => void | Promise<void>;
```

#### <code v-pre>SetupAstroViewTransitionEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L96) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export interface SetupAstroViewTransitionEnvOptions {
    readonly fromPath: string;
    readonly toPath: string;
    /** named view transitions (Astro `transition:name` attribute、 default `''`) */
    readonly transitionName?: string;
    /** History API 動作種別 (default `'push'`) */
    readonly navigationType?: 'traverse' | 'push' | 'replace';
    /** ナビゲート方向 (`back` button / `forward` button、 default `'forward'`) */
    readonly direction?: 'forward' | 'back' | string;
    /** to-page side で render される HTML (default は最小の `<html><body></body></html>`) */
    readonly toHtml?: string;
    /** from-page side で初期表示される HTML (default は最小の `<html><body></body></html>`) */
    readonly fromHtml?: string;
    /**
     * browser の View Transitions API support flag (default `true`)。
     * 公式 router 動作と整合 ... preparation event は support 有無に **関係なく** dispatch される。
     * 本 flag は before-swap event の `viewTransition` field 公開有無のみ制御する
     * (= `document.startViewTransition()` を browser が持つかどうか、 視覚 transition 用)。
     */
    readonly supportsViewTransitions?: boolean;
    /** Astro form submission event 由来 — submit data を formData として公開 */
    readonly formData?: FormData;
    /** sourceElement (a / area / form / Element) を listener に渡したい場合 */
    readonly sourceElement?: Element;
    /** navigate() の info 引数 (Astro custom payload、 default `undefined`) */
    readonly info?: unknown;
}
```
