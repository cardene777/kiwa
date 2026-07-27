# @kiwa-lab/ui

`@kiwa-lab/ui` は、React component と framework ごとの test utility を扱う UI test adapter です。React では JSDOM の render、user-event を使う interaction、初期 markup を固定する snapshot を同じ lifecycle で扱えます。実 browser が必要な場合は、React component を静的 HTML にして Playwright page へ渡す専用 helper を使います。

![コンポーネント操作を検証する流れ](/images/kiwa-docs/foundation/ui-overview.png)

## 何を検証する library か

`setupComponentEnv` は React component を JSDOM へ render し、mode に応じて screen、user-event、初期 markup を返します。render mode は初期表示、interaction mode は click や keyboard 後の state、snapshot mode は render 直後の HTML を確認するためのものです。すべての environment は `stop()` で unmount と Testing Library cleanup を実行します。

Vue、Svelte、Solid、Lit、Qwik、Angular には、それぞれの test utility を動的に読み込む helper があります。戻り値は React の environment と同一ではありません。各 framework の helper が返す wrapper や container を使い、React 専用の `screen` や `user` が常にあると仮定しないでください。

## 採用する判断

component の初期表示、操作による状態変化、role、test ID、静的 markup を素早く確認したい場合に使います。`setupBrowserComponentEnv` は static markup、role、表示、screenshot の確認に向きますが、React event handler を browser で実行したり hydration したりする helper ではありません。

実 browser の layout、focus、native input の差、network を伴う画面遷移、hydration 後の操作は browser component test または E2E へ渡します。`setupComponentEnv` の `mode: "browser"` は利用できません。browser が必要なときは必ず専用 helper を呼びます。

## 利用の流れ

Quickstart で interaction mode の counter を描画し、click 後の state を assertion します。How-to では snapshot、static browser markup、framework helper を使い分けます。environment を作った test は、例外時も cleanup されるよう `afterEach` または `finally` で `stop()` します。

[はじめる](./quickstart) は React interaction を扱います。[使い方](./how-to) は mode と browser の境界を扱います。公開 API と framework helper の option は [リファレンス](./reference) を参照してください。
