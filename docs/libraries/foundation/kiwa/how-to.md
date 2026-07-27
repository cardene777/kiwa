# kiwa の使い方

kiwa を使うときに最初に決めるのは framework 名ではなく、どの境界を独立して確認したいかです。一つの harness でアプリ全体を再現しようとすると、test が遅くなり、失敗した理由も見えにくくなります。まず in-memory harness でアプリ側の判断を固定し、実 network、browser、database、provider が必要な箇所だけを integration test や E2E test に残します。

## 境界から library を選ぶ

| 確認したいこと | 最初に選ぶ library | 実環境で補うこと |
| --- | --- | --- |
| HTTP handler の request、status、body、認可 | [api](../api/) | network、実 server、reverse proxy |
| browser 上の入力、画面遷移、表示 | [e2e](../e2e/) | 実 browser と deployed application |
| component の props、状態、user interaction | [ui](../ui/) | CSS、layout、browser API |
| framework 固有の lifecycle や routing | 該当する [framework adapter](/libraries/frameworks/) | framework runtime と deployment adapter |
| session、queue、provider response などの service 境界 | [サービス library](/libraries/services/) | 実 provider と認証情報 |

たとえば「ログイン後に dashboard を表示する」は、一つの test に全部を詰め込む必要はありません。auth library で session の生成と拒否理由を確認し、framework adapter で `locals` や middleware への受け渡しを確認し、E2E で実際の画面遷移を確認します。各層が何を保証し、何を保証しないかを分けると、失敗時に調べる範囲も小さくなります。

## 最初の test を動かす

ここでは API handler の境界を例にします。対象の library を依存へ追加し、Quickstart の test file をそのまま一度実行します。

```bash
pnpm add -D @kiwa-lab/api vitest
pnpm exec vitest run tests/items.api.test.ts
```

最初の実行では、返り値、status、失敗時の error がどこで assertion されているかを読みます。test が通ったことだけで library の全機能を使い始めないでください。次に [api の使い方](../api/how-to) で、認可や複数 request のように実装で増えやすい分岐を追加します。別の境界を選んだ場合も同じです。各 library の Quickstart で最小の file を動かし、How-to で実務の分岐を足し、Reference で API の契約を確認します。

## skill と手書きの test を分ける

受け入れ条件があり、複数の test 層を同じ仕様に結び付けたいときは skill を使います。既存の小さい module を確認したいだけなら、先に各 library の Quickstart にある手書きの test を動かす方が早く、生成内容も判断しやすくなります。skill は runtime library を置き換えません。生成された test も通常の source と同じように review します。

初回だけ plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

signup の unit test を仕様から作る場合は、spec を作成してから対象 module の test を生成します。

```text
/kiwa:kiwa-design --layer unit --module signup
/kiwa:kiwa-vitest --module signup
```

出力された file を確認してから、生成した test だけを実行します。

```bash
pnpm exec vitest run test/unit/signup.test.ts
```

layer skill がある library では、`kiwa-design` が作る `tests/spec/` の内容が入力になります。専用 skill がない library は、Quickstart と Reference を根拠に test を手で書きます。skill が存在しないことは library の機能不足を意味しません。また、skill が test を生成できることは実 provider や browser での動作を証明しません。

## 失敗を調べる順番

失敗したら、まず test が固定している境界を確認します。return result に error が入る library は error code と state を、throw する API は error type と message を、event を記録する harness は event の順番を確認します。次に、その失敗が harness の対象外ではないかを Overview の制約で確認します。provider SDK や network が返す実際の error、browser の rendering、database transaction のような対象外は、対応する integration test または E2E test に移します。

library の API を更新したら、package の README と site の該当ページを同時に更新します。中央の docs を正本とし、package 側には該当ページへの link を残します。更新時の確認項目は [ライブラリ文書を更新する](../../../guides/library-docs) を参照してください。
