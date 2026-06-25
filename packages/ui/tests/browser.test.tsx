import { afterEach, describe, expect, it } from 'vitest';
import { setupBrowserComponentEnv, type BrowserTestEnvUi } from '../src/index.js';

const envs: BrowserTestEnvUi[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

function Greeting({ name }: { name: string }): JSX.Element {
  return (
    <div>
      <h1 data-testid="title">Hello, {name}!</h1>
      <p>Welcome to kiwa ui browser mode.</p>
    </div>
  );
}

describe('setupBrowserComponentEnv (chromium, headless)', () => {
  it('renders React markup into a real Chromium page and queries it', async () => {
    const env = await setupBrowserComponentEnv({ ui: <Greeting name="kiwa" /> });
    envs.push(env);
    expect(env.kind).toBe('browser');
    expect(env.browser).toBe('chromium');
    const title = await env.page.getByTestId('title').textContent();
    expect(title).toContain('Hello, kiwa!');
  });

  it('exposes page.content() for whole-document snapshots', async () => {
    const env = await setupBrowserComponentEnv({ ui: <Greeting name="world" /> });
    envs.push(env);
    const html = await env.page.content();
    expect(html).toContain('Hello, world!');
    expect(html).toContain('id="kiwa-root"');
  });

  it('runs in-page JavaScript via page.evaluate', async () => {
    const env = await setupBrowserComponentEnv({ ui: <Greeting name="js" /> });
    envs.push(env);
    const headingText = await env.page.evaluate(() => document.querySelector('h1')?.textContent ?? '');
    expect(headingText).toContain('Hello, js!');
  });
});
