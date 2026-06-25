import { afterEach, describe, expect, it } from 'vitest';
import { setupE2eEnv, type E2eTestEnv } from '../src/index.js';

const envs: E2eTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

const HTML_TODO_APP = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Todo</title></head>
  <body>
    <h1 data-testid="title">Todo</h1>
    <ul id="list"></ul>
    <form id="form">
      <input id="input" name="title" />
      <button type="submit">add</button>
    </form>
    <script>
      const list = document.getElementById('list');
      const form = document.getElementById('form');
      const input = document.getElementById('input');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = input.value.trim();
        if (!value) return;
        const li = document.createElement('li');
        li.setAttribute('data-testid', 'item');
        li.textContent = value;
        list.appendChild(li);
        input.value = '';
      });
    </script>
  </body>
</html>`;

describe('setupE2eEnv (Chromium, static html)', () => {
  it('loads a static page and queries DOM via Playwright', async () => {
    const env = await setupE2eEnv({ staticHtml: HTML_TODO_APP });
    envs.push(env);
    expect(env.baseUrl).toMatch(/^http:\/\/127\.0\.0\.1:/);
    expect(env.browser).toBe('chromium');
    const title = await env.page.getByTestId('title').textContent();
    expect(title).toBe('Todo');
  });

  it('drives a real form submission and asserts new DOM state', async () => {
    const env = await setupE2eEnv({ staticHtml: HTML_TODO_APP });
    envs.push(env);
    await env.page.fill('#input', 'walk the dog');
    await env.page.click('button[type="submit"]');
    const item = env.page.getByTestId('item');
    expect(await item.textContent()).toBe('walk the dog');
  });
});

describe('setupE2eEnv (Chromium, fetch app)', () => {
  it('mounts a fetch handler as the SUT', async () => {
    const env = await setupE2eEnv({
      app: {
        kind: 'fetch',
        handler: async (req) => {
          const url = new URL(req.url);
          if (url.pathname === '/') {
            return new Response('<h1 data-testid="title">from fetch app</h1>', {
              status: 200,
              headers: { 'content-type': 'text/html; charset=utf-8' },
            });
          }
          return new Response('not found', { status: 404 });
        },
      },
    });
    envs.push(env);
    const title = await env.page.getByTestId('title').textContent();
    expect(title).toBe('from fetch app');
  });
});

describe('setupE2eEnv (errors)', () => {
  it('rejects when neither app nor staticHtml is provided', async () => {
    await expect(setupE2eEnv()).rejects.toThrow(/provide either/);
  });
});
