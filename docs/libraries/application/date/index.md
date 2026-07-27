# @kiwa-lab/date

`@kiwa-lab/date` は、日付演算、書式化、parse、固定 offset の timezone 変換をテストする in-memory harness です。date-fns、dayjs、Luxon、Temporal を provider 名で表し、同じ関数呼び出しで結果を比較できます。

![UTC の日時を演算し、表示用の timezone へ変換する流れ](/images/kiwa-docs/application/date-overview.png)

## 検証する流れ

`addDays` と `diffDays` は UTC timestamp を基準に計算します。保存した日時を `formatDate` し、同じ token で `parseDate` した結果を確認すると、保存形式と表示形式を混同していないかを検証できます。timezone 変換は対応している IANA 名を固定 offset に写すため、入力と期待する offset を明示してください。

ISO duration、繰り返し、祝日カレンダーは日付計算の結果を使う補助機能です。期限、予約、集計のどのルールを守りたいのかをテスト名に書き、DST のように固定 offset では表せない条件は実際の日時ライブラリまたは `Intl` の統合テストへ分けます。

## 重要な制約

provider は実際の date-fns、dayjs、Luxon、Temporal を起動する指定ではありません。計算の実装は共通です。また timezone 変換は既知の timezone 名を固定 offset で扱い、DST の日付に応じた offset 変化を再現しません。`America/New_York` や `Europe/London` の DST を保証するテストには実ライブラリまたは `Intl` を使ってください。

`diffDays(a, b)` は `a - b` を二十四時間単位で切り捨てます。カレンダー日数と時刻差を混同しないよう、入力を UTC で固定します。

## 使う場面

予約期間、締切、集計日、保存する日時文字列を安定してテストしたいときに使います。ロケール別の人間向け表示は `@kiwa-lab/i18n`、実際の timezone database の境界は統合テストで扱います。

## 読み進める

[Quickstart](./quickstart) で UTC の日付を加算して format します。[使い方](./how-to) では parse、timezone、繰り返しを扱います。token と制約の一覧は [リファレンス](./reference) にあります。
