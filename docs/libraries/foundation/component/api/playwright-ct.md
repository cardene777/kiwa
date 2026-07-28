---
title: "@kiwa-lab/component playwright-ct の API 契約"
---

# <code v-pre>@kiwa-lab/component</code> <code v-pre>playwright-ct</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/playwright-ct.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createPlaywrightCTMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/playwright-ct.ts#L46) <code v-pre>packages/component/src/playwright-ct.ts</code>

PlaywrightCTMock を新規作成する。 mount 毎に in-memory canvas を組み、 ComponentLocator に wrap して返す。 activeMounts count は resource leak 検出用 (test で unmount 忘れを assert できる)。

```ts
export declare function createPlaywrightCTMock(): PlaywrightCTMock;
```

### 型

#### <code v-pre>PlaywrightCTMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/playwright-ct.ts#L30) <code v-pre>packages/component/src/playwright-ct.ts</code>

Playwright Component Testing (CT) 互換の最小 mock。 real Playwright CT は `mount(component)` → `Locator` を返し、 `page.getByText().click()` 等で interact する。 mock は同じ API 表面 (mount / getByText / getByRole / click / fill / textContent / count) を持ち、 real vs mock で同じ test を回せる。 実 Playwright CT との差分 = (1) browser process を起動しない (in-memory)、 (2) network request の intercept / route は非 support (別の kiwa mock で 対応)、 (3) screenshot は Chromatic 経路に一本化する。 使い方 ... ```ts const ct = createPlaywrightCTMock(); const button = ct.mount((args) =&gt; createNode('button', { text: args.label, on: { click: args.onClick } }), { label: 'ok', onClick: () =&gt; hits++ }); await button.getByRole('button', { name: 'ok' }).click(); expect(hits).toBe(1); ```

```ts
export interface PlaywrightCTMock {
    mount<TArgs>(render: ComponentRender<TArgs>, args: TArgs): ComponentLocator;
    /** mount 済 locator 一覧 (test teardown で全 unmount する時使う)。 */
    activeMounts(): number;
    /** 全 mount を解放する — vitest afterEach 相当の cleanup。 */
    unmountAll(): void;
}
```
