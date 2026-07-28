# kiwa-test-py

`kiwa-test-py` は、kiwa の仕様 Markdown を Python test の入力として扱うための pytest adapter です。parser は仕様表を `SpecDoc` と `SpecCase` に変換し、pytest plugin は repository の `tests/spec` から選んだ仕様を `kiwa_spec` fixture として test に渡します。requests と httpx の adapter を使うと、仕様に書かれた route を HTTP client で呼べます。

<img src="/images/kiwa-docs/native-languages/python-overview.webp" alt="pytest の仕様選択と HTTP 検証" width="1200" height="658" loading="lazy" decoding="async">

この library が担うのは、仕様の選択、表の検証、HTTP request の組み立てです。FastAPI application、database、認証、mock server を起動する framework ではありません。endpoint は利用側で起動または注入し、adapter を閉じる責任も利用側にあります。これを分けることで、仕様の意味を読み取る test と、実 service へ接続する integration test を同じ parser の上で書けます。

parser は壊れた仕様で例外を投げず、空の `cases` と `warnings` を返します。CI では warning が空であることを確認しない限り、必須 column がない仕様を見逃す可能性があります。pytest plugin は `KIWA_LAYER` と `KIWA_MODULE` の両方が指定された場合に一つの file を選びます。どちらかがない場合は `tests/spec` から最初に見つかった file を使うため、CI では必ず両方を固定します。

## 選ぶ場面

仕様にある case ID、route、mode を test の assertion と結び付けたい場合、同じ API contract を requests と httpx の両方で使いたい場合に向いています。Python application の request を実行する仕組みは持たないため、FastAPI の TestClient、Django client、localhost の staging API などは目的に応じて別に用意します。

[Quickstart](./quickstart) では仕様を parse して pytest で実行します。[pytest で仕様を選ぶ](./how-to) では CI での selection、HTTP adapter の lifecycle、仕様がない場合の分岐を扱います。公開 API と warning の条件は [リファレンス](./reference) にあります。
