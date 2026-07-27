# @kiwa-lab/form の使い方

Quickstart に続き、送信値の上書き、非同期 validation、依存 field を一つの test file で扱います。これらの helper は FormClient へ自動接続しないため、アプリケーションがどの値を送信するかを明示します。

## 上書きと追加 validation を確認する

`tests/signup.form.how-to.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import {
  createFormClient,
  registerField,
  submitForm,
  validateAsync,
  validateDependentFields,
} from "@kiwa-lab/form";

describe("signup form workflow", () => {
  it("saves an administrator override as the submitted value", async () => {
    const client = createFormClient({ provider: "formik" });
    registerField(client, { name: "email", defaultValue: "before@example.test" });
    let submitted = "";

    const result = await submitForm(client, {
      overrideValues: { email: "after@example.test" },
      onSubmit: (values) => { submitted = String(values.email); },
    });

    expect(result.ok).toBe(true);
    expect(submitted).toBe("after@example.test");
    expect(client.getValues()).toEqual({ email: "after@example.test" });
  });

  it("returns async validation errors for used usernames", async () => {
    const result = await validateAsync(
      { username: "taken", displayName: "Ada" },
      {
        username: async (value) => value === "taken" ? "already taken" : null,
        displayName: async (value) => String(value).length > 0 ? null : "required",
      },
    );

    expect(result).toMatchObject({
      valid: false,
      errors: { username: "already taken" },
    });
  });

  it("requires a zip code only when the destination is the US", () => {
    const result = validateDependentFields(
      { country: "US", zipCode: "" },
      [{
        field: "zipCode",
        dependsOn: "country",
        when: (country) => country === "US",
        validator: (value) => value ? null : "zip code is required",
      }],
    );

    expect(result).toEqual({
      valid: false,
      triggered: ["zipCode"],
      errors: { zipCode: "zip code is required" },
    });
  });
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/signup.form.how-to.test.ts
```

`clear()` が消すのは送信履歴と直近の error です。登録済み field と入力値を初期状態へ戻すには client を作り直します。`validateAsync` は HTTP request、timeout、retry を実装しません。実サービスの重複判定は API client で行い、その API を stub または test environment で別途検証してください。

`validateDependentFields` は `when` が真の rule だけを実行し、`triggered` に実行された field を返します。`createFieldArray` は array 操作専用の helper で、FormClient と自動同期しません。配列を送信値へ反映する処理はアプリケーション側で明示します。
