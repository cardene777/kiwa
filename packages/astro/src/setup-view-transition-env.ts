// setupAstroViewTransitionEnv — Astro v5 View Transitions test helper (Issue #560, v1.3-3).
//
// Astro v5 が提供する View Transitions API (`<ViewTransitions />` component) は SPA-like な
// page navigation を実現するため、 4 つの lifecycle event を window に dispatch する ...
//
//   - astro:before-preparation  ... TransitionBeforePreparationEvent 派生 (cancelable、 from/to/loader 公開)
//   - astro:after-preparation   ... 公式 router は plain Event として dispatch、 payload なし
//   - astro:before-swap         ... TransitionBeforeSwapEvent 派生 (newDocument 公開 + swap function)
//   - astro:after-swap          ... 公式 router は plain Event として dispatch、 payload なし
//
// 公式 router 動作 (Astro v5 / node_modules/astro/dist/transitions/{router.js,events.js}) ...
//
//   * `<ViewTransitions />` が page に含まれる場合 (= transitionEnabledOnThisPage) は
//     navigationType を問わず必ず doPreparation() を実行する。 supportsViewTransitions
//     (= !!document.startViewTransition) は preparation event の dispatch 有無には影響せず、
//     swap 部分で startViewTransition() を使うか fallback animate 経路を使うかだけを決める。
//   * doSwap() は listener dispatch 後に必ず event.swap() を呼ぶ。 listener 内で event.swap()
//     を override すれば早期 swap も可能だが、 router 側は post-listener で **必ず** event.swap()
//     を呼ぶため、 listener が swap() を呼んでいた場合は **2 回 swap される**。 これは
//     listener 側で `event.swap = () => {}` 等で no-op 化することを期待する設計。
//   * triggerEvent(TRANSITION_AFTER_PREPARATION) と triggerEvent(TRANSITION_AFTER_SWAP) は
//     plain Event を dispatch する (from/to/newDocument 等の payload は持たない)。 listener は
//     event.type だけ見て document.location.href 経由で nav 後 URL を取得する。
//
// kiwa は real browser を起動せず synthetic dispatcher を提供して各 listener (page 内 script /
// framework hook) の挙動を unit test できる形にする。 公式 router の挙動に **厳密に** 合わせる ...
//
//   - supportsViewTransitions=false でも before-preparation / after-preparation は dispatch する
//   - after-preparation / after-swap event は plain (type のみ) で from/to/etc 非公開
//   - swap() は post-listener で必ず 1 回呼ぶ (listener も呼んでいれば計 2 回、 swapCallCount で観測可)
//
// Out of scope on purpose:
//   - real document.startViewTransition() の visual transition (jsdom 不在)
//   - prefetch event (astro:before-prefetch) — Astro Container API 経由で別途 cover
//   - transitionEnabledOnThisPage()=false の full-reload 経路 (location.href=to、 event 一切 dispatch なし)

export interface AstroViewTransitionEventPayload {
  readonly from: URL;
  readonly to: URL;
  readonly navigationType: 'traverse' | 'push' | 'replace';
  readonly direction: 'forward' | 'back' | string;
  readonly sourceElement: Element | undefined;
  readonly info: unknown;
  readonly newDocument: Document;
  readonly viewTransition: { skipTransition(): void } | undefined;
  readonly formData: FormData | undefined;
}

export interface AstroBeforePreparationEvent extends AstroViewTransitionEventPayload {
  readonly type: 'astro:before-preparation';
  defaultPrevented: boolean;
  preventDefault(): void;
  /** Loader を override 可能 (公式 router 互換、 navigate cancellation / replace 用) */
  loader: (() => Promise<void>) | undefined;
}

/**
 * Astro 公式 router は `triggerEvent(TRANSITION_AFTER_PREPARATION)` で plain `Event` を dispatch する。
 * listener は `e.type` だけ参照可能で、 from / to / newDocument は持たない。
 */
export interface AstroAfterPreparationEvent {
  readonly type: 'astro:after-preparation';
}

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

/**
 * Astro 公式 router は `triggerEvent(TRANSITION_AFTER_SWAP)` で plain `Event` を dispatch する。
 * listener は `e.type` だけ参照可能で、 from / to は持たない (nav 後 URL は `document.location.href`)。
 */
