# @kiwa-lab/date API reference

## Overview

`@kiwa-lab/date` は date-fns / dayjs / Luxon / Temporal 4 lib を統一 interface で mock する date arithmetic + format test infra。 timezone / DST / epoch 境界 の失敗経路を統一 shape で verify する。

## Supported providers

| provider | timezone | ISO format | plugin model |
|---|---|---|---|
| date-fns | via date-fns-tz | full | tree-shakable functions |
| dayjs | via dayjs/plugin/timezone | full | plugin extend |
| luxon | native (Intl) | full | native |
| temporal | native (proposal) | full | native |

## Main API

### `createDateClient(options: CreateDateClientOptions): DateClient`

provider 別 mock client、 `{ timezone?, locale? }` config。

### `addDays(client, date: Date | string, amount: number): ArithmeticResult`

日付演算、 `{ result: Date, provider, tzApplied }`。 timezone offset を明示 track。

### `diffDays(client, from, to): ArithmeticResult`

日付差分、 DST 境界を跨ぐ場合の挙動 (常に 24h として計算 or DST 考慮) を provider 別に verify。

### `formatDate(client, date, pattern: string): FormatResult`

Intl.DateTimeFormat 相当の format、 `{ text, provider, locale }`。 pattern = `'yyyy-MM-dd HH:mm:ss'` / `'yyyy年MM月dd日'` 等。

### `parseDate(client, input: string, pattern?: string): ParseResult`

string を Date に parse、 `{ date, provider, parsed: boolean, error? }`。

### `timezoneConvert(client, date, fromTz, toTz): TimezoneResult`

timezone 変換、 `{ result, provider, offsetMinutes }`。 DST 境界での offset shift を確認。

## Types

- `DateProvider = 'date-fns' | 'dayjs' | 'luxon' | 'temporal'`
- `ArithmeticResult` = `{ result: Date, provider, tzApplied? }`
- `FormatResult` = `{ text, provider, locale }`
- `ParseResult` = `{ date?, provider, parsed: boolean, error? }`
- `TimezoneResult` = `{ result: Date, provider, offsetMinutes }`

## Usage examples

### DST 境界の date 演算

```typescript
import { createDateClient, addDays, diffDays } from '@kiwa-lab/date';
import { describe, expect, it } from 'vitest';

describe('DST spring-forward (America/Los_Angeles)', () => {
  it('addDays 1 で elapsed hours = 23 (DST loss)', () => {
    const client = createDateClient({ provider: 'luxon', timezone: 'America/Los_Angeles' });
    const before = addDays(client, '2026-03-08T00:00-08:00', 1).result;
    const after = addDays(client, '2026-03-09T00:00-07:00', 0).result;
    // luxon は wall clock 保存 = 24h 進む
    expect(before.toISOString()).toContain('2026-03-09');
  });
});
```

### format + parse round trip

```typescript
import { createDateClient, formatDate, parseDate } from '@kiwa-lab/date';

const client = createDateClient({ provider: 'date-fns', locale: 'ja' });
const text = formatDate(client, new Date('2026-07-15T00:00:00Z'), 'yyyy年MM月dd日').text;
console.log(text); // "2026年07月15日"
const back = parseDate(client, text, 'yyyy年MM月dd日');
expect(back.parsed).toBe(true);
```

## Related skills

- [`/kiwa-date`](../skills/kiwa-date) — date arithmetic test 生成 skill
