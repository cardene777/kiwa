# @kiwa-lab/python

`@kiwa-lab/python` は、Django、Flask、FastAPI、Starlette を想定した application contract を TypeScript の test process で確認する in-memory harness です。route、middleware、template を一つの environment に登録し、request を dispatch して status、header、body、middleware の呼び出し履歴を観察します。Python interpreter、WSGI server、ASGI server、実 framework は起動しません。

<img src="/images/kiwa-docs/languages/python-overview.webp" alt="Pythonアプリ環境のrouteとtemplateを観測する構造" width="1200" height="675" loading="lazy" decoding="async">

environment の route は HTTP method と path が完全一致したときだけ実行されます。`GET /items` と `POST /items`、`/items` と `/items/` は別の route です。middleware は登録順に `next` を囲み、呼び出し履歴に記録されます。`next` を呼ばずに response を返せば後続 middleware と route は実行されません。middleware の例外は response に変換されず、dispatch の promise が reject します。

template renderer は `&#123;&#123; name &#125;&#125;` と `&#123;&#123; user.name &#125;&#125;` の文字列を展開し、足りない key を返します。Jinja2 の filter、loop、condition、escape を再現しません。Django と Flask の既定 mode は `wsgi`、FastAPI と Starlette は `asgi` ですが、これは test 対象を示す metadata であり、実際の request pipeline を起動する指定ではありません。

## 使う判断

アプリが request body をどう解釈し、どの middleware が response を短絡し、template に何を渡すかを高速に固定する場合に使います。retry、timeout、rate limit、circuit breaker、idempotency は framework とは別の async wrapper として検証できます。

URL parameter、JSON parse、dependency injection、ORM、Jinja2 の高度な構文、実 network は対象外です。Django、Flask、FastAPI、Starlette の router、exception handler、template engine を確認する場合は、それぞれの Python integration test で検証してください。

## 読み進める

[Quickstart](./quickstart) は middleware と POST route を保存して実行します。[使い方](./how-to) は不足 template 値、middleware の短絡、未登録 route、retry の判断を扱います。[リファレンス](./reference) は environment、renderer、wrapper の戻り値と制約を確認するためのページです。
