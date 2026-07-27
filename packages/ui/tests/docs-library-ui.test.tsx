/// <reference types="vitest/globals" />
import { useState } from 'react';
import { afterEach, expect, it } from 'vitest';
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
  return <button data-testid="count" onClick={() => setCount(value => value + 1)}>{count}</button>;
}

it('documents React render, interaction, and snapshot modes', async () => {
  const render = await setupComponentEnv({ mode: 'render', ui: <Counter initial={3} /> });
  envs.push(render);
  if (render.kind !== 'render') throw new Error('expected render');
  expect(render.result.container.querySelector('[data-testid=count]')?.textContent).toBe('3');

  const interaction = await setupComponentEnv({ mode: 'interaction', ui: <Counter /> });
  envs.push(interaction);
  if (interaction.kind !== 'interaction') throw new Error('expected interaction');
  const button = interaction.result.container.querySelector('[data-testid=count]');
  if (!(button instanceof HTMLButtonElement)) throw new Error('count button is required');
  await interaction.user.click(button);
  expect(button.textContent).toBe('1');

  const snapshot = await setupComponentEnv({ mode: 'snapshot', ui: <Counter initial={7} /> });
  envs.push(snapshot);
  if (snapshot.kind !== 'snapshot') throw new Error('expected snapshot');
  expect(snapshot.markup).toContain('data-testid="count"');
  expect(snapshot.markup).toContain('>7<');
});
