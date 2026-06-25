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

  it('T-E2E-006 error message contains both "app" and "staticHtml"', async () => {
    await expect(setupE2eEnv()).rejects.toThrow(/app/);
    await expect(setupE2eEnv()).rejects.toThrow(/staticHtml/);
  });
});

describe('setupE2eEnv (browser / headless options)', () => {
  it('T-E2E-007 default browser=chromium (mutation で "" 化されない)', async () => {
    const env = await setupE2eEnv({ staticHtml: HTML_TODO_APP });
    envs.push(env);
    expect(env.browser).toBe('chromium');
  });

  it('T-E2E-008 default mode=live (mutation で "" 化されない)', async () => {
    const env = await setupE2eEnv({ staticHtml: HTML_TODO_APP });
    envs.push(env);
    expect(env.mode).toBe('live');
  });

  it('T-E2E-009 baseUrl format - http://127.0.0.1:<port> (StringLiteral mutation 防御)', async () => {
    const env = await setupE2eEnv({ staticHtml: HTML_TODO_APP });
    envs.push(env);
    expect(env.baseUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  });

  it('T-E2E-010 initialPath - default "/" で root にナビ', async () => {
    const env = await setupE2eEnv({ staticHtml: HTML_TODO_APP });
    envs.push(env);
    expect(env.page.url()).toBe(`${env.baseUrl}/`);
  });

  it('T-E2E-011 initialPath - relative path "foo" prefix 補正 → "/foo"', async () => {
    const env = await setupE2eEnv({ staticHtml: HTML_TODO_APP, initialPath: 'foo' });
    envs.push(env);
    expect(env.page.url()).toBe(`${env.baseUrl}/foo`);
  });

  it('T-E2E-012 initialPath - explicit "/bar" は そのまま nav', async () => {
    const env = await setupE2eEnv({ staticHtml: HTML_TODO_APP, initialPath: '/bar' });
    envs.push(env);
    expect(env.page.url()).toBe(`${env.baseUrl}/bar`);
  });

  it('T-E2E-013 staticHtml empty string - rejects 不要 (空 HTML も valid Response)', async () => {
    const env = await setupE2eEnv({ staticHtml: '' });
    envs.push(env);
    expect(env.baseUrl).toMatch(/^http/);
  });

  it('T-E2E-014 stop() - 全 resource cleanup (例外なく resolve)', async () => {
    const env = await setupE2eEnv({ staticHtml: HTML_TODO_APP });
    await expect(env.stop()).resolves.toBeUndefined();
  });

  it('T-E2E-015 stop() - baseUrl 後に server が応答しなくなる (close 確認)', async () => {
    const env = await setupE2eEnv({ staticHtml: HTML_TODO_APP });
    const baseUrl = env.baseUrl;
    await env.stop();
    await expect(fetch(baseUrl).then((r) => r.text())).rejects.toBeTruthy();
  });

  it('T-E2E-016 staticHtml - response content-type が text/html を含む (content-type header 確認)', async () => {
    const env = await setupE2eEnv({ staticHtml: '<p>hi</p>' });
    envs.push(env);
    const res = await fetch(env.baseUrl);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('T-E2E-017 staticHtml - charset=utf-8 (StringLiteral content-type 防御)', async () => {
    const env = await setupE2eEnv({ staticHtml: '<p>x</p>' });
    envs.push(env);
    const res = await fetch(env.baseUrl);
    expect(res.headers.get('content-type')).toContain('charset=utf-8');
  });

  it('T-E2E-018 staticHtml - status 200 (boundary status code)', async () => {
    const env = await setupE2eEnv({ staticHtml: '<h1>x</h1>' });
    envs.push(env);
    const res = await fetch(env.baseUrl);
    expect(res.status).toBe(200);
  });

  it('T-E2E-019 initialPath default - "/" 補正後の URL に末尾 "/" あり', async () => {
    const env = await setupE2eEnv({ staticHtml: HTML_TODO_APP });
    envs.push(env);
    expect(env.page.url()).toMatch(/\/$/);
  });

  it('T-E2E-020 initialPath absolute URL - "http://..." はそのまま nav (startsWith http branch)', async () => {
    const env1 = await setupE2eEnv({ staticHtml: HTML_TODO_APP });
    envs.push(env1);
    const absolute = `${env1.baseUrl}/explicit`;
    const env2 = await setupE2eEnv({ staticHtml: HTML_TODO_APP, initialPath: absolute });
    envs.push(env2);
    expect(env2.page.url()).toBe(absolute);
  });

  it('T-E2E-021 staticHtml body content propagates to page', async () => {
    const html = '<!doctype html><html><body><h1 data-testid="custom-title">hello-static</h1></body></html>';
    const env = await setupE2eEnv({ staticHtml: html });
    envs.push(env);
    const title = await env.page.getByTestId('custom-title').textContent();
    expect(title).toBe('hello-static');
  });
});
