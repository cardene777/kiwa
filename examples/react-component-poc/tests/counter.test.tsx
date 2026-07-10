import { afterEach, describe, expect, it } from 'vitest';
import { setupComponentEnv, type UiTestEnv } from '@kiwa-lab/ui';
import { Counter } from '../src/counter.js';

const envs: UiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('Counter (render mode)', () => {
  it('T-UI-001 初期 render: initial=3 で value が "3"', async () => {
    const env = await setupComponentEnv({ mode: 'render', ui: <Counter initial={3} /> });
    envs.push(env);
    if (env.kind !== 'render') throw new Error('expected render');
    expect(env.screen.getByTestId('value').textContent).toBe('3');
  });

  it('T-UI-002 step 反映: initial=0 step=5 で value が "0"', async () => {
    const env = await setupComponentEnv({
      mode: 'render',
      ui: <Counter initial={0} step={5} />,
    });
    envs.push(env);
    if (env.kind !== 'render') throw new Error('expected render');
    expect(env.screen.getByTestId('value').textContent).toBe('0');
  });
});

describe('Counter (interaction mode)', () => {
  it('T-UI-003 + クリックで value が "1"', async () => {
    const env = await setupComponentEnv({ mode: 'interaction', ui: <Counter /> });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction');
    await env.user.click(env.screen.getByRole('button', { name: 'increment' }));
    expect(env.screen.getByTestId('value').textContent).toBe('1');
  });

  it('T-UI-004 連続クリック × 3 で value が "3"', async () => {
    const env = await setupComponentEnv({ mode: 'interaction', ui: <Counter /> });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction');
    const incBtn = env.screen.getByRole('button', { name: 'increment' });
    await env.user.click(incBtn);
    await env.user.click(incBtn);
    await env.user.click(incBtn);
    expect(env.screen.getByTestId('value').textContent).toBe('3');
  });

  it('T-UI-005 reset で initial に戻る', async () => {
    const env = await setupComponentEnv({ mode: 'interaction', ui: <Counter initial={5} /> });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction');
    const incBtn = env.screen.getByRole('button', { name: 'increment' });
    await env.user.click(incBtn);
    await env.user.click(incBtn);
    await env.user.click(incBtn);
    expect(env.screen.getByTestId('value').textContent).toBe('8');
    await env.user.click(env.screen.getByRole('button', { name: 'reset' }));
    expect(env.screen.getByTestId('value').textContent).toBe('5');
  });

  it('T-UI-006 max 到達で + ボタンが disabled になり status が表示される', async () => {
    const env = await setupComponentEnv({ mode: 'interaction', ui: <Counter initial={0} max={2} /> });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction');
    const incBtn = env.screen.getByRole('button', { name: 'increment' }) as HTMLButtonElement;
    await env.user.click(incBtn);
    await env.user.click(incBtn);
    expect(incBtn.disabled).toBe(true);
    expect(env.screen.getByRole('status').textContent).toBe('max reached');
  });
});

describe('Counter (snapshot mode)', () => {
  it('T-UI-007 markup に value + ボタン群が含まれる', async () => {
    const env = await setupComponentEnv({ mode: 'snapshot', ui: <Counter initial={7} /> });
    envs.push(env);
    if (env.kind !== 'snapshot') throw new Error('expected snapshot');
    expect(env.markup).toContain('data-testid="value"');
    expect(env.markup).toContain('>7<');
    expect(env.markup).toContain('aria-label="increment"');
    expect(env.markup).toContain('aria-label="reset"');
  });
});
