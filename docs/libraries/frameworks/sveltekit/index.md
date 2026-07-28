# @kiwa-lab/sveltekit

`@kiwa-lab/sveltekit` は、SvelteKit の `load`、form action、`hooks.server` を synthetic event で検証する test adapter です。SvelteKit server や browser navigation を起動せずに、route parameter、cookie、`locals`、response header、redirect、error を入力と結果として扱います。

<img src="/images/kiwa-docs/frameworks/sveltekit-overview.webp" alt="SvelteKitの共有状態をresetするライフサイクル" width="1200" height="675" loading="lazy" decoding="async">

`invokeLoad` は URL、params、cookies、locals を持つ load event を作り、通常の data、redirect signal、error signal、response header を分けて返します。`invokeAction` は form data を action に渡し、`fail` が return された validation failure と、throw された redirect や error を別々に記録します。これにより、失敗を通常の data として誤って扱う test を避けられます。

server hook を test する場合は、`invokeHandle`、`invokeHandleFetch`、`invokeHandleError` を個別に使うか、`setupSvelteKitHooksEnv` で同じ request flow を組み立てます。共有環境では hook が書いた `locals` と cookie が後続 hook に見えます。`reset()` は test の開始時の浅い snapshot に戻すため、状態を共有したまま別ケースを実行するのではなく、明示的に lifecycle を確認するために使います。

この adapter は Svelte component の hydration、browser form submit、route manifest、adapter ごとの cookie serialization を再現しません。server-side の入力と副作用はここで検証し、画面表示や実 deployment の互換性は SvelteKit application を起動した E2E test で確認します。

## 選ぶ場面

load が受け取る URL parameter と header、form action の validation failure、認証 hook が `locals` と cookie を設定する経路、server-side fetch が upstream URL を書き換える経路を速く検証したい場合に向いています。コンポーネントの見た目や user interaction を確認する場合は、Svelte component test または browser E2E test を選びます。

[Quickstart](./quickstart) では load の data と response 副作用を確認します。[使い方](./how-to) では form action、hook、upstream fetch の分岐を扱います。各 helper の入力、戻り値、signal は [リファレンス](./reference) にあります。
