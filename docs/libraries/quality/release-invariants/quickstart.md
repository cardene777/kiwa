# Release Invariants の導入

`@kiwa-lab/release-invariants` は release script を実行せずに読み取り、publish 対象の漏れ、mutation gate の漏れ、provenance flag の契約違反を検出します。目的は publish 成功後に「ある package だけ配布されていない」と気付く事故を、publish 前の CI で止めることです。shell を実行しない純粋な文字列検査なので、実際の registry publish を確認する integration test とは別に置きます。

## インストールする

```bash
pnpm add -D @kiwa-lab/release-invariants vitest
```

## release policy を一つの test にする

次の内容を `tests/release-invariants.test.ts` に保存してください。この test は正常な script と、mutation gate から package が漏れた script を同じ policy file で検証します。

```ts
import { expect, it } from "vitest";
import { buildReleaseInvariantsSummary } from "@kiwa-lab/release-invariants";

const publishable = [{ name: "@kiwa-lab/core" }, { name: "@kiwa-lab/auth" }];

it("公開する package が build と publish と mutation gate に含まれる", () => {
  const summary = buildReleaseInvariantsSummary({
    releaseScript: [
      "pnpm -F @kiwa-lab/core build",
      "pnpm -F @kiwa-lab/auth build",
      "pnpm publish --filter @kiwa-lab/core --filter @kiwa-lab/auth",
    ].join(" && "),
    mutationGateScript: [
      "pnpm -F @kiwa-lab/core test:mutation",
      "pnpm -F @kiwa-lab/auth test:mutation",
    ].join(" && "),
    publishable,
  });

  expect(summary.ok).toBe(true);
  expect(summary.releaseScriptFilter.entries).toEqual([
    expect.objectContaining({ name: "@kiwa-lab/core", ok: true }),
    expect.objectContaining({ name: "@kiwa-lab/auth", ok: true }),
  ]);
  expect(summary.gateScriptPackageCoverage.missingMutationFilter).toEqual([]);
  expect(summary.provenanceFlagAbsence.provenanceFlagPresent).toBe(false);
});

it("mutation gate から漏れた package を release しない", () => {
  const summary = buildReleaseInvariantsSummary({
    releaseScript: "pnpm -F @kiwa-lab/core build && pnpm -F @kiwa-lab/auth build && pnpm publish --filter @kiwa-lab/core --filter @kiwa-lab/auth",
    mutationGateScript: "pnpm -F @kiwa-lab/core test:mutation",
    publishable,
  });

  expect(summary.ok).toBe(false);
  expect(summary.gateScriptPackageCoverage.missingMutationFilter)
    .toEqual(["@kiwa-lab/auth"]);
});
```

`summary.ok` は release filter、provenance、mutation gate の三つが通った場合だけ `true` です。失敗する test では `missingMutationFilter` を assertion しているため、CI の出力から修正すべき package 名を特定できます。release script の表記を変えるときは、`-F <package>` と `--filter <package>` のどちらを失わせたかも確認してください。

## 実行する

```bash
pnpm exec vitest run tests/release-invariants.test.ts
```

この実行は publish を行いません。shell の変数展開、別 script の呼び出し、registry への接続は検査対象外です。実際の release workflow は別の CI integration test で確認してください。provenance の違反をどう診断するかは [使い方](./how-to) で説明します。

<!-- skill-guide -->
## skill との使い分け

この library に package 固有の companion skill はありません。release policy の test を作る場合は、初回だけ kiwa plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-design --layer unit --module release-policy
/kiwa:kiwa-vitest --module release-policy
```

生成された test に publishable package の一覧と build、publish、mutation gate の文字列が明示されていることを確認してから、対象 file だけを実行します。

```bash
pnpm exec vitest run tests/release-invariants.test.ts
```
