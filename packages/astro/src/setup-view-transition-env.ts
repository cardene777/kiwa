// setupAstroViewTransitionEnv — Astro v5 View Transitions test helper (Issue #560, v1.3-3).
//
// Astro v5 が提供する View Transitions API (`<ViewTransitions />` component) は SPA-like な
// page navigation を実現するため、 4 つの lifecycle event を window に dispatch する ...
//
//   - astro:before-preparation  ... 新 document 取得開始前 (loader 起動 / cancellation 可)
//   - astro:after-preparation   ... 新 document fetch 完了直後 (newDocument 作成済)
//   - astro:before-swap         ... DOM swap 直前 (newDocument を mutate 可、 viewTransition 制御)
//   - astro:after-swap          ... DOM swap 直後 (focus restore / scroll 復元前)
//
// 公式実装は `astro:transitions/client` の navigate() を起点に上記 4 event を順に dispatch する。
// kiwa は real browser を起動せず、 minimal な synthetic event dispatcher を提供して
// 各 listener (page 内 `<script>` / framework hook) の挙動を unit test できる形にする。
//
// 4 event は Astro v5 source code の `astro/packages/astro/src/transitions/router.ts` に準拠 ...
//   TransitionBeforePreparationEvent  (cancelable, defaultPrevented で nav 中止)
//   TransitionAfterPreparationEvent   (not cancelable)
//   TransitionBeforeSwapEvent         (not cancelable, newDocument / swap function 公開)
//   plus a plain Event for 'astro:after-swap'
//
// Cross-document fallback (browser が View Transitions API 未対応) は
// `supportsViewTransitions` flag で expose する。 false 時は kiwa が直接 swap を実行し、
// before-swap / after-swap のみ dispatch する (公式 router 同等の fallback path)。
//
// Out of scope on purpose:
//   - real document.startViewTransition() の visual transition (jsdom 不在)
//   - prefetch event (astro:before-prefetch) — Astro Container API 経由で別途 cover

export interface AstroViewTransitionEventBase {
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

export interface AstroBeforePreparationEvent extends AstroViewTransitionEventBase {
  readonly type: 'astro:before-preparation';
  defaultPrevented: boolean;
  preventDefault(): void;
  /** Loader を override 可能 (公式 router 互換、 navigate cancellation / replace 用) */
  loader: (() => Promise<void>) | undefined;
}

export interface AstroAfterPreparationEvent extends AstroViewTransitionEventBase {
  readonly type: 'astro:after-preparation';
}

export interface AstroBeforeSwapEvent extends AstroViewTransitionEventBase {
  readonly type: 'astro:before-swap';
  /** DOM swap 関数 (公式 router 互換)、 listener が override 可 */
  swap: () => void;
}

export interface AstroAfterSwapEvent {
  readonly type: 'astro:after-swap';
  readonly from: URL;
  readonly to: URL;
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
   * browser の View Transitions API support flag (default `true`)
   * false 時は cross-document fallback path に入り、 before-preparation / after-preparation
   * は dispatch されず before-swap → after-swap のみ流れる。
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
   * supportsViewTransitions=false 時は before-swap → after-swap のみ。
   * before-preparation で preventDefault() / loader override された場合の挙動は公式 router に準拠。
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
  readonly swapCalled: boolean;
  readonly cancelled: boolean;
  readonly fellBackToCrossDocument: boolean;
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
 * 完全な DOM 構築は不要 (assertion は tag-name 列の差分で完結する)、 jsdom / happy-dom 等の
 * browser DOM lib なしで動作する。 後で real Document が必要になったら呼び側で別途生成する。
 */
interface MinimalDocument {
  readonly body: {
    readonly children: ReadonlyArray<{ readonly tagName: string }>;
    innerHTML: string;
  };
  readonly documentElement: { outerHTML: string };
}

function parseDocument(html: string): MinimalDocument {
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  const bodyInner = bodyMatch ? bodyMatch[1] ?? '' : html;
  const childTagRegex = /<([a-z][a-z0-9-]*)\b[^>]*>/gi;
  const children: { readonly tagName: string }[] = [];
  let depth = 0;
  let cursor = 0;
  const closeRegex = /<\/([a-z][a-z0-9-]*)\s*>/gi;
  while (cursor < bodyInner.length) {
    childTagRegex.lastIndex = cursor;
    closeRegex.lastIndex = cursor;
    const open = childTagRegex.exec(bodyInner);
    const close = closeRegex.exec(bodyInner);
    if (!open && !close) break;
    if (open && (!close || open.index < close.index)) {
      if (depth === 0) {
        children.push({ tagName: (open[1] ?? '').toUpperCase() });
      }
      depth++;
      cursor = (open.index ?? 0) + (open[0]?.length ?? 0);
    } else if (close) {
      depth = Math.max(0, depth - 1);
      cursor = (close.index ?? 0) + (close[0]?.length ?? 0);
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

  function buildBase(): AstroViewTransitionEventBase {
    return {
      from: fromUrl,
      to: toUrl,
      navigationType,
      direction,
      sourceElement: options.sourceElement,
      info: options.info,
      newDocument,
      viewTransition: supportsViewTransitions ? { skipTransition: () => {} } : undefined,
      formData: currentFormData,
    };
  }

  function buildBeforePreparation(): AstroBeforePreparationEvent {
    const base = buildBase();
    const event: AstroBeforePreparationEvent = {
      type: 'astro:before-preparation',
      ...base,
      defaultPrevented: false,
      preventDefault() {
        event.defaultPrevented = true;
      },
      loader: undefined,
    };
    return event;
  }

  function buildAfterPreparation(): AstroAfterPreparationEvent {
    return { type: 'astro:after-preparation', ...buildBase() };
  }

  function buildBeforeSwap(): AstroBeforeSwapEvent {
    const base = buildBase();
    return {
      type: 'astro:before-swap',
      ...base,
      swap() {
        // default no-op、 dispatchAll() で外側から override される
      },
    };
  }

  function buildAfterSwap(): AstroAfterSwapEvent {
    return { type: 'astro:after-swap', from: fromUrl, to: toUrl };
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
      let swapCalled = false;
      let fellBackToCrossDocument = !supportsViewTransitions;

      if (supportsViewTransitions) {
        beforePreparation = buildBeforePreparation();
        await runListeners('astro:before-preparation', beforePreparation);
        if (beforePreparation.defaultPrevented) {
          cancelled = true;
          return {
            beforePreparation,
            afterPreparation,
            beforeSwap,
            afterSwap,
            swapCalled,
            cancelled,
            fellBackToCrossDocument,
          };
        }
        if (typeof beforePreparation.loader === 'function') {
          await beforePreparation.loader();
        }
        afterPreparation = buildAfterPreparation();
        await runListeners('astro:after-preparation', afterPreparation);
      }

      beforeSwap = buildBeforeSwap();
      // swap default impl ... before-swap listener が override しなければ kiwa が呼出
      const originalSwap = beforeSwap.swap;
      beforeSwap.swap = () => {
        swapCalled = true;
        originalSwap();
      };
      await runListeners('astro:before-swap', beforeSwap);
      if (!swapCalled) {
        // listener が明示的に swap を呼ばなかった場合、 router 側で default swap を実行
        beforeSwap.swap();
      }

      afterSwap = buildAfterSwap();
      await runListeners('astro:after-swap', afterSwap);

      return {
        beforePreparation,
        afterPreparation,
        beforeSwap,
        afterSwap,
        swapCalled,
        cancelled,
        fellBackToCrossDocument,
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