export interface AstroAfterSwapEvent {
  readonly type: 'astro:after-swap';
}

export type AstroViewTransitionEvent =
  | AstroBeforePreparationEvent
  | AstroAfterPreparationEvent
  | AstroBeforeSwapEvent
  | AstroAfterSwapEvent;

export type AstroViewTransitionEventType = AstroViewTransitionEvent['type'];

export type AstroViewTransitionListener<TEvent extends AstroViewTransitionEvent = AstroViewTransitionEvent> = (
  event: TEvent,
) => void | Promise<void>;

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
  on<TType extends AstroViewTransitionEventType>(
    type: TType,
    listener: AstroViewTransitionListener<Extract<AstroViewTransitionEvent, { type: TType }>>,
  ): void;
  /** 1 listener を解除 */
  off<TType extends AstroViewTransitionEventType>(
    type: TType,
    listener: AstroViewTransitionListener<Extract<AstroViewTransitionEvent, { type: TType }>>,
  ): void;
  /**
   * 4 event を順に dispatch ... before-preparation → after-preparation → before-swap → after-swap。
   * before-preparation で preventDefault() / signal abort された場合は preparation 経路を中断
   * (公式 `doPreparation` 同等、 router は event を return するが後続 transition は走らない)。
   */
  dispatchAll(): Promise<AstroViewTransitionDispatchResult>;
  /** 個別 event のみ dispatch (sequence 検証用) */
  dispatch<TType extends AstroViewTransitionEventType>(
    type: TType,
  ): Promise<Extract<AstroViewTransitionEvent, { type: TType }>>;
  /**
   * from-page DOM と to-page DOM の root-level innerHTML 差分を抽出。
   * 子要素 tag-name 列で簡易比較する (real diff library は意図的に依存しない)。
   */
  diffDom(): AstroViewTransitionDomDiff;
  /** newDocument / listener / formData を初期 snapshot に戻す */
  reset(): void;
}

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

export interface AstroViewTransitionDomDiff {
  /** from-page にあって to-page にない top-level tag (順序保持) */
  readonly removed: string[];
  /** to-page にあって from-page にない top-level tag */
  readonly added: string[];
  /** 両方にある top-level tag */
  readonly kept: string[];
}

/**
 * Minimal HTML parser — `<body>` 内の最上位 element tag を string 抽出する fallback parser。
 * void element (`<img>` / `<br>` / `<hr>` / `<input>` / `<link>` / `<meta>` / `<area>` /
 * `<base>` / `<col>` / `<embed>` / `<source>` / `<track>` / `<wbr>`) と自己終端形 (`<x />`) を
 * 識別して、 depth カウンタを正しく増減させる。 完全な DOM 構築は不要 (assertion は tag-name
 * 列の差分で完結する)、 jsdom / happy-dom 等の browser DOM lib なしで動作する。
 */
interface MinimalDocument {
  readonly body: {
    readonly children: ReadonlyArray<{ readonly tagName: string }>;
    innerHTML: string;
  };
  readonly documentElement: { outerHTML: string };
}

const VOID_TAGS = new Set([
  'AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT',
  'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR',
]);

function parseDocument(html: string): MinimalDocument {
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  const bodyInner = bodyMatch ? bodyMatch[1] ?? '' : html;
  // comment / CDATA / DOCTYPE を除去 (top-level tag 検出に干渉するため)
  const stripped = bodyInner
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '');
  const tokenRegex = /<(\/)?([a-z][a-z0-9-]*)\b([^>]*)>/gi;
  const children: { readonly tagName: string }[] = [];
  let depth = 0;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(stripped)) !== null) {
    const isClose = match[1] === '/';
    const tagName = (match[2] ?? '').toUpperCase();
    const attrs = match[3] ?? '';
    const selfClose = /\/\s*$/.test(attrs);
    const isVoid = VOID_TAGS.has(tagName);
    if (isClose) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    // open tag
    if (depth === 0) {
      children.push({ tagName });
    }
    // void / self-close は depth を増やさない (続く sibling が top-level として認識されるため)
    if (!isVoid && !selfClose) {
      depth++;
    }
  }
  let innerHTMLValue = bodyInner;
  return {
    body: {
      get children() {
        return children;
      },
      get innerHTML() {
        return innerHTMLValue;
      },
      set innerHTML(value: string) {
        innerHTMLValue = value;
      },
    },
    documentElement: { outerHTML: html },
  };
}

