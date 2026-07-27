# @kiwa-lab/form

`@kiwa-lab/form` は、フォームの入力規則と送信フローを UI framework なしで検証する in-memory harness です。React Hook Form、Zod、Formik、Conform を provider 名で選び、field の登録、値、validation error、送信履歴を同じ API で扱えます。

![field を登録し、入力を検証して送信結果を記録する流れ](/images/kiwa-docs/application/form-overview.png)

## 検証する流れ

field を登録したあと、値を設定して `submit` すると、まず `required`、`min`、`max`、`pattern`、`custom` の順に schema を検証します。失敗した送信では `onError` だけが呼ばれ、`onSubmit` は実行されません。成功した送信では provider、連番の id、送信値、時刻が履歴に残ります。この順序をテストで固定すると、画面の実装を変えても、送信 payload と失敗時の分岐が保たれているかを確認できます。

非同期 validator、配列の操作、他の field によって必須条件が変わる field も、同じ送信フローの前後に追加して検証できます。ただし、これらは FormClient へ自動的に結び付くわけではありません。アプリケーションがどの値を送信するかを明示してください。

## provider の意味

`provider` は `react-hook-form`、`zod`、`formik`、`conform` です。現在の mock では provider による validation の挙動差は持たず、result の provider と id prefix を区別します。実際の resolver、Zod schema、Formik component、Conform form data の統合は対象外です。

## 使う場面

画面を描画せずに、送信 payload と error 分岐だけを速く確認したいときに使います。input の表示、focus、accessibility、ブラウザーの submit は UI test で確認してください。

## 読み進める

[Quickstart](./quickstart) で必須 field の失敗と成功を確認します。[使い方](./how-to) では値の上書き、非同期 validation、依存 field を扱います。すべての入力と状態は [リファレンス](./reference) を参照してください。
