# @kiwa-lab/date

Date arithmetic + format mock harness for kiwa — date-fns / dayjs / Luxon / Temporal を統一 interface で invoke する in-process mock。

## API

- `createDateClient({ provider })` = provider mock client (addDays / diffDays / format / parse / timezoneConvert)
- `addDays(date, days, provider)` = 日付加算
- `diffDays(a, b, provider)` = 日数差計算
- `formatDate(date, pattern, provider)` = 日付書式化
- `parseDate(str, pattern, provider)` = 文字列パース
- `timezoneConvert(date, tz, provider)` = timezone 変換
