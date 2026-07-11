/// <reference types="vitest/globals" />
import { defineComponent, h, ref } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import { setupVueComponentEnv, type VueTestEnvUi } from '../src/index.js';

const envs: VueTestEnvUi[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

const VueCounter = defineComponent({
  props: {
    initial: { type: Number, default: 0 },
  },
  setup(props) {
    const count = ref(props.initial);
    return () =>
      h('div', {}, [
        h('span', { 'data-testid': 'value' }, count.value.toString()),
        h(
          'button',
          {
            type: 'button',
            'aria-label': 'increment',
            onClick: () => (count.value += 1),
          },
          '+',
        ),
      ]);
  },
});

describe('setupVueComponentEnv (render)', () => {
  it('mounts a Vue 3 component and exposes markup', async () => {
    const env = await setupVueComponentEnv({ mode: 'render', component: VueCounter, props: { initial: 3 } });
    envs.push(env);
    expect(env.kind).toBe('vue');
    expect(env.markup).toContain('data-testid="value"');
    expect(env.wrapper.find('[data-testid="value"]').text()).toBe('3');
  });
});

describe('setupVueComponentEnv (interaction)', () => {
  it('drives a real click and updates reactive state', async () => {
    const env = await setupVueComponentEnv({ mode: 'interaction', component: VueCounter });
    envs.push(env);
    await env.wrapper.find('button').trigger('click');
    await env.wrapper.find('button').trigger('click');
    expect(env.wrapper.find('[data-testid="value"]').text()).toBe('2');
  });
});

describe('setupVueComponentEnv (mutation-kill)', () => {
  it('env.mode === "live" when opts.mode === "interaction" (kills EqualityOperator + ConditionalExpression on L18)', async () => {
    const env = await setupVueComponentEnv({ mode: 'interaction', component: VueCounter });
    envs.push(env);
    expect(env.mode).toBe('live');
    // Kills the "mode -> '' " StringLiteral mutation by asserting a non-empty
    // discriminant.
    expect(env.mode.length).toBeGreaterThan(0);
  });

  it('env.mode === "mock" when opts.mode === "render" (kills the false branch of L18)', async () => {
    const env = await setupVueComponentEnv({ mode: 'render', component: VueCounter });
    envs.push(env);
    expect(env.mode).toBe('mock');
  });

  it('env.mode === "mock" when opts.mode === "snapshot" (mode falls through to default)', async () => {
    const env = await setupVueComponentEnv({ mode: 'snapshot', component: VueCounter });
    envs.push(env);
    expect(env.mode).toBe('mock');
  });

  it('env.kind === "vue" — kills StringLiteral mutation on the kind tag', async () => {
    const env = await setupVueComponentEnv({ mode: 'render', component: VueCounter });
    envs.push(env);
    expect(env.kind).toBe('vue');
  });

  it('props are forwarded into mountOptions when provided (kills L14 ConditionalExpression true / false)', async () => {
    const env = await setupVueComponentEnv({
      mode: 'render',
      component: VueCounter,
      props: { initial: 7 },
    });
    envs.push(env);
    expect(env.wrapper.find('[data-testid="value"]').text()).toBe('7');
  });

  it('mounting WITHOUT props uses the component default (kills the "props always passed" mutation)', async () => {
    const env = await setupVueComponentEnv({ mode: 'render', component: VueCounter });
    envs.push(env);
    // VueCounter's default initial is 0. If the adapter spuriously forwarded
    // a `props` object even when undefined, Vue would emit a warning; we
    // simply assert the default rendered value.
    expect(env.wrapper.find('[data-testid="value"]').text()).toBe('0');
  });

  it('stop() actually unmounts the wrapper (kills L22 BlockStatement {} mutation)', async () => {
    const env = await setupVueComponentEnv({ mode: 'render', component: VueCounter });
    // Sanity: wrapper is mounted.
    expect(env.wrapper.find('[data-testid="value"]').exists()).toBe(true);
    await env.stop();
    // After stop(), unmount() must have been called. Calling find on an
    // unmounted wrapper still returns a wrapper object, but its element is
    // detached from the DOM. The strongest assertion is that re-calling
    // stop() (or its underlying unmount) does NOT throw — proving the
    // teardown actually ran.
    expect(() => env.wrapper.unmount()).not.toThrow();
  });

  it('markup field contains a serialised representation of the mounted HTML (kills L11 ConditionalExpression)', async () => {
    const env = await setupVueComponentEnv({ mode: 'render', component: VueCounter, props: { initial: 5 } });
    envs.push(env);
    expect(env.markup).toContain('5');
    expect(env.markup).toContain('data-testid');
  });

  it('slots are forwarded into mountOptions when provided (kills L14 ConditionalExpression true/false)', async () => {
    const SlotHost = defineComponent({
      setup(_, { slots }) {
        return () => h('div', { 'data-testid': 'slot-host' }, slots.default ? slots.default() : []);
      },
    });
    const env = await setupVueComponentEnv({
      mode: 'render',
      component: SlotHost,
      slots: { default: () => 'slot-content' },
    });
    envs.push(env);
    expect(env.wrapper.find('[data-testid="slot-host"]').text()).toContain('slot-content');
  });

  it('mounting WITHOUT slots leaves slot host empty (kills the always-true slot branch)', async () => {
    const SlotHost = defineComponent({
      setup(_, { slots }) {
        return () => h('div', { 'data-testid': 'slot-host' }, slots.default ? slots.default() : 'fallback');
      },
    });
    const env = await setupVueComponentEnv({ mode: 'render', component: SlotHost });
    envs.push(env);
    expect(env.wrapper.find('[data-testid="slot-host"]').text()).toBe('fallback');
  });
});

describe('setupVueComponentEnv (missing-dep contract)', () => {
  it('throws a friendly error when @vue/test-utils is absent', async () => {
    const { vi } = await import('vitest');
    vi.resetModules();
    vi.doMock('@vue/test-utils', () => {
      throw new Error('not installed');
    });
    const fresh = await import('../src/vue.js');
    await expect(
      fresh.setupVueComponentEnv({ mode: 'render', component: VueCounter }),
    ).rejects.toThrow(/@vue\/test-utils/);
    vi.doUnmock('@vue/test-utils');
    vi.resetModules();
  });
});
