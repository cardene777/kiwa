/// <reference types="vitest/globals" />
import { LitElement, html, type PropertyValues } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { setupLitComponentEnv, type LitTestEnvUi } from '../src/index.js';

/**
 * Lit 3 supports both decorator-based and static-property-based class authoring.
 * We use the static-properties route here so the tests work without enabling
 * legacy `experimentalDecorators` in tsconfig.base.
 */
class KiwaCounter extends LitElement {
  static override properties = {
    initial: { type: Number },
    count: { state: true },
  } as const;

  declare initial: number;
  declare private count: number;

  constructor() {
    super();
    this.initial = 0;
    this.count = 0;
  }

  override firstUpdated(_changed: PropertyValues) {
    this.count = this.initial;
  }

  override render() {
    return html`
      <div>
        <span data-testid="value">${this.count}</span>
        <button type="button" aria-label="increment" @click=${() => this.handleClick()}>+</button>
      </div>
    `;
  }

  private handleClick() {
    this.count += 1;
    this.requestUpdate();
  }
}
customElements.define('kiwa-counter', KiwaCounter);

const envs: LitTestEnvUi[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupLitComponentEnv (render)', () => {
  it('mounts a Lit custom element and exposes markup', async () => {
    const env = await setupLitComponentEnv({
      mode: 'render',
      template: html`<kiwa-counter .initial=${3}></kiwa-counter>`,
    });
    envs.push(env);
    expect(env.kind).toBe('lit');
    expect(env.markup.toLowerCase()).toContain('kiwa-counter');
    const span = env.handle.shadowQuerySelector<HTMLSpanElement>('[data-testid="value"]');
    expect(span?.textContent).toBe('3');
  });
});

describe('setupLitComponentEnv (interaction)', () => {
  it('drives a real click on a shadow DOM button and updates state', async () => {
    const env = await setupLitComponentEnv({
      mode: 'interaction',
      template: html`<kiwa-counter></kiwa-counter>`,
    });
    envs.push(env);
    const button = env.handle.shadowQuerySelector<HTMLButtonElement>('button');
    button!.click();
    button!.click();
    await (env.handle.element as LitElement).updateComplete;
    const span = env.handle.shadowQuerySelector<HTMLSpanElement>('[data-testid="value"]');
    expect(span?.textContent).toBe('2');
  });
});

describe('setupLitComponentEnv (mutation-kill)', () => {
  it('env.mode === "live" for opts.mode === "interaction" (kills EqualityOperator + ConditionalExpression on L22)', async () => {
    const env = await setupLitComponentEnv({
      mode: 'interaction',
      template: html`<kiwa-counter></kiwa-counter>`,
    });
    envs.push(env);
    expect(env.mode).toBe('live');
  });

  it('env.mode === "mock" for opts.mode === "render" (kills the false branch of L22)', async () => {
    const env = await setupLitComponentEnv({
      mode: 'render',
      template: html`<kiwa-counter></kiwa-counter>`,
    });
    envs.push(env);
    expect(env.mode).toBe('mock');
  });

  it('env.mode === "mock" for opts.mode === "snapshot" (mode falls through to default)', async () => {
    const env = await setupLitComponentEnv({
      mode: 'snapshot',
      template: html`<kiwa-counter></kiwa-counter>`,
    });
    envs.push(env);
    expect(env.mode).toBe('mock');
  });

  it('env.kind === "lit" — kills StringLiteral mutation on the kind tag', async () => {
    const env = await setupLitComponentEnv({
      mode: 'render',
      template: html`<kiwa-counter></kiwa-counter>`,
    });
    envs.push(env);
    expect(env.kind).toBe('lit');
  });

  it('handle.shadowRoot is the element shadowRoot when present (kills L14 LogicalOperator)', async () => {
    const env = await setupLitComponentEnv({
      mode: 'render',
      template: html`<kiwa-counter></kiwa-counter>`,
    });
    envs.push(env);
    // KiwaCounter uses shadow DOM by default.
    expect(env.handle.shadowRoot).not.toBeNull();
    expect(env.handle.shadowRoot).toBe(env.handle.element.shadowRoot);
  });

  it('handle.querySelector queries LIGHT DOM (kills L15 ArrowFunction)', async () => {
    const env = await setupLitComponentEnv({
      mode: 'render',
      template: html`<kiwa-counter><span class="light-slot">hi</span></kiwa-counter>`,
    });
    envs.push(env);
    // The light-slot span is not in shadow DOM — querySelector must reach it.
    const light = env.handle.querySelector<HTMLSpanElement>('.light-slot');
    expect(light?.textContent).toBe('hi');
  });

  it('handle.shadowQuerySelector falls back to light DOM when no shadowRoot present', async () => {
    // A bare div has no shadowRoot. The fallback path returns the light DOM
    // result.
    const env = await setupLitComponentEnv({
      mode: 'render',
      template: html`<div><span data-testid="bare">x</span></div>`,
    });
    envs.push(env);
    expect(env.handle.shadowRoot).toBeNull();
    const span = env.handle.shadowQuerySelector<HTMLSpanElement>('[data-testid="bare"]');
    expect(span?.textContent).toBe('x');
  });

  it('stop() removes the element from the DOM (kills L26 BlockStatement {} mutation)', async () => {
    const env = await setupLitComponentEnv({
      mode: 'render',
      template: html`<kiwa-counter></kiwa-counter>`,
    });
    const el = env.handle.element;
    expect(el.isConnected).toBe(true);
    await env.stop();
    // After stop, element MUST be detached. Kills "stop -> {}" mutation by
    // observing the side effect.
    expect(el.isConnected).toBe(false);
  });

  it('markup contains a serialised representation of the mounted element', async () => {
    const env = await setupLitComponentEnv({
      mode: 'render',
      template: html`<kiwa-counter .initial=${7}></kiwa-counter>`,
    });
    envs.push(env);
    expect(env.markup).toMatch(/kiwa-counter/i);
    expect(env.markup.length).toBeGreaterThan(0);
  });
});
