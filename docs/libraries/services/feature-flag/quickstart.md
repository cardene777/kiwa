# @kiwa-lab/feature-flag をはじめる

フラグを定義し、利用者に対して評価します。この client は remote config を取得しません。アプリケーションが受け取った flag definition と targeting rule に対して、画面や API がどの値を使うかを process 内で固定する test fixture です。

## インストール

```bash
pnpm add -D @kiwa-lab/feature-flag vitest
```

## 既定値と未知 key を確認する

`tests/kiwa/feature-flag.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import { createFlagClient, evaluateFlag } from "@kiwa-lab/feature-flag";

describe("checkout flag", () => {
  it("returns the default value for a registered flag", () => {
    const client = createFlagClient({
      provider: "growthbook",
      idSeed: 0,
      flags: [{ key: "new-checkout", variant: "boolean", defaultValue: false }],
    });

    const result = evaluateFlag(client, "new-checkout", { id: "u1" });

    expect(result.value).toBe(false);
    expect(result.reason).toBe("default");
    expect(result.record.id).toBe("gb-1");
  });

  it("does not treat an unknown key as an enabled flag", () => {
    const client = createFlagClient({ provider: "growthbook", idSeed: 10 });

    const result = evaluateFlag(client, "removed-checkout", { id: "u1" });

    expect(result).toMatchObject({
      value: false,
      reason: "flag-not-found",
      record: { id: "gb-11", variant: "boolean" },
    });
  });
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/kiwa/feature-flag.test.ts
```

成功すると、登録済み flag は既定値と `default` の理由を返し、未知 key は false と `flag-not-found` を返します。期待と異なる場合は、flag key が完全に一致しているか、同じ client を他の test と共有していないかを確認してください。

登録 flag の variant と default value の型は runtime で検証しません。definition は test 側で正しく作り、文字列または数値の flag を boolean として読む code を型検査で防いでください。targeting と rollout は [使い方](./how-to) で確認します。

## skill で test を作る

この library には `/kiwa:kiwa-feature-flag` という companion skill があります。初回だけ kiwa plugin を導入してから使います。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

skill は library の挙動を実行時に置き換えるものではなく、ここで確認したい flag evaluation の境界を test の形にする入口です。plugin の導入方法と更新方法は [kiwa の skill を使う](../../../guides/skills) にもまとめています。

```text
/kiwa:kiwa-feature-flag --module new-checkout --provider growthbook --output tests/integration/new-checkout.feature-flag.test.ts
```

生成後は `tests/integration/new-checkout.feature-flag.test.ts` を読み、Quickstart と同じ成功条件・失敗条件が期待値になっていることを確認してから、その file だけを実行します。

```bash
pnpm exec vitest run tests/integration/new-checkout.feature-flag.test.ts
```

provider や対象の種類、出力先を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-feature-flag/SKILL.md) を参照してください。
