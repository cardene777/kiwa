import { describe, expect, it } from 'vitest';
import {
  buildButton,
  buildCard,
  buildForm,
  buildInput,
  createPlaywrightCTMock,
} from '../src/index.js';

describe('PlaywrightCTMock — mount + locator API', () => {
  it('mount renders a component and exposes canvas', () => {
    const ct = createPlaywrightCTMock();
    const locator = ct.mount(buildButton, { label: 'ok' });
    expect(locator.canvas.getByRole('button').text).toBe('ok');
    expect(locator.root.tag).toBe('button');
  });

  it('getByRole().click() triggers registered click handler', async () => {
    const ct = createPlaywrightCTMock();
    let hits = 0;
    const locator = ct.mount(buildButton, {
      label: 'ok',
      onClick: () => hits++,
    });
    await locator.getByRole('button', { name: 'ok' }).click();
    expect(hits).toBe(1);
  });

  it('getByText().click() finds by text content', async () => {
    const ct = createPlaywrightCTMock();
    let hits = 0;
    const locator = ct.mount(buildButton, {
      label: 'Confirm',
      onClick: () => hits++,
    });
    await locator.getByText('Confirm').click();
    expect(hits).toBe(1);
  });

  it('getByRole().textContent() reads text', async () => {
    const ct = createPlaywrightCTMock();
    const locator = ct.mount(buildButton, { label: 'hello' });
    const text = await locator.getByRole('button').textContent();
    expect(text).toBe('hello');
  });

  it('getByRole().count() returns 1 when present, 0 when absent', async () => {
    const ct = createPlaywrightCTMock();
    const locator = ct.mount(buildButton, { label: 'ok' });
    expect(await locator.getByRole('button').count()).toBe(1);
    expect(await locator.getByRole('checkbox').count()).toBe(0);
  });
});

describe('PlaywrightCTMock — fill interaction', () => {
  it('fill on textbox locator sets value and fires input event', async () => {
    const ct = createPlaywrightCTMock();
    let latest = '';
    const locator = ct.mount(buildInput, {
      id: 'email',
      label: 'Email',
      onChange: (event) => {
        if (event.value !== undefined) latest = event.value;
      },
    });
    await locator.getByRole('textbox').fill('user@example.com');
    expect(latest).toBe('user@example.com');
    expect(locator.canvas.querySelector('input')?.value).toBe('user@example.com');
  });

  it('form submit collects all field values via input events + click', async () => {
    const ct = createPlaywrightCTMock();
    let submitted: Record<string, string> | null = null;
    const locator = ct.mount(buildForm, {
      title: 'Signup',
      fields: [
        { id: 'email', label: 'Email', type: 'email', required: true },
        { id: 'name', label: 'Name', required: true },
      ],
      onSubmit: (data) => {
        submitted = data;
      },
    });
    // Fill fields via input event
    const inputs = locator.canvas.querySelectorAll('input');
    const emailInput = inputs[0]!;
    const nameInput = inputs[1]!;
    emailInput.handlers['input']?.[0]?.({
      type: 'input',
      target: emailInput,
      value: 'a@b.c',
    });
    nameInput.handlers['input']?.[0]?.({
      type: 'input',
      target: nameInput,
      value: 'alice',
    });
    await locator.getByRole('button').click();
    expect(submitted).toEqual({ email: 'a@b.c', name: 'alice' });
  });

  it('form submit blocked when required field empty (validation)', async () => {
    const ct = createPlaywrightCTMock();
    let submitCount = 0;
    const locator = ct.mount(buildForm, {
      title: 'Signup',
      fields: [{ id: 'email', label: 'Email', required: true }],
      onSubmit: () => {
        submitCount++;
      },
    });
    await locator.getByRole('button').click();
    expect(submitCount).toBe(0); // no field filled
  });
});

describe('PlaywrightCTMock — lifecycle', () => {
  it('activeMounts increases on mount and decreases on unmount', () => {
    const ct = createPlaywrightCTMock();
    expect(ct.activeMounts()).toBe(0);
    const a = ct.mount(buildButton, { label: 'a' });
    const b = ct.mount(buildButton, { label: 'b' });
    expect(ct.activeMounts()).toBe(2);
    a.unmount();
    expect(ct.activeMounts()).toBe(1);
    b.unmount();
    expect(ct.activeMounts()).toBe(0);
  });

  it('unmount clears all handlers to prevent leaks', async () => {
    const ct = createPlaywrightCTMock();
    let hits = 0;
    const locator = ct.mount(buildButton, {
      label: 'ok',
      onClick: () => hits++,
    });
    await locator.getByRole('button').click();
    expect(hits).toBe(1);
    locator.unmount();
    // After unmount, re-firing the retained root should not trigger anything
    expect(Object.keys(locator.root.handlers)).toHaveLength(0);
  });

  it('unmountAll clears all active mounts at once', () => {
    const ct = createPlaywrightCTMock();
    ct.mount(buildButton, { label: 'a' });
    ct.mount(buildButton, { label: 'b' });
    ct.mount(buildCard, { title: 'c', body: 'd' });
    expect(ct.activeMounts()).toBe(3);
    ct.unmountAll();
    expect(ct.activeMounts()).toBe(0);
  });
});

describe('PlaywrightCTMock — real API surface parity', () => {
  it('locator.node() returns underlying node or null (mock-side assert)', async () => {
    const ct = createPlaywrightCTMock();
    const locator = ct.mount(buildButton, { label: 'x' });
    const node = locator.getByRole('button').node();
    expect(node).toBeDefined();
    expect(node?.tag).toBe('button');
    expect(locator.getByRole('checkbox').node()).toBeNull();
  });

  it('nested component (card > footer) resolvable via getByText', () => {
    const ct = createPlaywrightCTMock();
    const locator = ct.mount(buildCard, {
      title: 'Hello',
      body: 'World',
      footer: 'Cardene',
    });
    expect(locator.getByText('Cardene').node()?.tag).toBe('footer');
  });
});
