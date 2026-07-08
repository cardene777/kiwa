import { appendChild, createNode } from '@kiwa/component';
import {
  buildCheckbox,
  buildErrorRegion,
  buildField,
  buildSubmitButton,
} from './builders.js';
import type { FormRender } from './types.js';

/**
 * Login form — email + password + remember me. email + password are required;
 * remember me is optional. The submit handler either fires `onSubmit` when
 * both required fields are populated or `onValidationError` (with the list of
 * missing field ids) when validation blocks the submit.
 *
 * The DOM shape stays framework-agnostic — the same fixture is drivable in
 * mock mode (`createPlaywrightCTMock().mount(buildLoginForm, args)`) and, once
 * `PW_CT_ENDPOINT` is set, would be a straight source translation for the real
 * `@playwright/experimental-ct-react` runner.
 */
export const buildLoginForm: FormRender<'login'> = (args) => {
  const values = new Map<string, string>();
  values.set('email', args.email ?? '');
  values.set('password', args.password ?? '');
  values.set('rememberMe', args.rememberMe ? 'on' : '');

  let currentError = '';
  const errorRegion = buildErrorRegion(args.formId, currentError);

  const form = createNode('form', {
    attrs: {
      class: 'form form-login',
      role: 'form',
      'aria-label': 'Login form',
      'data-form-id': args.formId,
    },
  });
  const title = createNode('h2', {
    attrs: { id: `${args.formId}-title`, class: 'form-title' },
    text: 'Sign in',
  });
  appendChild(form, title);

  appendChild(
    form,
    buildField({
      id: 'email',
      label: 'Email',
      type: 'email',
      value: args.email ?? '',
      required: true,
      autoComplete: 'email',
      onInput: (v) => values.set('email', v),
    }),
  );
  appendChild(
    form,
    buildField({
      id: 'password',
      label: 'Password',
      type: 'password',
      value: args.password ?? '',
      required: true,
      autoComplete: 'current-password',
      onInput: (v) => values.set('password', v),
    }),
  );
  appendChild(
    form,
    buildCheckbox({
      id: 'rememberMe',
      label: 'Remember me',
      checked: args.rememberMe ?? false,
      onChange: (checked) => values.set('rememberMe', checked ? 'on' : ''),
    }),
  );

  appendChild(
    form,
    buildSubmitButton({
      formId: args.formId,
      label: 'Sign in',
      onClick: () => {
        const missing: string[] = [];
        if (!values.get('email')) missing.push('email');
        if (!values.get('password')) missing.push('password');
        if (missing.length > 0) {
          currentError = `Please fill in: ${missing.join(', ')}`;
          errorRegion.text = currentError;
          args.onValidationError?.({
            formId: args.formId,
            missingFieldIds: missing,
          });
          return;
        }
        currentError = '';
        errorRegion.text = '';
        args.onSubmit?.({
          formId: args.formId,
          values: Object.fromEntries(values),
        });
      },
    }),
  );
  appendChild(form, errorRegion);
  return form;
};
