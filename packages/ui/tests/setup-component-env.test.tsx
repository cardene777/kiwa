/// <reference types="vitest/globals" />
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { setupComponentEnv, type UiTestEnv } from '../src/index.js';

const envs: UiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

function Counter({ initial = 0 }: { initial?: number }): JSX.Element {
  const [count, setCount] = useState(initial);
  return (
    <div>
      <span data-testid="value">{count}</span>
      <button type="button" onClick={() => setCount(count + 1)}>
        inc
      </button>
    </div>
  );
}

describe('setupComponentEnv (render mode)', () => {
  it('renders a React tree and exposes screen queries', async () => {
    const env = await setupComponentEnv({ mode: 'render', ui: <Counter initial={3} /> });
    envs.push(env);
    if (env.kind !== 'render') throw new Error('expected render env');
    expect(env.screen.getByTestId('value').textContent).toBe('3');
  });

  it('honors initial props', async () => {
    const env = await setupComponentEnv({ mode: 'render', ui: <Counter initial={10} /> });
    envs.push(env);
    if (env.kind !== 'render') throw new Error('expected render env');
    expect(env.screen.getByTestId('value').textContent).toBe('10');
  });
});

describe('setupComponentEnv (interaction mode)', () => {
  it('drives state updates via userEvent', async () => {
    const env = await setupComponentEnv({ mode: 'interaction', ui: <Counter /> });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction env');
    await env.user.click(env.screen.getByText('inc'));
    await env.user.click(env.screen.getByText('inc'));
    expect(env.screen.getByTestId('value').textContent).toBe('2');
  });
});

describe('setupComponentEnv (snapshot mode)', () => {
  it('exposes serialized markup for inline / file snapshots', async () => {
    const env = await setupComponentEnv({ mode: 'snapshot', ui: <Counter initial={7} /> });
    envs.push(env);
    if (env.kind !== 'snapshot') throw new Error('expected snapshot env');
    expect(env.markup).toContain('data-testid="value"');
    expect(env.markup).toContain('>7<');
    expect(env.markup).toContain('>inc<');
  });
});

describe('setupComponentEnv (errors)', () => {
  it('rejects unknown modes', async () => {
    await expect(
      setupComponentEnv({
        mode: 'weird' as unknown as 'render',
        ui: <Counter />,
      }),
    ).rejects.toThrow(/unknown mode/);
  });
});
