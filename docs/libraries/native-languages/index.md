# ネイティブ言語

ネイティブ言語ライブラリは、Python の標準テストランナーへ直接組み込むための test helper です。TypeScript から別言語のアプリケーションを操作する言語アダプターとは異なり、対象言語のテストコードから import して使います。

## 言語から選ぶ

pytest の fixture と plugin は [kiwa-test-py](./python/) を選びます。どれもテストごとに状態を作り、外部 network を使わずに request、response、mock の結果を検証します。

## 読み進め方

対象言語の Quickstart で、標準 test runner を使った最小例を通してください。次に使い方ページで framework adapter、fixture の寿命、mock の reset を追加します。feature ごとの import と、実サービスとの差はリファレンスにまとめています。
