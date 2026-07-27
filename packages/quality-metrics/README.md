# @kiwa-lab/observability

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package closes the loop with coverage / flaky detection / dashboard)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package powers the coverage / review step shown in the video. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Observability adapter for kiwa — close the loop between Layer 1 spec, Layer 2 test code, and runtime results.

## Overview

`@kiwa-lab/observability` provides the bottom of the design × implementation × observability loop:

- `collectRunHistory({ history, records, maxPerTest })` — append vitest-style runs to a history, with FIFO eviction.
- `fromVitestJson(report, { runId })` — convert a vitest JSON reporter blob into `TestRunRecord[]`, extracting `T-XXX-NNN` IDs from the test names.
- `detectFlaky({ history, minRuns, threshold })` — find tests with mixed pass/fail outcomes across runs.
- `analyzeSpecCoverage({ specMarkdown, testCode })` — compare spec TC IDs with `it('T-XXX-NNN ...')` strings in test code and surface gaps both ways.
- `renderDashboard({ history, flaky, gaps })` — print a markdown dashboard suitable for PR comments, README badges, or `decisions/` archives.

## Install

```bash
pnpm add -D @kiwa-lab/observability @kiwa-lab/core vitest
```

## Quick start

```ts
import {
  analyzeSpecCoverage,
  collectRunHistory,
  detectFlaky,
  fromVitestJson,
  renderDashboard,
} from "@kiwa-lab/observability";
import { readFile } from "node:fs/promises";

const vitestReport = JSON.parse(await readFile("vitest-results.json", "utf8"));
const records = fromVitestJson(vitestReport, { runId: "ci-42" });
const history = collectRunHistory({ records, maxPerTest: 20 });

const flaky = detectFlaky({ history, minRuns: 3, threshold: 0.1 });

const specMd = await readFile("tests/spec/integration/test-spec-items.api.md", "utf8");
const testCode = await readFile("tests/items.test.ts", "utf8");
const gaps = [analyzeSpecCoverage({ specMarkdown: specMd, testCode })];

const dashboard = renderDashboard({ history, flaky, gaps });
console.log(dashboard);
```

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/quality/quality-metrics/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/quality/quality-metrics/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/quality/quality-metrics/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/quality/quality-metrics/reference)

編集元は [docs/libraries/quality/quality-metrics](../../docs/libraries/quality/quality-metrics/) です。
<!-- kiwa-docs:end -->

## License

MIT
