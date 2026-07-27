# @kiwa-lab/core 最初の仕様解析

このチュートリアルでは、仕様 Markdown を `SpecDoc` に変換し、テストケースと解析警告を取り出します。`parseSpec` は仕様を実行したり生成したりせず、決められたメタデータと最初の Markdown 表を構造化する関数です。

## 前提条件

Node.js 20 以上のプロジェクトで、パッケージと Vitest を開発依存として追加します。

```bash
pnpm add -D @kiwa-lab/core vitest
```

## 仕様を解析して warning を失敗にする

メタデータは `- module: 値` と `- layer: 値` の形で書きます。表には `id`、`observation`、`given`、`when`、`then` の五つが必須です。priority、automation、mode、route は任意です。

```ts
import { expect, test } from 'vitest';
import { parseSpec } from '@kiwa-lab/core';

test('converts a specification table and fails on parser warnings', () => {
  const markdown = `
- module: wallet-connect
- layer: e2e

| id | observation | given | when | then | priority | automation | mode | route |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E2E-001 | ウォレットを接続できる | 未接続の利用者 | 接続を選ぶ | アカウントを表示する | P0 | yes | live | /connect |
`;

  const doc = parseSpec(markdown);

  expect(doc.module).toBe('wallet-connect');
  expect(doc.layer).toBe('e2e');
  expect(doc.cases[0]).toMatchObject({
    id: 'E2E-001',
    mode: 'live',
    route: '/connect',
    priority: 'P0',
    automation: 'yes',
  });
  expect(doc.warnings).toEqual([]);

  const broken = parseSpec('| id | observation |\n| --- | --- |\n| E2E-002 | missing columns |');
  expect(broken.cases).toEqual([]);
  expect(broken.warnings).toContain('required columns missing: given, when, then');
});
```

この例を `tests/wallet-connect.spec.test.ts` に保存し、次の command を実行してください。

```bash
pnpm exec vitest run tests/wallet-connect.spec.test.ts
```

見出し、余分な列、二つ目以降の表は解析対象ではありません。仕様表は必要な情報を一つ目の表に置いてください。実際の file を読む場合は、`readFileSync` などで取得した文字列を同じ `parseSpec` に渡します。CI では `doc.warnings` を空であることまで assertion し、仕様の列不足や未知の mode を見逃さないようにします。

`module` option を渡すと Markdown 内の module よりその値が優先されます。layer の既定値は `unit` です。未知の layer は warning を追加し、選ばれている layer を変更しません。

## 正規化の規則

`priority` は `P0` から `P3` のみをそのまま採用し、それ以外や空欄は `P2` になります。`automation` は `yes` と `manual` 以外を `no` にします。mode は `mock`、`live`、`hybrid` だけが有効で、未知の値は mode を設定せず warnings に残します。

次は [資源プールを使う](./how-to) か、型と API の一覧である [リファレンス](./reference) を参照してください。
<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の code を test に書き、入力から結果までの境界を直接確認してください。skill を導入して仕様から test を組み立てる場合は、[kiwa の skill を使う](../../../guides/skills) の手順に従い、対象が unit、API、UI、e2e のどれかに応じて layer を選びます。専用 skill がないことは、実サービスの挙動を推測する生成物より、この library の公開 API と実装した test を先に確認するためです。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

仕様を unit test に変換する場合は、次を実行します。

```text
/kiwa:kiwa-design --layer unit --module wallet-connect
/kiwa:kiwa-vitest --module wallet-connect
```

出力先を変更していなければ、生成された file だけを実行します。

```bash
pnpm exec vitest run tests/spec/wallet-connect.test.ts
```
