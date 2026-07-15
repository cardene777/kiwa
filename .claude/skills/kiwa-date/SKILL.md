---
name: kiwa-date
description: |
  @kiwa-lab/date (date-fns / dayjs / Luxon / Temporal 統一 mock harness) を使った date arithmetic + format test 生成 skill。
  `createDateClient({ provider })` で provider mock を立て、 `addDays` / `diffDays` / `formatDate` / `parseDate` / `timezoneConvert` を 4 provider 統一 signature で叩ける。 timezone / DST / uzunc epoch 境界の失敗経路も統一 test 化する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-date — date arithmetic + format test 生成

`@kiwa-lab/date` の 4 lib (date-fns / dayjs / Luxon / Temporal) 統一 mock を使った date test を Vitest 形式で生成する。

## 目的

日付処理を「lib を差し替えても同じ結果を担保する」 test で書く。 lib 別 API (date-fns addDays / dayjs add / Luxon plus / Temporal add) を吸収した抽象で test 化、 timezone / DST / うるう年境界の contract を保証する。

## 前提

- `pnpm add -D @kiwa-lab/date` install 済
- Vitest 環境
- 対象 module に date 処理 (formatting / arithmetic / timezone) が存在

## オプション

- `--module {name}` — test 対象 module
- `--provider {date-fns|dayjs|luxon|temporal}` — 主要 provider
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: arithmetic workflow test 生成

`addDays(date, 7, provider)` / `diffDays(a, b, provider)` の 4 provider 一致 assert。 うるう年 (2024-02-29) / 月末境界 (1/31 + 1month) の 3 case を it.each で cover。

### Step 2: format + parse test 生成

`formatDate(date, 'yyyy-MM-dd', provider)` / `parseDate('2026-07-15', 'yyyy-MM-dd', provider)` の round-trip verify。 4 provider 別 format token 差 (date-fns `yyyy` vs Luxon `yyyy` vs Temporal `year`) の統一結果 assertion。

### Step 3: timezone convert test 生成

`timezoneConvert(date, 'Asia/Tokyo', provider)` で UTC → JST 変換、 DST 境界 (America/New_York 3/13) で 4 provider 一致 verify。

## 使用例

```bash
/kiwa-date --module invoice --output tests/integration/invoice.date.test.ts
/kiwa-date --module scheduler --provider luxon
```
