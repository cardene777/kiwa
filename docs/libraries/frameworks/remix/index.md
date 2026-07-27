# @kiwa-lab/remix

`@kiwa-lab/remix` は、Remix と React Router の loader、action、Resource Route、nested route を直接実行する test adapter です。route function に request 相当の入力を渡し、通常 data、`Response`、redirect、error を別の結果として取り出します。Remix server を起動しなくても、route がどの HTTP contract を返すかを Vitest で固定できます。

![Remixのloaderとactionが返す結果の分岐](/images/kiwa-docs/frameworks/remix-overview.png)

loader は URL、params、headers、context を受け取ります。plain object や `null` は `result`、通常の `Response` は `response`、3xx response は redirect information として返ります。loader が `undefined` を返す場合は実装漏れとして `error` になります。一方 action の `undefined` は許可されるため、loader と action を同じ戻り値規則で扱いません。

`invokeResourceRoute` は HTTP method によって呼び先を選びます。GET と HEAD は loader、POST、PUT、PATCH、DELETE は action へ渡します。対応する function がなければ adapter が 405 と allow list を返すため、route が返した 4xx response と framework が method を拒否した結果を分けて assertion できます。

`setupRemixNestedRouteEnv` は parent loader の plain data または JSON response を child loader の `context.parentData` に渡します。redirect、error、非 JSON response は data として渡しません。`defer` と `resolveDeferred` は promise の解決と rejection を追跡しますが、実際の streaming response や React rendering を作るものではありません。

この adapter は route manifest、browser transition、production server adapter、実 cookie session を再現しません。route function の入力と response contract はここで検証し、画面遷移や実 deployment は Remix application を起動する integration test または E2E test で確認します。

## 選ぶ場面

ページ load の data、フォーム送信、認可 redirect、method ごとの Resource Route、親子 route の data 継承を速く検証したい場合に向いています。画面の navigation state、transition 中の UI、実 session storage は browser を使う test の対象です。

[Quickstart](./quickstart) では loader の通常 data を確認します。[使い方](./how-to) では Resource Route、405、nested loader を扱います。入力と結果の全 shape は [リファレンス](./reference) にあります。
