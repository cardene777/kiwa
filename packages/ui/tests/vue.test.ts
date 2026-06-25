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
