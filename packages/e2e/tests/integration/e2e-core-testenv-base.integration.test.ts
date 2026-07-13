/**
 * integration test — `docs/concepts/test-taxonomy.md § integration` pattern。
 *
 * @kiwa-lab/e2e が @kiwa-lab/core の TestEnvBase interface に structurally 準拠する
 * E2eTestEnv を返すことを real import 経由で検証する。 core 側の interface contract を
 * e2e 側が破らないことを保証する経路。
 *
 * mock 混ぜず real dependency で回す = integration 契約 (SSOT 前提思想)。
 */
import type { TestEnvBase } from '@kiwa-lab/core';
import { describe, expect, it } from 'vitest';
import { setupE2eEnv } from '../../src/index.js';

describe('e2e × core integration — TestEnvBase interface conformance', () => {
  it('setupE2eEnv 戻り値が core の TestEnvBase interface に structurally 準拠', async () => {
    const env = await setupE2eEnv({
      staticHtml: '<!doctype html><title>e2e integration</title><body>ok</body>',
      headless: true,
    });

    // TestEnvBase = { mode: TMode; stop: () => Promise<void> }
    // structural typing check
    const envAsBase: TestEnvBase = env;
    expect(typeof envAsBase.mode).toBe('string');
    expect(typeof envAsBase.stop).toBe('function');

    // stop() が Promise<void> を返す = core 契約準拠
    const stopResult = envAsBase.stop();
    expect(stopResult).toBeInstanceOf(Promise);
    await stopResult;
  });

  it('e2e mode field は core TestMode の 1 値 (live)', async () => {
    const env = await setupE2eEnv({
      staticHtml: '<!doctype html><title>e2e integration 2</title>',
      headless: true,
    });

    // live 判定 (mock/live/stub の 3 値のいずれか、 e2e は browser 起動する live 経路)
    expect(env.mode).toBe('live');

    await env.stop();
  });

  it('複数 setupE2eEnv 呼出 = 各 stop() で独立解放できる (無 leak 契約)', async () => {
    const envA = await setupE2eEnv({
      staticHtml: '<!doctype html><title>A</title>',
      headless: true,
    });
    const envB = await setupE2eEnv({
      staticHtml: '<!doctype html><title>B</title>',
      headless: true,
    });

    // 異なる baseUrl (port 独立)
    expect(envA.baseUrl).not.toBe(envB.baseUrl);

    // stop 順序は独立
    await envA.stop();
    await envB.stop();
  });

  it('page.content() で staticHtml が反映される (Playwright 契約)', async () => {
    const env = await setupE2eEnv({
      staticHtml: '<!doctype html><title>e2e-title-test</title><body>hi</body>',
      headless: true,
    });

    const html = await env.page.content();
    expect(html).toContain('e2e-title-test');
    expect(html).toContain('hi');

    await env.stop();
  });

  it('page.evaluate() で DOM 要素取得 = staticHtml の body が反映される', async () => {
    const env = await setupE2eEnv({
      staticHtml: '<!doctype html><title>x</title><body><h1 id="header">Hello E2E</h1></body>',
      headless: true,
    });

    const text = await env.page.evaluate<string>(
      () => document.querySelector('#header')?.textContent ?? '',
    );
    expect(text).toBe('Hello E2E');

    await env.stop();
  });

  it('browser field で 選択した browserType 名を反映 (default chromium)', async () => {
    const env = await setupE2eEnv({
      staticHtml: '<!doctype html><title>b</title>',
      headless: true,
    });
    expect(env.browser).toBe('chromium');
    await env.stop();
  });

  it('baseUrl は http:// で始まる (real HTTP server 起動、 network 経由の real E2E)', async () => {
    const env = await setupE2eEnv({
      staticHtml: '<!doctype html><title>net</title>',
      headless: true,
    });
    expect(env.baseUrl).toMatch(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
    // ports は 0 (auto assign) or 明示、 いずれも 0 越え
    const port = Number(env.baseUrl.split(':').pop());
    expect(port).toBeGreaterThan(0);
    await env.stop();
  });
});
