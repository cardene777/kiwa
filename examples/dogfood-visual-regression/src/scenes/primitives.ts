import { appendChild, createNode } from '@kiwa/component';
import type { MockNode } from '@kiwa/component';
import type { SceneArgs } from './types.js';

/**
 * 5 primitive scene renderers used by the visual-regression dogfood. Each
 * primitive returns a small MockNode tree the ChromaticVisualMock hashes into
 * a deterministic pseudo-HTML string. The theme is wired onto `data-theme` at
 * the scene root so light + dark variants produce distinct hashes without a
 * real CSS layer being involved.
 *
 * `intentChange=true` flips a scene-specific visible bit so the diff test can
 * assert the mock detects a change against the seeded baseline — the change is
 * always a small text swap (button label / heading rename / row content) so the
 * hash mismatch is meaningful but scoped.
 */

// ---- card ----

/**
 * Card scene — heading + body + primary button. `intentChange` swaps the
 * button label from "Learn more" to "Read the docs" so the hash mismatches.
 */
export function renderCard(args: SceneArgs): MockNode {
  const root = createNode('article', {
    attrs: {
      class: `card card-${args.theme}`,
      'data-scene': args.sceneId,
      'data-theme': args.theme,
    },
  });
  const heading = createNode('h2', {
    attrs: { class: 'card-heading' },
    text: 'Kiwa release plan',
  });
  const body = createNode('p', {
    attrs: { class: 'card-body' },
    text:
      'Every milestone ships a dogfood, a fidelity report, and a docs update.',
  });
  const button = createNode('button', {
    attrs: {
      type: 'button',
      class: 'card-button',
      'aria-label': 'Learn more about the release plan',
    },
    text: args.intentChange === true ? 'Read the docs' : 'Learn more',
  });
  appendChild(root, heading);
  appendChild(root, body);
  appendChild(root, button);
  return root;
}

// ---- modal ----

/**
 * Modal scene — dialog with header, body, and confirm / cancel actions.
 * `intentChange` reworks the header from "Publish milestone" to
 * "Publish milestone v1.16" (title changes typography, so the hash mismatches).
 */
export function renderModal(args: SceneArgs): MockNode {
  const overlay = createNode('div', {
    attrs: {
      class: `modal-overlay modal-overlay-${args.theme}`,
      'data-scene': args.sceneId,
      'data-theme': args.theme,
    },
  });
  const dialog = createNode('div', {
    attrs: {
      class: 'modal-dialog',
      role: 'dialog',
      'aria-labelledby': `${args.sceneId}-title`,
    },
  });
  const header = createNode('header', {
    attrs: { class: 'modal-header' },
  });
  const title = createNode('h1', {
    attrs: { id: `${args.sceneId}-title`, class: 'modal-title' },
    text: args.intentChange === true
      ? 'Publish milestone v1.16'
      : 'Publish milestone',
  });
  const body = createNode('section', {
    attrs: { class: 'modal-body' },
  });
  const bodyText = createNode('p', {
    text: 'Confirm the release gate before promoting the report.',
  });
  const footer = createNode('footer', {
    attrs: { class: 'modal-footer' },
  });
  const confirm = createNode('button', {
    attrs: {
      type: 'button',
      class: 'modal-confirm',
      'aria-label': 'Confirm publish',
    },
    text: 'Confirm',
  });
  const cancel = createNode('button', {
    attrs: {
      type: 'button',
      class: 'modal-cancel',
      'aria-label': 'Cancel publish',
    },
    text: 'Cancel',
  });
  appendChild(header, title);
  appendChild(body, bodyText);
  appendChild(footer, confirm);
  appendChild(footer, cancel);
  appendChild(dialog, header);
  appendChild(dialog, body);
  appendChild(dialog, footer);
  appendChild(overlay, dialog);
  return overlay;
}

// ---- table ----

/**
 * Table scene — 3-column release-gate axis summary. `intentChange` swaps the
 * verdict of the first row from "pass" to "warn" so the cell text hashes
 * differently.
 */
