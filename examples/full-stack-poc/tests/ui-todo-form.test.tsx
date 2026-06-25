// Layer: UI component (jsdom + @kiwa-test/ui)
/// <reference types="vitest/globals" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupComponentEnv, type UiTestEnv } from '@kiwa-test/ui';
import { TodoForm } from '../src/ui.js';

const envs: UiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('TodoForm (jsdom render mode)', () => {
  it('mounts with empty input', async () => {
    const env = await setupComponentEnv({
      mode: 'render',
      ui: <TodoForm onSubmit={() => undefined} />,
    });
    envs.push(env);
    if (env.kind !== 'render') throw new Error('expected render');
    const input = env.screen.getByLabelText('title') as HTMLInputElement;
    expect(input.value).toBe('');
  });
});

describe('TodoForm (jsdom interaction mode)', () => {
  it('submits trimmed title via onSubmit', async () => {
    const onSubmit = vi.fn();
    const env = await setupComponentEnv({
      mode: 'interaction',
      ui: <TodoForm onSubmit={onSubmit} />,
    });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction');
    await env.user.type(env.screen.getByLabelText('title'), '  walk the dog  ');
    await env.user.click(env.screen.getByRole('button', { name: 'add' }));
    expect(onSubmit).toHaveBeenCalledWith('walk the dog');
  });

  it('shows error when empty submission attempted', async () => {
    const onSubmit = vi.fn();
    const env = await setupComponentEnv({
      mode: 'interaction',
      ui: <TodoForm onSubmit={onSubmit} />,
    });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction');
    await env.user.click(env.screen.getByRole('button', { name: 'add' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(env.screen.getByRole('status').textContent).toBe('title required');
  });
});
