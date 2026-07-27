# Release policy の違反を診断する

`buildReleaseInvariantsSummary` は release policy 全体を一度に判定するため、CI の入口に向いています。script を変更して失敗した理由を狭めたいときは、個別の checker を使います。`checkProvenanceFlagAbsence` は `--provenance` の位置を抜粋し、`checkGateScriptPackageCoverage` は mutation gate から漏れた package 名を返します。どちらも script を実行せず、入力文字列以外を読み書きしません。

次の内容を `tests/release-script.policy.test.ts` に保存してください。provenance の混入と mutation gate の漏れを意図的に作り、返り値のどこを CI message に出すべきか確認します。

```ts
import { expect, it } from "vitest";
import {
  checkGateScriptPackageCoverage,
  checkProvenanceFlagAbsence,
  checkReleaseScriptFilter,
} from "@kiwa-lab/release-invariants";

it("release policy の違反箇所を package 名と抜粋で返す", () => {
  const releaseScript = [
    "pnpm -F @kiwa-lab/core build",
    "pnpm -F @kiwa-lab/auth build",
    "pnpm publish --filter @kiwa-lab/core --provenance",
  ].join(" && ");
  const publishable = [{ name: "@kiwa-lab/core" }, { name: "@kiwa-lab/auth" }];

  const filters = checkReleaseScriptFilter(releaseScript, publishable);
  const provenance = checkProvenanceFlagAbsence(releaseScript);
  const coverage = checkGateScriptPackageCoverage(
    "pnpm -F @kiwa-lab/core test:mutation",
    publishable,
  );

  expect(filters.ok).toBe(false);
  expect(filters.missingPublishFilter).toEqual(["@kiwa-lab/auth"]);
  expect(filters.entries.find((entry) => entry.name === "@kiwa-lab/auth"))
    .toMatchObject({ buildFilterPresent: true, publishFilterPresent: false, partial: true });

  expect(provenance).toMatchObject({ ok: false, provenanceFlagPresent: true });
  expect(provenance.excerpts[0]).toContain("--provenance");

  expect(coverage.ok).toBe(false);
  expect(coverage.missingMutationFilter).toEqual(["@kiwa-lab/auth"]);
});
```

実行します。

```bash
pnpm exec vitest run tests/release-script.policy.test.ts
```

この例では `@kiwa-lab/auth` は build filter にはありますが publish filter にありません。`partial` は片方だけが存在することを示し、`missingPublishFilter` は直すべき方を示します。mutation gate の検査は `-F @scope/name` だけを探します。release script の `--filter` を mutation gate に書いても coverage は満たしません。

`checkProvenanceFlagAbsence` は最大三つの `excerpts` を返します。script をその場で実行して原因を確かめる必要はありません。出力された excerpt を使って policy を修正し、同じ test を再実行します。この library は shell parser ではないため、変数展開、引用符による意味の違い、別 script の呼び出し、実際に publish できる認証状態は確認できません。そうした契約は CI integration test に残してください。

## 実運用での置き方

publishable package の一覧は、release script と同じ repository の設定から生成または読み込みます。リリース job の前段にこの test を置き、失敗時は `missingBuildFilter`、`missingPublishFilter`、`missingMutationFilter`、`excerpts` を表示すると、修正箇所を一回で追えます。baseline を持つ quality gate と違い、この library の入力は文字列なので、release script を変更する pull request ごとに常に実行して構いません。
