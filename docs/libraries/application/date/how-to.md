# @kiwa-lab/date の使い方

ここでは請求スケジュールを例に、外部から受け取った保存文字列を UTC として読み、表示用の固定 offset を作り、隔週の予定を展開します。最後に不正な入力を境界で失敗させます。保存時刻、画面の表示時刻、定期予定を別々の helper に隠すのではなく、それぞれの契約を同じ test file で明らかにします。

## 請求スケジュールを検証する

次の内容を `tests/billing-schedule.date.test.ts` にそのまま保存してください。`parseDate` は対応するパターンなら UTC として読みます。`timezoneConvert` の返す `date` は表示のために offset を加えた値で、保存済みの `storedAt` を書き換えません。`expandRecurrence` は限定された RRULE の展開機能です。

```ts
import { expect, it } from "vitest";
import {
  expandRecurrence,
  parseDate,
  timezoneConvert,
} from "@kiwa-lab/date";

it("請求日時を UTC で読み、東京表示と隔週の予定を作る", () => {
  const parsed = parseDate(
    "2026-01-01 00:00:00",
    "YYYY-MM-DD HH:mm:ss",
    "luxon",
  );
  const storedAt = parsed.date;
  const displayed = timezoneConvert(storedAt, "Asia/Tokyo", "luxon");
  const schedule = expandRecurrence(
    { freq: "WEEKLY", interval: 2, count: 3 },
    storedAt,
  );

  expect(storedAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  expect(displayed).toMatchObject({
    timezone: "Asia/Tokyo",
    offsetMinutes: 540,
    provider: "luxon",
  });
  expect(displayed.date.toISOString()).toBe("2026-01-01T09:00:00.000Z");
  expect(schedule.map(date => date.toISOString().slice(0, 10))).toEqual([
    "2026-01-01",
    "2026-01-15",
    "2026-01-29",
  ]);
});

it("保存できない日時は境界で失敗する", () => {
  expect(() => parseDate("not-a-date", "YYYY-MM-DD", "dayjs")).toThrow(
    'parseDate: invalid input "not-a-date"',
  );
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/billing-schedule.date.test.ts
```

成功時には、保存値が UTC のまま残り、表示用の値だけが九時間進みます。隔週の三件は開始日を含みます。二つ目の test が失敗する場合は、入力 validation がこの library の前で別の error に変換されていないかを確認してください。利用者に返す message、空文字の扱い、request schema はアプリケーション側で決めます。

## 制約を統合 test へ分ける

この library の timezone は既知の IANA 名を固定 offset に対応付けます。未知の timezone は UTC と同じ offset zero で返り、`America/New_York` や `Europe/London` の夏時間を日付ごとに計算しません。DST、locale による人間向け表示、月末調整、営業日、祝日を要件に含める場合は、採用した日時ライブラリまたは `Intl` を使う統合 test を別に作ってください。

`expandRecurrence` は `DAILY`、`WEEKLY`、`MONTHLY`、`YEARLY` と `interval`、`count`、`until` の subset を扱います。請求日が月末の場合や祝日なら翌営業日に寄せる場合は、その業務 rule を先に定義し、calendar provider と組み合わせた test を追加します。ここで固定するのは、UTC の保存値と、固定 offset の表示値と、指定した頻度の予定が混ざらないことです。

公開 API と対応 token は [リファレンス](./reference) を参照してください。
