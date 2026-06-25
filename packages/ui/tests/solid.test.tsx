/// <reference types="vitest/globals" />
import { createSignal, createComponent } from 'solid-js';
import { afterEach, describe, expect, it } from 'vitest';
import { setupSolidComponentEnv, type SolidTestEnvUi } from '../src/index.js';

const envs: SolidTestEnvUi[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

/**
 * Build the counter without JSX so tsc-based test pipelines don't require a
 * Solid-specific JSX transform. Mirrors the spirit of tests/vue.test.ts.
 */
function SolidCounter(props: { initial?: number }) {
  const [count, setCount] = createSignal(props.initial ?? 0);
  const div = document.createElement('div');
  const span = document.createElement('span');
  span.setAttribute('data-testid', 'value');
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', 'increment');
  button.textContent = '+';
  button.addEventListener('click', () => setCount(count() + 1));
  div.appendChild(span);
  div.appendChild(button);
  const sync = () => {
    span.textContent = String(count());
  };
  sync();
  // Reactive update on each click.
  const originalAdd = button.addEventListener.bind(button);
  void originalAdd;
  button.addEventListener('click', sync);
  return div;
}

describe('setupSolidComponentEnv (render)', () => {
  it('mounts a SolidJS component and exposes markup', async () => {
    const env = await setupSolidComponentEnv({
      mode: 'render',
      component: () => createComponent(SolidCounter, { initial: 3 }),
    });
    envs.push(env);
    expect(env.kind).toBe('solid');
    expect(env.markup).toContain('data-testid="value"');
    expect(env.result.getByTestId('value').textContent).toBe('3');
  });
});

describe('setupSolidComponentEnv (interaction)', () => {
  it('drives a real click and updates reactive state', async () => {
    const env = await setupSolidComponentEnv({
      mode: 'interaction',
      component: () => createComponent(SolidCounter, {}),
    });
    envs.push(env);
    const button = env.result.container.querySelector('button')!;
    button.click();
    button.click();
    expect(env.result.getByTestId('value').textContent).toBe('2');
  });
});
