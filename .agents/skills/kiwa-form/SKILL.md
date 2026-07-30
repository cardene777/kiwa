---
name: kiwa-form
description: |
  @kiwa-lab/form (React Hook Form / Zod / Formik / Conform 統一 mock harness) を使った form validation + submit test 生成 skill。
  `createFormClient` で provider mock を立て、 `validateSchema` で 4 provider の validate 挙動を統一 shape で取得、 `submitForm` で validate → onSubmit → result 集約、 `registerField` + `getFieldError` で field-level error を verify できる。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-form — form validation + submit test 生成

`@kiwa-lab/form` の 4 provider (React Hook Form / Zod / Formik / Conform) 統一 mock を使った form test を Vitest 形式で生成する。

## 目的

form UI を「provider を差し替えても同じ validate 結果を担保する」 test で書く。 provider 別 schema 記法 (RHF resolver / Zod parse / Formik validate / Conform constraint) を吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/form` install 済
- Vitest 環境
- 対象 module に form (login / signup / profile update 等) が存在

## オプション

- `--module {name}` — test 対象 module
- `--provider {react-hook-form|zod|formik|conform}` — 主要 provider (省略時 = 4 provider 全対応)
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: field register + submit workflow test 生成

`createFormClient({ provider })` で client を立て、`registerField(client, { name: 'email', rule: { required: true } })` と `submitForm(client, { overrideValues, onSubmit })` で validate、submit、result 集約の順序を確認します。

### Step 2: validateSchema test 生成

`validateSchema(schema, values, provider)` で統一 result の `ok`、`errors`、`values` を assertion します。`errors` は `{ field, message, code }` の配列です。正常系、required 欠落、format 不正、custom rule を確認します。非同期 validation は `validateAsync` を別に使い、`FormClient` の `submit` に自動接続しません。

### Step 3: field-level error test 生成

`getFieldError(client, 'email')` で直近の submit validation error を取得し、`submitForm` の `overrideValues` または `client.setValue` で値を更新して再度 `submit` し、error が消えることを確認します。

## 使用例

```bash
/kiwa-form --module signup --output tests/integration/signup.form.test.ts
/kiwa-form --module profile --provider zod
```
