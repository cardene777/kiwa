# mock / live / hybrid を選ぶ

`setupApiServer` は mode ごとに必要な入力が異なります。曖昧に混ぜず、テストが確認したい境界で選びます。

## mock mode

`mockHandlers` が必須です。既定の base URL は `http://kiwa.mock` で、`env.mocks.reset()` により MSW handler を reset できます。ネットワーク先の応答を固定し、エラーや edge case を速く確認するときに使います。

## live mode

`app` が必須です。`{ kind: "fetch", handler }` または Node.js handler を渡すと、空き port の local server が起動します。`env.request` はその server へ要求し、`env.stop()` は server を閉じます。

## hybrid mode

`app` と `mockHandlers` の両方が必須です。live server を起動したまま、未処理の MSW request は bypass されて app へ届きます。外部依存だけを MSW で置き換え、アプリ自身の route は live で確認したい場合に使います。

## よくあるエラー

- mock mode に `mockHandlers` がない — `setupApiServer({ mode: "mock" }) requires mockHandlers`。
- live mode に `app` がない — `setupApiServer({ mode: "live" }) requires app`。
- hybrid mode で片方がない — `app` と `mockHandlers` を両方指定します。

public type は [API Reference](../reference) を参照してください。
