# @kiwa-lab/core: Parse your first specification

[日本語](/libraries/foundation/core/quickstart)

In this tutorial, you convert a kiwa nine-column specification table into a `SpecDoc` and extract test-case information. When you finish, you can read Markdown and use each case's `id`, `mode`, and `route`.

## Prerequisites

In a project using Node.js 20 or later, add the package as a development dependency.

```bash
pnpm add -D @kiwa-lab/core
```

## Create a specification

`parseSpec()` parses `- module:` / `- layer:` metadata and the first table. The table needs at least the `id`, `observation`, `given`, `when`, and `then` columns.

```ts
import { parseSpec } from "@kiwa-lab/core";

const markdown = `
- module: wallet-connect
- layer: e2e

| id | observation | given | when | then | priority | automation | mode | route |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E2E-001 | ウォレットを接続できる | 未接続の利用者 | 接続を選ぶ | アカウントを表示する | P0 | yes | live | /connect |
`;

const doc = parseSpec(markdown);

console.log(doc.module); // "wallet-connect"
console.log(doc.layer); // "e2e"
console.log(doc.cases[0]?.id); // "E2E-001"
console.log(doc.cases[0]?.route); // "/connect"
console.log(doc.warnings); // []
```

## Read from a file

In a real test, pass the file contents to the same function.

```ts
import { readFileSync } from "node:fs";
import { parseSpec } from "@kiwa-lab/core";

const markdown = readFileSync("tests/spec/wallet.e2e.md", "utf8");
const doc = parseSpec(markdown);

for (const testCase of doc.cases) {
  console.log(testCase.id, testCase.observation, testCase.mode);
}
```

## Check warnings

An invalid `layer` or `mode`, or missing required columns, is added to `warnings`. Before generating or running tests, decide in the caller whether warnings should fail the run.

```ts
if (doc.warnings.length > 0) {
  throw new Error(doc.warnings.join("\n"));
}
```

For an unknown `mode`, the case has no `mode` and a warning is added. A `priority` other than `P0` through `P3` becomes `P2`; an `automation` value other than `yes` or `manual` becomes `no`.

Next, see [reuse test resources](./guides/reuse-expensive-resources) or the list of types and APIs in the [reference](./reference).
