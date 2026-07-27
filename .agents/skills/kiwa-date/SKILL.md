---
name: kiwa-date
description: |
  @kiwa-lab/date (date-fns / dayjs / Luxon / Temporal 統一 mock harness) を使った date arithmetic + format test 生成 skill。
  `createDateClient({ provider })` で provider mock を立て、 `addDays` / `diffDays` / `formatDate` / `parseDate` / `timezoneConvert` を 4 provider 統一 signature で叩ける。UTC の日付演算、保存形式、固定 offset の timezone 変換を統一 test 化する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-date — date arithmetic + format test 生成

`@kiwa-lab/date` の 4 lib (date-fns / dayjs / Luxon / Temporal) 統一 mock を使った date test を Vitest 形式で生成する。

## 目的

日付処理を「lib を差し替えても同じ結果を担保する」 test で書く。lib 別 API を吸収した抽象で、UTC の日付演算、保存形式、固定 offset の表示値を test 化する。実 library の DST、locale、calendar 規則は対象外であるため、採用した provider または `Intl` の integration test に分ける。

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

`addDays(date, 7, provider)` と `diffDays(a, b, provider)` の結果を assertion します。UTC の日付、日付をまたぐ境界、負の差分を入力にし、`diffDays` が二十四時間単位の差を返すことを確認します。

### Step 2: format + parse test 生成

`formatDate(date, 'YYYY-MM-DD', provider)` と `parseDate('2026-07-15', 'YYYY-MM-DD', provider)` の round-trip を確認します。token は harness が対応する `YYYY`、`MM`、`DD`、`HH`、`mm`、`ss` に限り、provider 固有の token は検証しません。

### Step 3: timezone convert test 生成

`timezoneConvert(date, 'Asia/Tokyo', provider)` で UTC から JST の固定 offset 表示値を確認します。DST 境界や日付による offset 変化は再現しないため、`America/New_York` などを対象にする場合は実 provider の integration test を作ります。

## 使用例

```bash
/kiwa-date --module invoice --output tests/integration/invoice.date.test.ts
/kiwa-date --module scheduler --provider luxon
```
