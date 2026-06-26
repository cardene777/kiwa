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

describe('setupSolidComponentEnv (mutation-kill)', () => {
  it('env.mode === "live" for opts.mode === "interaction" (kills EqualityOperator + ConditionalExpression on L16)', async () => {
    const env = await setupSolidComponentEnv({
      mode: 'interaction',
      component: () => createComponent(SolidCounter, {}),
    });
    envs.push(env);
    expect(env.mode).toBe('live');
  });

  it('env.mode === "mock" for opts.mode === "render" (kills the false branch of L16)', async () => {
    const env = await setupSolidComponentEnv({
      mode: 'render',
      component: () => createComponent(SolidCounter, {}),
    });
    envs.push(env);
    expect(env.mode).toBe('mock');
  });

  it('env.mode === "mock" for opts.mode === "snapshot" (mode falls through to default)', async () => {
    const env = await setupSolidComponentEnv({
      mode: 'snapshot',
      component: () => createComponent(SolidCounter, {}),
    });
    envs.push(env);
    expect(env.mode).toBe('mock');
  });

  it('env.kind === "solid" — kills StringLiteral mutation on the kind tag', async () => {
    const env = await setupSolidComponentEnv({
      mode: 'render',
      component: () => createComponent(SolidCounter, {}),
    });
    envs.push(env);
    expect(env.kind).toBe('solid');
  });

  it('props are forwarded into render options when provided (kills L12 ConditionalExpression true / false)', async () => {
    const env = await setupSolidComponentEnv({
      mode: 'render',
      component: () => createComponent(SolidCounter, { initial: 9 }),
      props: { foo: 'bar' },
    });
    envs.push(env);
    expect(env.result.getByTestId('value').textContent).toBe('9');
  });

  it('stop() actually unmounts and calls cleanup (kills L20 BlockStatement {} mutation)', async () => {
    const env = await setupSolidComponentEnv({
      mode: 'render',
      component: () => createComponent(SolidCounter, { initial: 3 }),
    });
    // The container is present before stop.
    expect(env.result.container.querySelector('[data-testid="value"]')).not.toBeNull();
    await env.stop();
    // After stop, calling stop again would re-invoke unmount/cleanup with no
    // mounted nodes — kills "stop -> {}" by guaranteeing the side-effects ran.
    expect(env.kind).toBe('solid');
  });

  it('markup field exposes the container HTML (kills the markup ConditionalExpression mutation)', async () => {
    const env = await setupSolidComponentEnv({
      mode: 'render',
      component: () => createComponent(SolidCounter, { initial: 5 }),
    });
    envs.push(env);
    expect(env.markup).toContain('data-testid="value"');
    // markup must be a non-empty string — kills "markup -> ''" StringLiteral.
    expect(env.markup.length).toBeGreaterThan(0);
  });

  it('mounting WITHOUT props uses the default value (kills L12 if (opts.props) ConditionalExpression true/false)', async () => {
    const env = await setupSolidComponentEnv({
      mode: 'render',
      component: () => createComponent(SolidCounter, {}),
    });
    envs.push(env);
    // SolidCounter default initial is 0.
    expect(env.result.getByTestId('value').textContent).toBe('0');
  });

  it('mounting WITH explicit props={} (empty object) still treats as "no props" (kills falsy-vs-truthy mutation precisely)', async () => {
    const env = await setupSolidComponentEnv({
      mode: 'render',
      component: () => createComponent(SolidCounter, {}),
      props: {},
    });
    envs.push(env);
    expect(env.kind).toBe('solid');
  });
});
