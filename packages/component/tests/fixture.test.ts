import { describe, expect, it } from 'vitest';
import {
  buildButton,
  buildCard,
  buildForm,
  buildInput,
  buildModal,
  componentFixtures,
  createCanvas,
} from '../src/index.js';

describe('buildButton fixture', () => {
  it('renders button with class + label', () => {
    const btn = buildButton({ label: 'Save' });
    expect(btn.tag).toBe('button');
    expect(btn.text).toBe('Save');
    expect(btn.attrs['class']).toBe('btn btn-primary');
  });

  it('applies variant class', () => {
    const btn = buildButton({ label: 'Delete', variant: 'danger' });
    expect(btn.attrs['class']).toBe('btn btn-danger');
  });

  it('disabled button drops click handler and sets aria-disabled', () => {
    let hits = 0;
    const btn = buildButton({
      label: 'x',
      disabled: true,
      onClick: () => hits++,
    });
    expect(btn.attrs['disabled']).toBe('true');
    expect(btn.attrs['aria-disabled']).toBe('true');
    expect(btn.handlers['click']).toBeUndefined();
    hits; // silence unused
  });
});

describe('buildInput fixture', () => {
  it('creates label + input pair with matching for/id', () => {
    const wrapper = buildInput({ id: 'email', label: 'Email', type: 'email' });
    expect(wrapper.tag).toBe('div');
    const canvas = createCanvas(wrapper);
    const label = canvas.querySelector('label');
    const input = canvas.querySelector('input');
    expect(label?.attrs['for']).toBe('email');
    expect(input?.attrs['id']).toBe('email');
    expect(input?.attrs['type']).toBe('email');
  });

  it('input event updates value and triggers onChange', () => {
    let latest = '';
    const wrapper = buildInput({
      id: 'name',
      label: 'Name',
      onChange: (e) => {
        if (e.value !== undefined) latest = e.value;
      },
    });
    const input = wrapper.children[1]!;
    input.handlers['input']?.[0]?.({ type: 'input', target: input, value: 'alice' });
    expect(latest).toBe('alice');
  });
});

describe('buildForm fixture', () => {
  it('renders title + fields + submit button', () => {
    const form = buildForm({
      title: 'Signup',
      fields: [
        { id: 'email', label: 'Email' },
        { id: 'name', label: 'Name' },
      ],
      submitLabel: 'Register',
    });
    const canvas = createCanvas(form);
    expect(canvas.getByRole('heading').text).toBe('Signup');
    expect(canvas.querySelectorAll('input')).toHaveLength(2);
    expect(canvas.getByRole('button').text).toBe('Register');
  });

  it('submit fires onSubmit with all field values', () => {
    let submitted: Record<string, string> | null = null;
    const form = buildForm({
      title: 't',
      fields: [
        { id: 'email', label: 'e', value: 'x@y' },
        { id: 'name', label: 'n', value: 'alice' },
      ],
      onSubmit: (data) => {
        submitted = data;
      },
    });
    const canvas = createCanvas(form);
    const submit = canvas.getByRole('button');
    submit.handlers['click']?.[0]?.({ type: 'click', target: submit });
    expect(submitted).toEqual({ email: 'x@y', name: 'alice' });
  });

  it('submit blocked when required field empty', () => {
    let submitCount = 0;
    const form = buildForm({
      title: 't',
      fields: [{ id: 'email', label: 'e', required: true, value: '' }],
      onSubmit: () => {
        submitCount++;
      },
    });
    const canvas = createCanvas(form);
    const submit = canvas.getByRole('button');
    submit.handlers['click']?.[0]?.({ type: 'click', target: submit });
    expect(submitCount).toBe(0);
  });
});

describe('buildModal fixture', () => {
  it('open=false renders closed marker', () => {
    const modal = buildModal({ open: false, title: 't', body: 'b' });
    expect(modal.attrs['class']).toContain('modal-closed');
    expect(modal.attrs['aria-hidden']).toBe('true');
  });

  it('open=true renders dialog with role and title', () => {
    const modal = buildModal({ open: true, title: 'Confirm', body: 'proceed?' });
    const canvas = createCanvas(modal);
    const dialog = canvas.querySelector('[role=dialog]');
    expect(dialog).toBeDefined();
    expect(dialog?.attrs['aria-modal']).toBe('true');
    expect(canvas.getByText('Confirm')).toBeDefined();
  });

  it('backdrop click fires onClose when closeOnBackdrop enabled (default)', () => {
    let closed = 0;
    const modal = buildModal({
      open: true,
      title: 't',
      body: 'b',
      onClose: () => closed++,
    });
    modal.handlers['click']?.[0]?.({ type: 'click', target: modal });
    expect(closed).toBe(1);
  });

  it('backdrop click ignored when closeOnBackdrop=false', () => {
    let closed = 0;
    const modal = buildModal({
      open: true,
      title: 't',
      body: 'b',
      closeOnBackdrop: false,
      onClose: () => closed++,
    });
    expect(modal.handlers['click']).toBeUndefined();
    closed; // silence
  });

  it('close button click fires onClose', () => {
    let closed = 0;
    const modal = buildModal({
      open: true,
      title: 't',
      body: 'b',
      onClose: () => closed++,
    });
    const canvas = createCanvas(modal);
    const closeBtn = canvas.getByRole('button', { name: 'Close' });
    closeBtn.handlers['click']?.[0]?.({ type: 'click', target: closeBtn });
    expect(closed).toBe(1);
  });
});

describe('buildCard fixture', () => {
  it('renders title + body', () => {
    const card = buildCard({ title: 'Hello', body: 'World' });
    const canvas = createCanvas(card);
    expect(canvas.getByText('Hello')).toBeDefined();
    expect(canvas.getByText('World')).toBeDefined();
    expect(canvas.querySelector('footer')).toBeNull();
  });

  it('footer optional, renders when provided', () => {
    const card = buildCard({ title: 't', body: 'b', footer: 'meta' });
    const canvas = createCanvas(card);
    expect(canvas.querySelector('footer')?.text).toBe('meta');
  });

  it('variant class reflects prop', () => {
    const card = buildCard({ title: 't', body: 'b', variant: 'elevated' });
    expect(card.attrs['class']).toBe('card card-elevated');
  });
});

describe('componentFixtures registry', () => {
  it('exports 5 fixture builders', () => {
    expect(Object.keys(componentFixtures).sort()).toEqual([
      'Button',
      'Card',
      'Form',
      'Input',
      'Modal',
    ]);
  });

  it('each fixture returns a MockNode when called with args', () => {
    expect(componentFixtures['Button']!({ label: 'x' }).tag).toBe('button');
    expect(componentFixtures['Card']!({ title: 't', body: 'b' }).tag).toBe('article');
    expect(componentFixtures['Modal']!({ open: false, title: 't', body: 'b' }).tag).toBe('div');
  });
});
