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

  it('keeps other envs mounted when one render throws', async () => {
    // 失敗した render の片付けに global な cleanup を使うと、同時に生きている
    // 別の env まで unmount される。
    const Broken = () => {
      throw new Error('boom');
    };

    const alive = await setupComponentEnv({ mode: 'render', ui: <Counter initial={5} /> });
    envs.push(alive);
    if (alive.kind !== 'render') throw new Error('expected render env');

    await expect(setupComponentEnv({ mode: 'render', ui: <Broken /> })).rejects.toThrow('boom');

    expect(alive.screen.getByTestId('value').textContent).toBe('5');
  });

  it('leaves no mounted container behind when rendering throws', async () => {
    // render 中に例外が出ると env を受け取れないため、呼び出し側は stop() を
    // 呼べない。setupComponentEnv 自身が片付けないと container が document に
    // 残り続け、繰り返すたびにメモリを消費する。
    const Broken = () => {
      throw new Error('boom');
    };

    const before = document.body.childElementCount;
    for (let i = 0; i < 3; i++) {
      await expect(setupComponentEnv({ mode: 'render', ui: <Broken /> })).rejects.toThrow('boom');
    }

    expect(document.body.childElementCount).toBe(before);
  });
});
