# 仕様を分割して保存する

`splitSpec` は file を書かない pure function です。まず `classify` で検証責任の曖昧さを止め、成功した specification だけを formal と runtime の Markdown に分けます。その後に出力 path、directory 作成、source control への追加、各検証 runner を呼び出す責任は呼び出し側にあります。

次の内容全体を `tests/kaname-split.test.ts` に保存します。失敗する分類と、保存可能な分割結果を同じ file で扱います。ここでは test 内に string として保持しますが、アプリケーションでは `output` を `writeFile` に渡して任意の path へ保存します。

```ts
import { expect, it } from "vitest";
import { classify, splitSpec, type SpecDoc } from "@kiwa-lab/kaname";

it("rejects one artifact shared by formal and runtime", () => {
  const report = classify({
    title: "Signup",
    items: [
      {
        id: "AC-001",
        statement: "state transition is valid",
        layer: "formal",
        verifyBy: "tests/signup.test.ts",
      },
      {
        id: "AC-002",
        statement: "request is persisted",
        layer: "runtime",
        verifyBy: "tests/signup.test.ts",
      },
    ],
  });

  expect(report.ok).toBe(false);
  expect(report.issues).toContainEqual(expect.objectContaining({
    reason: "both-layers-touch-same-artifact",
  }));
});

it("splits a valid specification before the caller writes it", () => {
  const spec: SpecDoc = {
    title: "Signup",
    issueRef: "KIWA-42",
    items: [
      {
        id: "AC-001",
        statement: "session transitions follow the documented states",
        layer: "formal",
        verifyBy: "Session",
      },
      {
        id: "AC-002",
        statement: "signup persists the account",
        layer: "runtime",
        verifyBy: "tests/integration/signup.test.ts",
      },
      {
        id: "AC-003",
        statement: "the approval screen is reviewed by product",
        layer: "human",
        verifyBy: "Product approval",
      },
    ],
  };
  const report = classify(spec);
  expect(report.ok).toBe(true);
  if (!report.ok) throw new Error(report.issues.map((issue) => issue.reason).join(", "));

  const output = splitSpec(spec);
  expect(output.specFormal).toContain("AC-001");
  expect(output.specFormal).not.toContain("AC-002");
  expect(output.specRuntime).toContain("AC-002");
  expect(output.specRuntime).toContain("AC-003");
  expect(output.summary).toEqual({ total: 3, formalCount: 1, runtimeCount: 1, humanCount: 1 });
});
```

## 分類 failure を修正する

`classify` が失敗した specification を分割して保存しないでください。重複 ID、空の statement、未知の layer、空の `verifyBy`、formal と runtime が同じ artifact を参照する状態は、どの検証が責任を持つかを曖昧にします。同じ要件を二つの方法で確認したい場合も、formal 側には Lean namespace のような formal artifact、runtime 側には test path のような runtime artifact を別々に指定し、独立した item にします。

`specFormal` には formal item だけが入り、`specRuntime` には runtime と human item が入ります。`humanCount` は人手 review の件数であり、runtime document に含まれるからといって自動 test になるわけではありません。`issueRef` は両方の output に残り、item の順序は input の順序を保ちます。

## 保存と review を分ける

生成した specification は source control で管理します。元の acceptance criteria を変更したら classify と split を再実行し、formal と runtime のどちらに変更が入ったかを review します。書き込みが必要なアプリケーションでは、検証成功後に `writeFile("docs/spec/signup/specFormal.md", output.specFormal)` のように path を明示してください。directory 作成、差分確認、git 操作は API の外側に置きます。

formal item は formal toolchain、runtime item は対応する test runner、human item は `verifyBy` に指定した review checkpoint で、それぞれ完了を確認します。`report.ok` は割当てが妥当であることだけを表し、実装が正しいことの証明ではありません。

## 実行する

```bash
pnpm exec vitest run tests/kaname-split.test.ts
```
