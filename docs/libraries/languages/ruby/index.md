# @kiwa-lab/ruby

`@kiwa-lab/ruby` は、Rails、Sinatra、Roda、Hanami を想定した application contract を TypeScript の test process で検証する in-memory harness です。Rails 風 action、generic route、最小 ERB 展開、ActiveRecord 風の操作記録を environment に集め、実 Ruby process を起動せずに status、body、before action、route match、記録した query を assertion できます。

![Ruby controllerとActiveRecord操作記録を観測する構造](/images/kiwa-docs/languages/ruby-overview.png)

Rails dispatch では before action を登録順に await してから action を呼びます。before action が例外を投げれば action は実行されず、例外が caller に伝わります。action が返す cookie と session は response の値であり、environment へ自動反映されません。generic route は追加順に調べ、method と path が合う最初の handler だけを呼びます。

`captureActiveRecord` は database を監視するものではありません。test または handler が `env.recordAR` で明示した操作を snapshot にまとめ、不要な `find` や `create` をしていないかを確認するための道具です。ERB renderer も `<%= name %>` の置換だけを扱い、control flow、method call、HTML escape、nested object の参照は実行しません。

## 使う判断

controller の response、before action の順序、route の分岐、view に渡す local、期待する database 操作の契約を高速に固定する場合に使います。retry、timeout、rate limit、circuit breaker は environment と独立した wrapper として検証できます。

Ruby VM、Rails callback、Rack、ActiveRecord、実 database、strong parameters、ERB の制御構文、route constraint は再現しません。フレームワーク固有の挙動と実 SQL は Ruby application の integration test で確認してください。

## 読み進める

[Quickstart](./quickstart) は Rails 風 action と操作記録を保存して実行します。[使い方](./how-to) は ActiveRecord snapshot、ERB の不足値、route match、実 database との分担を説明します。[リファレンス](./reference) は dispatch の状態と helper の制約を調べるためのページです。
