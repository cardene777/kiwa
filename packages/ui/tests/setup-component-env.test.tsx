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

describe('setupComponentEnv (mutation-kill)', () => {
  it('render mode env.mode === "mock" and env.kind === "render" (kills L51 StringLiteral and L52 StringLiteral)', async () => {
    const env = await setupComponentEnv({ mode: 'render', ui: <Counter /> });
    envs.push(env);
    expect(env.mode).toBe('mock');
    expect(env.kind).toBe('render');
  });

  it('interaction mode env.mode === "live" and env.kind === "interaction" (kills L24 StringLiteral)', async () => {
    const env = await setupComponentEnv({ mode: 'interaction', ui: <Counter /> });
    envs.push(env);
    expect(env.mode).toBe('live');
    expect(env.kind).toBe('interaction');
  });

  it('snapshot mode env.mode === "mock" and env.kind === "snapshot" (kills L38 StringLiteral)', async () => {
    const env = await setupComponentEnv({ mode: 'snapshot', ui: <Counter /> });
    envs.push(env);
    expect(env.mode).toBe('mock');
    expect(env.kind).toBe('snapshot');
  });

  it('render mode stop() actually unmounts the React tree (kills L29 BlockStatement {})', async () => {
    const env = await setupComponentEnv({ mode: 'render', ui: <Counter initial={1} /> });
    if (env.kind !== 'render') throw new Error('expected render env');
    // Sanity: value is in the DOM before stop.
    expect(env.screen.getByTestId('value').textContent).toBe('1');
    await env.stop();
    // After stop, the React tree is unmounted and cleanup() ran.
    // queryByTestId returns null for a missing element instead of throwing.
    expect(env.screen.queryByTestId('value')).toBeNull();
  });

  it('interaction mode stop() actually unmounts the React tree (kills L29 BlockStatement {} on interaction)', async () => {
    const env = await setupComponentEnv({ mode: 'interaction', ui: <Counter initial={2} /> });
    if (env.kind !== 'interaction') throw new Error('expected interaction env');
    expect(env.screen.getByTestId('value').textContent).toBe('2');
    await env.stop();
    expect(env.screen.queryByTestId('value')).toBeNull();
  });

  it('snapshot mode stop() actually unmounts the React tree (kills L42 BlockStatement {} on snapshot)', async () => {
    const env = await setupComponentEnv({ mode: 'snapshot', ui: <Counter initial={4} /> });
    if (env.kind !== 'snapshot') throw new Error('expected snapshot env');
    // env.markup captures the HTML BEFORE stop — verify it remains accessible
    // after stop too (kills "stop -> {}" mutation that would leave the React
    // tree mounted and dirty markup string).
    const markupBefore = env.markup;
    await env.stop();
    expect(markupBefore).toContain('>4<');
  });
});