export function renderTable(args: SceneArgs): MockNode {
  const wrapper = createNode('div', {
    attrs: {
      class: `table-wrapper table-wrapper-${args.theme}`,
      'data-scene': args.sceneId,
      'data-theme': args.theme,
    },
  });
  const caption = createNode('h2', {
    attrs: { class: 'table-caption' },
    text: 'Release gate verdicts',
  });
  const table = createNode('table', {
    attrs: { role: 'table', class: 'gate-table' },
  });
  const thead = createNode('thead');
  const headerRow = createNode('tr');
  for (const label of ['axis', 'value', 'verdict']) {
    const th = createNode('th', {
      attrs: { scope: 'col' },
      text: label,
    });
    appendChild(headerRow, th);
  }
  appendChild(thead, headerRow);
  const tbody = createNode('tbody');
  const firstVerdict = args.intentChange === true ? 'warn' : 'pass';
  const rows: Array<[string, string, string]> = [
    ['coverage', '92%', firstVerdict],
    ['fidelity', '100%', 'pass'],
    ['perf p95', '0.5ms', 'pass'],
  ];
  for (const row of rows) {
    const tr = createNode('tr');
    for (const cell of row) {
      const td = createNode('td', { text: cell });
      appendChild(tr, td);
    }
    appendChild(tbody, tr);
  }
  appendChild(table, thead);
  appendChild(table, tbody);
  appendChild(wrapper, caption);
  appendChild(wrapper, table);
  return wrapper;
}

// ---- toast ----

/**
 * Toast scene — polite live region with icon + message + close button.
 * `intentChange` rewrites the toast message from "Report emitted." to
 * "Report emitted and promoted." so the hash mismatches.
 */
export function renderToast(args: SceneArgs): MockNode {
  const container = createNode('div', {
    attrs: {
      class: `toast-container toast-container-${args.theme}`,
      role: 'status',
      'aria-live': 'polite',
      'data-scene': args.sceneId,
      'data-theme': args.theme,
    },
  });
  const icon = createNode('span', {
    attrs: { class: 'toast-icon', 'aria-hidden': 'true' },
    text: 'ok',
  });
  const message = createNode('p', {
    attrs: { class: 'toast-message' },
    text: args.intentChange === true
      ? 'Report emitted and promoted.'
      : 'Report emitted.',
  });
  const close = createNode('button', {
    attrs: {
      type: 'button',
      class: 'toast-close',
      'aria-label': 'Dismiss notification',
    },
    text: 'x',
  });
  appendChild(container, icon);
  appendChild(container, message);
  appendChild(container, close);
  return container;
}

// ---- form ----

/**
 * Form scene — simple sign-in form with email + password + submit. Used to
 * exercise the visual-regression flow against an input-heavy layout.
 * `intentChange` swaps the submit button label from "Sign in" to "Continue"
 * so the hash mismatches.
 */
export function renderForm(args: SceneArgs): MockNode {
  const form = createNode('form', {
    attrs: {
      class: `sign-in sign-in-${args.theme}`,
      'data-scene': args.sceneId,
      'data-theme': args.theme,
      novalidate: 'novalidate',
    },
  });
  const heading = createNode('h1', {
    attrs: { class: 'sign-in-heading' },
    text: 'Sign in to Kiwa',
  });
  const fieldEmail = createNode('div', { attrs: { class: 'field' } });
  const labelEmail = createNode('label', {
    attrs: { for: `${args.sceneId}-email` },
    text: 'Email',
  });
  const inputEmail = createNode('input', {
    attrs: {
      id: `${args.sceneId}-email`,
      name: 'email',
      type: 'email',
      required: 'required',
      autocomplete: 'email',
    },
  });
  appendChild(fieldEmail, labelEmail);
  appendChild(fieldEmail, inputEmail);
  const fieldPassword = createNode('div', { attrs: { class: 'field' } });
  const labelPassword = createNode('label', {
    attrs: { for: `${args.sceneId}-password` },
    text: 'Password',
  });
  const inputPassword = createNode('input', {
    attrs: {
      id: `${args.sceneId}-password`,
      name: 'password',
      type: 'password',
      required: 'required',
      autocomplete: 'current-password',
    },
  });
  appendChild(fieldPassword, labelPassword);
  appendChild(fieldPassword, inputPassword);
  const submit = createNode('button', {
    attrs: {
      type: 'submit',
      class: 'sign-in-submit',
      'aria-label': 'Sign in submit',
    },
    text: args.intentChange === true ? 'Continue' : 'Sign in',
  });
  appendChild(form, heading);
  appendChild(form, fieldEmail);
  appendChild(form, fieldPassword);
  appendChild(form, submit);
  return form;
}
