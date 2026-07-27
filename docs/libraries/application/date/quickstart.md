# @kiwa-lab/date をはじめる

`@kiwa-lab/date` は、日付処理を実際の日時ライブラリへ接続せずに検証するための harness です。この Quickstart では、請求の開始日時から七日後の期限を作り、保存用の文字列に変換してから読み戻します。実行結果は常に UTC で比較するため、開発機の timezone に左右されません。

この package は date-fns、dayjs、Luxon、Temporal そのものを実行する adapter ではありません。provider 名は、差し替える予定の日時ライブラリを表すタグです。実ライブラリ固有の DST や locale の挙動は、統合テストで確認します。

## 用意するもの

プロジェクトに package と Vitest を追加します。すでに Vitest を導入している場合は、`@kiwa-lab/date` だけを追加してください。

```bash
pnpm add -D @kiwa-lab/date vitest
```

次に `tests/billing-date.test.ts` を作ります。このファイルは、期限を作る処理が UTC の七日後を返し、保存した文字列を同じ instant として読み戻せることを確認します。

## 期限を作り保存する

```ts
import { expect, it } from "vitest";
import {
  addDays,
  createDateClient,
  formatDate,
  parseDate,
} from "@kiwa-lab/date";

it("請求期限を UTC で保存して読み戻す", () => {
  const startedAt = new Date("2026-07-15T13:04:05.000Z");
  const due = addDays(startedAt, 7, "date-fns");
  const stored = formatDate(due.result, "YYYY-MM-DD HH:mm:ss", "date-fns");
  const restored = parseDate(stored.formatted, "YYYY-MM-DD HH:mm:ss", "date-fns");

  expect(due).toMatchObject({ days: 7, provider: "date-fns" });
  expect(stored.formatted).toBe("2026-07-22 13:04:05");
  expect(restored.date.toISOString()).toBe("2026-07-22T13:04:05.000Z");

  const client = createDateClient({ provider: "date-fns" });
  expect(client.diffDays(due.result, startedAt)).toBe(7);
});
```

`addDays` は日付の表示上の翌日ではなく、入力 timestamp に二十四時間ずつ加えます。`formatDate` は UTC の各 field を `YYYY`、`MM`、`DD`、`HH`、`mm`、`ss` に置き換えます。`parseDate` が返す `Date` も UTC として比較できます。したがって、この test は保存時の timezone 取り違えと、期限の日数取り違えを同時に防げます。

## 実行して結果を確認する

```bash
pnpm exec vitest run tests/billing-date.test.ts
```

成功すると一件の test が pass します。失敗した場合は、まず入力文字列に `Z` を付けて UTC で固定しているかを確認してください。`YYYY-MM-DD` のように時刻と offset を持たない値を、ローカル日時として作ると、実行する環境によって結果が変わります。

## skill で test の下書きを作る

`/kiwa:kiwa-date` に対象と出力先を渡すと date の test の下書きを作れます。初回だけ kiwa plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-date --module invoice --provider date-fns --output tests/integration/invoice.date.test.ts
```

生成物はそのまま採用せず、UTC 入力、期待する保存形式、実際に使う provider を自分の仕様に合わせます。生成後は同じ Vitest command で実行し、境界条件を追加してください。

```bash
pnpm exec vitest run tests/integration/invoice.date.test.ts
```

この command が pass して初めて、生成した test が現在の provider 名と保存形式を検証できています。失敗したときは、生成物の入力が UTC で固定されているかと、期待する文字列の形式が実装の保存形式と一致しているかを確認します。

## 次に進む

保存形式の validation、timezone 表示、定期予定の検証は [使い方](./how-to) で扱います。token とすべての戻り値は [リファレンス](./reference) にあります。
