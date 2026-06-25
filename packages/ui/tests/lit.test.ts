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