const DEFAULT_HTML = '<!doctype html><html><head></head><body></body></html>';

export function setupAstroViewTransitionEnv(
  options: SetupAstroViewTransitionEnvOptions,
): AstroViewTransitionEnv {
  const initialToHtml = options.toHtml ?? DEFAULT_HTML;
  const initialFromHtml = options.fromHtml ?? DEFAULT_HTML;
  const transitionName = options.transitionName ?? '';
  const supportsViewTransitions = options.supportsViewTransitions ?? true;
  const navigationType = options.navigationType ?? 'push';
  const direction = options.direction ?? 'forward';

  const fromUrl = new URL(options.fromPath, 'http://localhost/');
  const toUrl = new URL(options.toPath, 'http://localhost/');

  let newDocument = parseDocument(initialToHtml) as unknown as Document;
  let fromDocument = parseDocument(initialFromHtml) as unknown as Document;
  let currentFormData: FormData | undefined = options.formData;

  const listeners: { [K in AstroViewTransitionEventType]: AstroViewTransitionListener<Extract<AstroViewTransitionEvent, { type: K }>>[] } = {
    'astro:before-preparation': [],
    'astro:after-preparation': [],
    'astro:before-swap': [],
    'astro:after-swap': [],
  };

  function buildPayload(): AstroViewTransitionEventPayload {
    return {
      from: fromUrl,
      to: toUrl,
      navigationType,
      direction,
      sourceElement: options.sourceElement,
      info: options.info,
      newDocument,
      // viewTransition は browser の startViewTransition() support 有無を反映、
      // 未対応 browser では undefined (公式 router の `viewTransition = null` 経路相当)
      viewTransition: supportsViewTransitions ? { skipTransition: () => {} } : undefined,
      formData: currentFormData,
    };
  }

  function buildBeforePreparation(): AstroBeforePreparationEvent {
    const payload = buildPayload();
    const event: AstroBeforePreparationEvent = {
      type: 'astro:before-preparation',
      ...payload,
      defaultPrevented: false,
      preventDefault() {
        event.defaultPrevented = true;
      },
      loader: undefined,
    };
    return event;
  }

  function buildAfterPreparation(): AstroAfterPreparationEvent {
    return { type: 'astro:after-preparation' };
  }

  function buildBeforeSwap(): AstroBeforeSwapEvent {
    const payload = buildPayload();
    return {
      type: 'astro:before-swap',
      ...payload,
      swap() {
        // default no-op、 dispatchAll() で外側から override される
      },
    };
  }

  function buildAfterSwap(): AstroAfterSwapEvent {
    return { type: 'astro:after-swap' };
  }

  async function runListeners<TType extends AstroViewTransitionEventType>(
    type: TType,
    event: Extract<AstroViewTransitionEvent, { type: TType }>,
  ): Promise<void> {
    const arr = listeners[type] as AstroViewTransitionListener<Extract<AstroViewTransitionEvent, { type: TType }>>[];
    for (const listener of arr) {
      await listener(event);
    }
  }

  return {
    fromUrl,
    toUrl,
    transitionName,
    supportsViewTransitions,
    get newDocument() {
      return newDocument;
    },
    on(type, listener) {
      // 型 narrow を維持するため any 経由で push (各 type の listener は events 配列とビルダーで対応)
      (listeners[type] as AstroViewTransitionListener<AstroViewTransitionEvent>[]).push(
        listener as AstroViewTransitionListener<AstroViewTransitionEvent>,
      );
    },
    off(type, listener) {
      const arr = listeners[type] as AstroViewTransitionListener<AstroViewTransitionEvent>[];
      const idx = arr.indexOf(listener as AstroViewTransitionListener<AstroViewTransitionEvent>);
      if (idx >= 0) arr.splice(idx, 1);
    },
    async dispatch(type) {
      type ReturnType = Extract<AstroViewTransitionEvent, { type: typeof type }>;
      let event: AstroViewTransitionEvent;
      switch (type) {
        case 'astro:before-preparation':
          event = buildBeforePreparation();
          break;
        case 'astro:after-preparation':
          event = buildAfterPreparation();
          break;
        case 'astro:before-swap':
          event = buildBeforeSwap();
          break;
        case 'astro:after-swap':
          event = buildAfterSwap();
          break;
        default:
          throw new Error(`unknown event type: ${String(type)}`);
      }
      await runListeners(type, event as ReturnType);
      return event as ReturnType;
    },
    async dispatchAll() {
      let beforePreparation: AstroBeforePreparationEvent | null = null;
      let afterPreparation: AstroAfterPreparationEvent | null = null;
      let beforeSwap: AstroBeforeSwapEvent | null = null;
      let afterSwap: AstroAfterSwapEvent | null = null;
      let cancelled = false;
      let swapCallCount = 0;

      // 公式 router 動作 ... transitionEnabledOnThisPage() が true なら supportsViewTransitions
      // の有無にかかわらず必ず doPreparation() を実行する。 本 helper は常に preparation 経路を
      // 走らせ、 supportsViewTransitions=false は before-swap.viewTransition を undefined にする
      // ことで visual transition の有無のみ表現する。
      beforePreparation = buildBeforePreparation();
      await runListeners('astro:before-preparation', beforePreparation);
      // 公式 router は loader を defaultPrevented 判定の前に await する (doPreparation 内 ...
      // `if (document.dispatchEvent(event)) { await event.loader(); ... }`)、
      // しかし dispatchEvent は preventDefault された場合 false を返すため、
      // preventDefault された場合は loader も走らせない実装が正確。
      if (beforePreparation.defaultPrevented) {
        cancelled = true;
        return {
          beforePreparation,
          afterPreparation,
          beforeSwap,
          afterSwap,
          swapCallCount,
          cancelled,
        };
      }
      if (typeof beforePreparation.loader === 'function') {
        await beforePreparation.loader();
      }
      afterPreparation = buildAfterPreparation();
      await runListeners('astro:after-preparation', afterPreparation);

      beforeSwap = buildBeforeSwap();
      // 公式 router の doSwap 動作 ... listener dispatch 後に必ず event.swap() を 1 回呼ぶ。
      // listener が swap() を呼べば計 2 回呼ばれる (swapCallCount で観測可)。
      const swapOriginal = beforeSwap.swap;
      beforeSwap.swap = () => {
        swapCallCount++;
        swapOriginal();
      };
      await runListeners('astro:before-swap', beforeSwap);
      // 公式 router 必須 ... listener が呼んだかどうか **関係なく** post-listener で 1 回呼ぶ
      beforeSwap.swap();

      afterSwap = buildAfterSwap();
      await runListeners('astro:after-swap', afterSwap);

      return {
        beforePreparation,
        afterPreparation,
        beforeSwap,
        afterSwap,
        swapCallCount,
        cancelled,
      };
    },
    diffDom() {
      const fromTags = collectTopLevelTags(fromDocument);
      const toTags = collectTopLevelTags(newDocument);
      const removed = fromTags.filter((t) => !toTags.includes(t));
      const added = toTags.filter((t) => !fromTags.includes(t));
      const kept = fromTags.filter((t) => toTags.includes(t));
      return { removed, added, kept };
    },
    reset() {
      newDocument = parseDocument(initialToHtml) as unknown as Document;
      fromDocument = parseDocument(initialFromHtml) as unknown as Document;
      currentFormData = options.formData;
      listeners['astro:before-preparation'] = [];
      listeners['astro:after-preparation'] = [];
      listeners['astro:before-swap'] = [];
      listeners['astro:after-swap'] = [];
    },
  };
}

function collectTopLevelTags(doc: Document | MinimalDocument): string[] {
  // browser DOM Document の場合 body.children は HTMLCollection、 minimal の場合は array
  const bodyAny = (doc as { body?: { children?: ArrayLike<{ tagName: string }> } }).body;
  const children = bodyAny?.children;
  if (!children) return [];
  const tags: string[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as { tagName?: string };
    if (child && child.tagName) tags.push(child.tagName.toUpperCase());
  }
  return tags;
}
