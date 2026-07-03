import { appendChild, createNode } from './dom.js';
import type { ComponentRender, MockEvent, MockNode } from './types.js';

/**
 * 5 pattern の共通 component fixture。 Storybook story / Playwright CT mount /
 * Chromatic capture の 3 経路で共有できる framework agnostic renderer。 実 SB /
 * PW CT / Chromatic に持込む時は各 framework (React / Vue / Svelte / Solid) の
 * component として書換えるが、 test だけ回す用途はこの fixture で完結する。
 *
 * 5 pattern の選定理由 = SaaS frontend で頻出する 5 primitive を全 cover する。
 * - Button (interactive、 click event、 disabled state)
 * - Input (controlled、 input event、 label association)
 * - Form (submit event、 field 集約、 validation)
 * - Modal (open/close state、 backdrop click、 escape close)
 * - Card (content wrapping、 title + body、 optional footer)
 */

// ---- Button ----

export interface ButtonArgs {
  label: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: (event: MockEvent) => void;
}

/**
 * Button — text label + optional click handler + disabled state。
 * variant は class 属性に反映 (chromatic diff で variant 別 baseline を持てる)。
 */
export const buildButton: ComponentRender<ButtonArgs> = (args) => {
  const variant = args.variant ?? 'primary';
  const attrs: Record<string, string> = {
    class: `btn btn-${variant}`,
    type: 'button',
  };
  if (args.disabled) {
    attrs['disabled'] = 'true';
    attrs['aria-disabled'] = 'true';
  }
  return createNode('button', {
    attrs,
    text: args.label,
    ...(args.onClick && !args.disabled
      ? { on: { click: args.onClick } }
      : {}),
  });
};

// ---- Input ----

export interface InputArgs {
  id: string;
  label: string;
  value?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  required?: boolean;
  placeholder?: string;
  onChange?: (event: MockEvent) => void;
}

/**
 * Input — label + input の pair、 label[for] で id を関連付ける (a11y label
 * rule を pass する)。 onChange は input event で発火。
 */
export const buildInput: ComponentRender<InputArgs> = (args) => {
  const wrapper = createNode('div', { attrs: { class: 'input-group' } });
  const label = createNode('label', {
    attrs: { for: args.id, class: 'input-label' },
    text: args.label,
  });
  const inputAttrs: Record<string, string> = {
    id: args.id,
    name: args.id,
    type: args.type ?? 'text',
    class: 'input-field',
  };
  if (args.required) inputAttrs['required'] = 'true';
  if (args.placeholder) inputAttrs['placeholder'] = args.placeholder;
  const input = createNode('input', {
    attrs: inputAttrs,
    value: args.value ?? '',
    ...(args.onChange ? { on: { input: args.onChange } } : {}),
  });
  appendChild(wrapper, label);
  appendChild(wrapper, input);
  return wrapper;
};

// ---- Form ----

export interface FormField {
  id: string;
  label: string;
  type?: InputArgs['type'];
  required?: boolean;
  value?: string;
}

export interface FormArgs {
  title: string;
  fields: FormField[];
  submitLabel?: string;
  onSubmit?: (data: Record<string, string>) => void;
}

/**
 * Form — title + 複数 input + submit button。 submit 時に全 field の value を
 * 集めて onSubmit に渡す。 required field 未入力なら submit を発火しない
 * (validation)、 UI 側で「必須」 表示を出す責務。
 */
