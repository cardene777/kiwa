---
title: "@kiwa-lab/component fixture の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/component</code> <code v-pre>fixture</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildButton</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L31) <code v-pre>packages/component/src/fixture.ts</code>

Button — text label + optional click handler + disabled state。 variant は class 属性に反映 (chromatic diff で variant 別 baseline を持てる)。

```ts
export declare const buildButton: ComponentRender<ButtonArgs>;
```

#### <code v-pre>buildCard</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L234) <code v-pre>packages/component/src/fixture.ts</code>

Card — title / body / optional footer の 3 slot。 chromatic diff で variant 別 baseline を持つ用途の代表 pattern。

```ts
export declare const buildCard: ComponentRender<CardArgs>;
```

#### <code v-pre>buildForm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L112) <code v-pre>packages/component/src/fixture.ts</code>

Form — title + 複数 input + submit button。 submit 時に全 field の value を 集めて onSubmit に渡す。 required field 未入力なら submit を発火しない (validation)、 UI 側で「必須」 表示を出す責務。

```ts
export declare const buildForm: ComponentRender<FormArgs>;
```

#### <code v-pre>buildInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L66) <code v-pre>packages/component/src/fixture.ts</code>

Input — label + input の pair、 label[for] で id を関連付ける (a11y label rule を pass する)。 onChange は input event で発火。

```ts
export declare const buildInput: ComponentRender<InputArgs>;
```

#### <code v-pre>buildModal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L177) <code v-pre>packages/component/src/fixture.ts</code>

Modal — open=false なら空 div を返す (closed 状態を表現)。 open=true で backdrop + dialog を組む。 backdrop click / close button click で onClose を発火。

```ts
export declare const buildModal: ComponentRender<ModalArgs>;
```

#### <code v-pre>componentFixtures</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L260) <code v-pre>packages/component/src/fixture.ts</code>

全 component の render function を 1 record にまとめる (test 一括登録用)。

```ts
export declare const componentFixtures: Record<string, ComponentRender<Record<string, unknown>>>;
```

### 型

#### <code v-pre>ButtonArgs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L20) <code v-pre>packages/component/src/fixture.ts</code>

5 pattern の共通 component fixture。 Storybook story / Playwright CT mount / Chromatic capture の 3 経路で共有できる framework agnostic renderer。 実 SB / PW CT / Chromatic に持込む時は各 framework (React / Vue / Svelte / Solid) の component として書換えるが、 test だけ回す用途はこの fixture で完結する。 5 pattern の選定理由 = SaaS frontend で頻出する 5 primitive を全 cover する。 - Button (interactive、 click event、 disabled state) - Input (controlled、 input event、 label association) - Form (submit event、 field 集約、 validation) - Modal (open/close state、 backdrop click、 escape close) - Card (content wrapping、 title + body、 optional footer)

```ts
export interface ButtonArgs {
    label: string;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    onClick?: (event: MockEvent) => void;
}
```

#### <code v-pre>CardArgs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L223) <code v-pre>packages/component/src/fixture.ts</code>

```ts
export interface CardArgs {
    title: string;
    body: string;
    footer?: string;
    variant?: 'default' | 'outlined' | 'elevated';
}
```

#### <code v-pre>FormArgs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L100) <code v-pre>packages/component/src/fixture.ts</code>

```ts
export interface FormArgs {
    title: string;
    fields: FormField[];
    submitLabel?: string;
    onSubmit?: (data: Record<string, string>) => void;
}
```

#### <code v-pre>FormField</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L92) <code v-pre>packages/component/src/fixture.ts</code>

```ts
export interface FormField {
    id: string;
    label: string;
    type?: InputArgs['type'];
    required?: boolean;
    value?: string;
}
```

#### <code v-pre>InputArgs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L52) <code v-pre>packages/component/src/fixture.ts</code>

```ts
export interface InputArgs {
    id: string;
    label: string;
    value?: string;
    type?: 'text' | 'email' | 'password' | 'number';
    required?: boolean;
    placeholder?: string;
    onChange?: (event: MockEvent) => void;
}
```

#### <code v-pre>ModalArgs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L164) <code v-pre>packages/component/src/fixture.ts</code>

```ts
export interface ModalArgs {
    open: boolean;
    title: string;
    body: string;
    onClose?: () => void;
    closeOnBackdrop?: boolean;
}
```
