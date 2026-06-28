# @kiwa-test/e2e

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the e2e surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the e2e surface shown in the video. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

End-to-end test adapter for kiwa — Playwright + built-in HTTP serve helper.

## Overview

`@kiwa-test/e2e` exposes a single `setupE2eEnv` helper that:

- spins up a real HTTP server (your fetch app, Node handler, or a static HTML string),
- launches Playwright Chromium (or Firefox / WebKit) in headless mode,
- navigates to the initial path, and
- returns a thin `BrowserPageHandle` you can drive from vitest with `getByTestId`, `fill`, `click`, `evaluate`, etc.

Unlike `@kiwa-test/dapp` (which is anchored on dApp + anvil), `@kiwa-test/e2e` targets generic web apps.

## Install

```bash
pnpm add -D @kiwa-test/e2e @kiwa-test/core @playwright/test vitest
pnpm exec playwright install chromium
```

## Quick start

```ts
import { afterEach, describe, expect, it } from "vitest";
import { setupE2eEnv, type E2eTestEnv } from "@kiwa-test/e2e";

const envs: E2eTestEnv[] = [];
afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

it("adds an item via real form submit", async () => {
  const env = await setupE2eEnv({
    staticHtml: "<form id='f'><input id='i' /></form>",
  });
  envs.push(env);
  await env.page.fill("#i", "walk the dog");
  await env.page.click("button[type='submit']");
});
```

Provide `{ app: { kind: 'fetch', handler } }` to mount a real fetch handler instead of static HTML.

## License

MIT
