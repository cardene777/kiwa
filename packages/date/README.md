# @kiwa-lab/date

Date arithmetic + format mock harness for kiwa — date-fns / dayjs / Luxon / Temporal を統一 signature で in-process から叩ける test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/date
# or
npm install -D @kiwa-lab/date
# or
yarn add -D @kiwa-lab/date
```

## Supported providers

| Provider | Status | Style |
|---|---|---|
| date-fns | ✅ Ready | pure function |
| dayjs | ✅ Ready | immutable chain |
| Luxon | ✅ Ready | DateTime object |
| Temporal | ✅ Ready | proposal API |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import {
  createDateClient,
  addDays,
  diffDays,
  formatDate,
  timezoneConvert,
} from '@kiwa-lab/date';

describe('booking date math', () => {
  it('7 日加算 + JST 変換で ISO 出力', () => {
    const client = createDateClient({ provider: 'date-fns' });
    const later = addDays(client, '2026-07-15T00:00:00Z', 7);
    const diff = diffDays(client, '2026-07-15', later.iso.slice(0, 10));
    const tz = timezoneConvert(client, later.iso, 'Asia/Tokyo');
    expect(diff.days).toBe(7);
    expect(tz.iso).toContain('+09:00');
  });
});
```

## API reference

- `createDateClient({ provider: DateProvider }): DateClient` — provider 別 mock client
- `addDays(client, iso: string, days: number): ArithmeticResult` — 日数加算
- `diffDays(client, a: string, b: string): ArithmeticResult` — 日数差
- `formatDate(client, iso: string, pattern: string): FormatResult` — provider 別 format
- `parseDate(client, input: string, pattern: string): ParseResult` — pattern parse
- `timezoneConvert(client, iso: string, tz: string): TimezoneResult` — timezone + DST

## Test integration

vitest + `/kiwa-date` skill で DST 境界 / uzunc epoch / timezone 4 provider 差を統一 test 化。

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
