# render / interaction / snapshot を選ぶ

`setupComponentEnv` の mode は、検証したい UI の契約に合わせます。

## render mode

初期 DOM、role、label、test id を確認するときに使います。`env.kind` は `"render"`、`env.mode` は `"mock"` で、`screen` と `result` を使えます。ユーザー操作を必要としない表示テストに向いています。

## interaction mode

クリック、入力、キーボード操作の後の表示を確認するときに使います。`@testing-library/user-event` が必要で、`env.kind` は `"interaction"`、`env.user` が使えます。内部の実装関数ではなく、利用者が行う操作から assertion を書きます。

## snapshot mode

render 済みの HTML を `env.markup` として取り出します。`env.kind` は `"snapshot"`、`env.mode` は `"mock"` です。重要な markup の変化を確認する補助に使い、操作や accessibility の検証は render / interaction test と併用します。

いずれの mode も、終了時には `await env.stop()` を呼びます。
