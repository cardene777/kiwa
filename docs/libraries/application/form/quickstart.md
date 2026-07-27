# @kiwa-lab/form をはじめる

ここでは email と password を登録し、invalid な入力では送信されず、valid な入力だけが送信されることを同じ test file で確認します。

## インストール

```bash
pnpm add -D @kiwa-lab/form vitest
```

## invalid と valid の送信を確認する

`tests/signup.form.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import {
  createFormClient,
  getFieldError,
  registerField,
  submitForm,
} from "@kiwa-lab/form";

describe("signup form", () => {
  it("does not submit invalid email and password values", async () => {
    const client = createFormClient({ provider: "zod", now: () => 1000 });
    registerField(client, {
      name: "email",
      rule: { required: true, pattern: /^[^@]+@[^@]+$/ },
    });
    registerField(client, { name: "password", rule: { min: 8 } });

    const result = await submitForm(client, {
      overrideValues: { email: "invalid", password: "short" },
      onSubmit: () => { throw new Error("validation failure must not submit"); },
    });

    expect(result).toMatchObject({
      ok: false,
      provider: "zod",
      values: { email: "invalid", password: "short" },
    });
    expect(getFieldError(client, "email")).toMatchObject({ code: "pattern" });
    expect(getFieldError(client, "password")).toMatchObject({ code: "min" });
  });

  it("submits valid values and records the submission", async () => {
    const client = createFormClient({ provider: "zod", now: () => 1000 });
    registerField(client, { name: "email", rule: { required: true } });

    const result = await submitForm(client, {
      overrideValues: { email: "ada@example.test" },
      onSubmit: async (values) => expect(values.email).toBe("ada@example.test"),
    });

    expect(result).toMatchObject({ ok: true, id: "zod-1", errors: [] });
    expect(client.listSubmitted()).toHaveLength(1);
  });
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/signup.form.test.ts
```

`submitForm` は `overrideValues` を client に保存してから submit を呼びます。この上書きは一度の送信だけの値ではなく、client の現在値になります。別の入力ケースは新しい client を作って分離してください。field のない値は validation の対象になりません。

input の表示、focus、accessibility、browser submit は UI test で確認します。送信後に値を更新するケース、非同期 validation、依存 field の規則は [使い方](./how-to) に進んでください。

## skill で test を作る

この library には `/kiwa:kiwa-form` という companion skill があります。初回だけ kiwa plugin を導入し、この Quickstart の package 導入も済ませてください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

skill は library の挙動を実行時に置き換えるものではなく、確認したい form の境界を test の形にする入口です。

```text
/kiwa:kiwa-form --module signup --output tests/integration/signup.form.test.ts
```

生成後は `tests/integration/signup.form.test.ts` を読み、Quickstart と同じ成功条件・失敗条件が期待値になっていることを確認してから、その file だけを実行します。

```bash
pnpm exec vitest run tests/integration/signup.form.test.ts
```

provider や対象の種類、出力先を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-form/SKILL.md) を参照してください。
