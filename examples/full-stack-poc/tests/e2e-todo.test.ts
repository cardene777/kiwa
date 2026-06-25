// Layer: end-to-end (real Chromium via @kiwa-test/e2e)
import { afterEach, describe, expect, it } from 'vitest';
import { setupE2eEnv, type E2eTestEnv } from '@kiwa-test/e2e';
import { STATIC_TODO_HTML } from '../src/static-app.js';

const envs: E2eTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('Todo PoC (real Chromium)', () => {
  it('renders the static app', async () => {
    const env = await setupE2eEnv({ staticHtml: STATIC_TODO_HTML });
    envs.push(env);
    const title = await env.page.getByTestId('title').textContent();
    expect(title).toBe('Todo PoC');
  });

  it('adds an item via real form submit', async () => {
    const env = await setupE2eEnv({ staticHtml: STATIC_TODO_HTML });
    envs.push(env);
    await env.page.fill('#input', 'walk the dog');
    await env.page.click('button[type="submit"]');
    const text = await env.page.getByTestId('item').textContent();
    expect(text).toBe('walk the dog');
  });
});
