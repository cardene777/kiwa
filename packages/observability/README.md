# @kiwa-test/observability

Observability adapter for kiwa — close the loop between Layer 1 spec, Layer 2 test code, and runtime results.

## Overview

`@kiwa-test/observability` provides the bottom of the design × implementation × observability loop:

- `collectRunHistory({ history, records, maxPerTest })` — append vitest-style runs to a history, with FIFO eviction.
- `fromVitestJson(report, { runId })` — convert a vitest JSON reporter blob into `TestRunRecord[]`, extracting `T-XXX-NNN` IDs from the test names.
- `detectFlaky({ history, minRuns, threshold })` — find tests with mixed pass/fail outcomes across runs.
- `analyzeSpecCoverage({ specMarkdown, testCode })` — compare spec TC IDs with `it('T-XXX-NNN ...')` strings in test code and surface gaps both ways.
- `renderDashboard({ history, flaky, gaps })` — print a markdown dashboard suitable for PR comments, README badges, or `decisions/` archives.

## Install

```bash
pnpm add -D @kiwa-test/observability @kiwa-test/spec vitest
```

## Quick start

```ts
import {
  analyzeSpecCoverage,
  collectRunHistory,
  detectFlaky,
  fromVitestJson,
  renderDashboard,
} from "@kiwa-test/observability";
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

## License

MIT