export const buildForm: ComponentRender<FormArgs> = (args) => {
  const form = createNode('form', {
    attrs: { class: 'form', role: 'form' },
  });
  const heading = createNode('h2', {
    attrs: { class: 'form-title' },
    text: args.title,
  });
  appendChild(form, heading);

  const fieldValues = new Map<string, string>();
  for (const field of args.fields) {
    fieldValues.set(field.id, field.value ?? '');
    const wrapper = buildInput({
      id: field.id,
      label: field.label,
      ...(field.type !== undefined ? { type: field.type } : {}),
      ...(field.required !== undefined ? { required: field.required } : {}),
      value: field.value ?? '',
      onChange: (event) => {
        if (event.value !== undefined) {
          fieldValues.set(field.id, event.value);
        }
      },
    });
    appendChild(form, wrapper);
  }

  const submit = createNode('button', {
    attrs: {
      type: 'submit',
      class: 'form-submit btn btn-primary',
    },
    text: args.submitLabel ?? 'Submit',
    on: {
      click: () => {
        // required field を確認
        for (const field of args.fields) {
          if (field.required && !fieldValues.get(field.id)) {
            return; // validation fail、 submit 発火せず
          }
        }
        args.onSubmit?.(Object.fromEntries(fieldValues));
      },
    },
  });
  appendChild(form, submit);
  return form;
};

// ---- Modal ----

export interface ModalArgs {
  open: boolean;
  title: string;
  body: string;
  onClose?: () => void;
  closeOnBackdrop?: boolean;
}

/**
 * Modal — open=false なら空 div を返す (closed 状態を表現)。 open=true で
 * backdrop + dialog を組む。 backdrop click / close button click で
 * onClose を発火。
 */
export const buildModal: ComponentRender<ModalArgs> = (args) => {
  if (!args.open) {
    return createNode('div', {
      attrs: { class: 'modal modal-closed', 'aria-hidden': 'true' },
    });
  }
  const backdrop = createNode('div', {
    attrs: { class: 'modal-backdrop', role: 'presentation' },
    ...(args.closeOnBackdrop !== false && args.onClose
      ? { on: { click: () => args.onClose?.() } }
      : {}),
  });
  const dialog = createNode('div', {
    attrs: {
      class: 'modal-dialog',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'modal-title',
    },
  });
  const heading = createNode('h2', {
    attrs: { id: 'modal-title', class: 'modal-title' },
    text: args.title,
  });
  const body = createNode('p', {
    attrs: { class: 'modal-body' },
    text: args.body,
  });
  const closeBtn = createNode('button', {
    attrs: {
      type: 'button',
      class: 'modal-close',
      'aria-label': 'Close',
    },
    text: 'x',
    ...(args.onClose ? { on: { click: () => args.onClose?.() } } : {}),
  });
  appendChild(dialog, heading);
  appendChild(dialog, body);
  appendChild(dialog, closeBtn);
  appendChild(backdrop, dialog);
  return backdrop;
};

// ---- Card ----

export interface CardArgs {
  title: string;
  body: string;
  footer?: string;
  variant?: 'default' | 'outlined' | 'elevated';
}

/**
 * Card — title / body / optional footer の 3 slot。 chromatic diff で variant
 * 別 baseline を持つ用途の代表 pattern。
 */
export const buildCard: ComponentRender<CardArgs> = (args) => {
  const variant = args.variant ?? 'default';
  const card = createNode('article', {
    attrs: { class: `card card-${variant}` },
  });
  const heading = createNode('h3', {
    attrs: { class: 'card-title' },
    text: args.title,
  });
  const body = createNode('p', {
    attrs: { class: 'card-body' },
    text: args.body,
  });
  appendChild(card, heading);
  appendChild(card, body);
  if (args.footer) {
    const footer = createNode('footer', {
      attrs: { class: 'card-footer' },
      text: args.footer,
    });
    appendChild(card, footer);
  }
  return card;
};

/** 全 component の render function を 1 record にまとめる (test 一括登録用)。 */
export const componentFixtures: Record<string, ComponentRender<Record<string, unknown>>> = {
  Button: buildButton as unknown as ComponentRender<Record<string, unknown>>,
  Input: buildInput as unknown as ComponentRender<Record<string, unknown>>,
  Form: buildForm as unknown as ComponentRender<Record<string, unknown>>,
  Modal: buildModal as unknown as ComponentRender<Record<string, unknown>>,
  Card: buildCard as unknown as ComponentRender<Record<string, unknown>>,
};

/** primitive DOM helper の re-export (test / dogfood app 側から直接使う)。 */
export { createNode, appendChild } from './dom.js';
export type { MockNode };
