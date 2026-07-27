# @kiwa-lab/nextjs

`@kiwa-lab/nextjs` は Next.js App Router の Server Action、middleware、Server Component、RSC stream を、開発サーバーや実ブラウザを起動せずに検証する test adapter です。関数の戻り値、kiwa の redirect signal、middleware が返す action、軽量な RSC tree を分けて確認します。

![Next.jsの直接入力から副作用を確認する構造](/images/kiwa-docs/frameworks/nextjs-overview.png)

## 対象にする境界

Server Action には FormData と追加引数を渡し、成功値、通常の error、redirect signal を分けて確認します。cookie と header は invocation に初期値として渡され、返された env から読み取れますが、helper が action へ `next/headers` の実装を注入するわけではありません。middleware では next、redirect、rewrite、JSON response を確認します。RSC では fallback、届いた chunk、最終値、error boundary、timeout を別々に観測します。

## 使う場面

認可 middleware、フォーム送信、redirect、RSC stream の失敗を高速に検証するときに使います。Playwright で画面遷移まで確認する前に、Server 側の分岐と副作用を小さいテストで固定できます。

## 使わない場面

実 React renderer、Flight payload の byte format、client hydration、複数 Suspense boundary の同時 interleave は対象外です。ブラウザ上での操作、CSS、遷移後の表示は [e2e](/libraries/foundation/e2e/) で確認します。production code の `redirect()` をこのパッケージの signal に置き換えるのはテストの seam だけです。

## テストを分ける

Server Action の cookie と header、RSC の data source は test case ごとに作ります。一つの result や stream を別テストで再利用すると、前の副作用と chunk の順序が assertion に混ざります。

## 次に読む

[はじめる](./quickstart) で Server Action の redirect を確認します。[使い方](./how-to) では middleware、RSC signal、Parallel Route の fallback を扱います。各 API の入力と戻り値は [リファレンス](./reference) で確認できます。
