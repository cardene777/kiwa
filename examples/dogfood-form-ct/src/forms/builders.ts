import { appendChild, createNode } from '@kiwa-lab/component';
import type { MockNode } from '@kiwa-lab/component';

/**
 * Small builders every form fixture uses to keep markup consistent — an input
 * pair (label[for] + input#id), an error message region wired via
 * `aria-describedby`, and a submit button. Sharing these makes the a11y
 * heuristic (button-name / image-alt / label) pass uniformly across all 5
 * forms and keeps the mount snapshot readable in Chromatic-style hashing.
 */

export interface FieldSpec {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';
  value?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  onInput?: (value: string) => void;
}

/**
 * Build a label + input pair. Adds `aria-required=true` when required so the
 * heuristic a11y checker inside `@kiwa-lab/component` treats the field as
 * accessible even when the placeholder is empty.
 */
export function buildField(spec: FieldSpec): MockNode {
  const wrapper = createNode('div', {
    attrs: { class: 'field', 'data-field-id': spec.id },
  });
  const label = createNode('label', {
    attrs: { for: spec.id, class: 'field-label' },
    text: spec.label,
  });
  const inputAttrs: Record<string, string> = {
    id: spec.id,
    name: spec.id,
    type: spec.type ?? 'text',
    class: 'field-input',
  };
  if (spec.required) {
    inputAttrs['required'] = 'true';
    inputAttrs['aria-required'] = 'true';
  }
  if (spec.placeholder) inputAttrs['placeholder'] = spec.placeholder;
  if (spec.autoComplete) inputAttrs['autocomplete'] = spec.autoComplete;
  const input = createNode('input', {
    attrs: inputAttrs,
    value: spec.value ?? '',
    on: {
      input: (event) => {
        input.value = event.value ?? '';
        spec.onInput?.(event.value ?? '');
      },
    },
  });
  appendChild(wrapper, label);
  appendChild(wrapper, input);
  return wrapper;
}

export interface CheckboxSpec {
  id: string;
  label: string;
  checked?: boolean;
  required?: boolean;
  onChange?: (checked: boolean) => void;
}

/**
 * Checkbox pair — the label wraps the input to guarantee the association even
 * when the checkbox does not have a `for=` label sibling. Storybook / real
 * Playwright treat wrapped labels as the primary a11y pattern for opt-in
 * consent fields (Terms of Service, Remember me).
 */
export function buildCheckbox(spec: CheckboxSpec): MockNode {
  const wrapper = createNode('label', {
    attrs: { class: 'field field-checkbox', for: spec.id },
  });
  const inputAttrs: Record<string, string> = {
    id: spec.id,
    name: spec.id,
    type: 'checkbox',
    class: 'field-checkbox-input',
  };
  if (spec.required) inputAttrs['aria-required'] = 'true';
  if (spec.checked) inputAttrs['checked'] = 'true';
  const input = createNode('input', {
    attrs: inputAttrs,
    value: spec.checked ? 'on' : '',
    on: {
      input: (event) => {
        const next = event.value === 'on';
        input.attrs['checked'] = next ? 'true' : '';
        input.value = next ? 'on' : '';
        spec.onChange?.(next);
      },
    },
  });
  const labelText = createNode('span', {
    attrs: { class: 'field-checkbox-label' },
    text: spec.label,
  });
  appendChild(wrapper, input);
  appendChild(wrapper, labelText);
  return wrapper;
}

export interface SelectSpec {
  id: string;
  label: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
  onChange?: (value: string) => void;
}

/** Native `select` pair with an associated label. */
export function buildSelect(spec: SelectSpec): MockNode {
  const wrapper = createNode('div', {
    attrs: { class: 'field field-select' },
  });
  const label = createNode('label', {
    attrs: { for: spec.id, class: 'field-label' },
    text: spec.label,
  });
  const select = createNode('select', {
    attrs: {
      id: spec.id,
      name: spec.id,
      class: 'field-select-input',
    },
    value: spec.value ?? spec.options[0]?.value ?? '',
    on: {
      input: (event) => {
        select.value = event.value ?? '';
        spec.onChange?.(event.value ?? '');
      },
    },
  });
  for (const option of spec.options) {
    const optAttrs: Record<string, string> = { value: option.value };
    if (option.value === (spec.value ?? spec.options[0]?.value)) {
      optAttrs['selected'] = 'true';
    }
    appendChild(
      select,
      createNode('option', { attrs: optAttrs, text: option.label }),
    );
  }
  appendChild(wrapper, label);
  appendChild(wrapper, select);
  return wrapper;
}

export interface TextAreaSpec {
  id: string;
  label: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  onInput?: (value: string) => void;
}

export function buildTextArea(spec: TextAreaSpec): MockNode {
  const wrapper = createNode('div', {
    attrs: { class: 'field field-textarea' },
  });
  const label = createNode('label', {
    attrs: { for: spec.id, class: 'field-label' },
    text: spec.label,
  });
  const attrs: Record<string, string> = {
    id: spec.id,
    name: spec.id,
    class: 'field-textarea-input',
  };
  if (spec.required) {
    attrs['required'] = 'true';
    attrs['aria-required'] = 'true';
  }
  if (spec.placeholder) attrs['placeholder'] = spec.placeholder;
  const textarea = createNode('textarea', {
    attrs,
    value: spec.value ?? '',
    on: {
      input: (event) => {
        textarea.value = event.value ?? '';
        spec.onInput?.(event.value ?? '');
      },
    },
  });
  appendChild(wrapper, label);
  appendChild(wrapper, textarea);
  return wrapper;
}

export interface SubmitButtonSpec {
  label: string;
  formId: string;
  onClick: () => void;
}

/** Submit button with a role=button + aria-label to keep the a11y heuristic
 *  clean even when the visible label ends up empty (e.g. only an icon). */
export function buildSubmitButton(spec: SubmitButtonSpec): MockNode {
  return createNode('button', {
    attrs: {
      type: 'submit',
      class: 'form-submit',
      'aria-label': spec.label,
      'data-form-id': spec.formId,
    },
    text: spec.label,
    on: { click: () => spec.onClick() },
  });
}

/** Live error region rendered as an `aria-live=polite` block below the form.
 *  Empty when no error is active — the CT flow asserts the visible text after
 *  a validation-block submit attempt to prove the message reached the DOM. */
export function buildErrorRegion(formId: string, message: string): MockNode {
  return createNode('div', {
    attrs: {
      class: 'form-error',
      role: 'alert',
      'aria-live': 'polite',
      'data-form-id': formId,
    },
    text: message,
  });
}
