import { appendChild, createNode } from '@kiwa-test/component';
import {
  buildCheckbox,
  buildErrorRegion,
  buildField,
  buildSubmitButton,
} from './builders.js';
import type { FormRender } from './types.js';

/**
 * Signup form — email + password + password confirmation + accepted terms.
 * All 4 fields are required for a successful submit. In addition to the empty
 * check, the submit branch checks that `password === passwordConfirm`, mirroring
 * the "typed twice" real-world flow. When the mismatch fires it is reported as
 * `passwordConfirm` in the validation error's missingFieldIds.
 */
export const buildSignupForm: FormRender<'signup'> = (args) => {
  const values = new Map<string, string>();
  values.set('email', args.email ?? '');
  values.set('password', args.password ?? '');
  values.set('passwordConfirm', args.passwordConfirm ?? '');
  values.set('acceptedTerms', args.acceptedTerms ? 'on' : '');

  let currentError = '';
  const errorRegion = buildErrorRegion(args.formId, currentError);

  const form = createNode('form', {
    attrs: {
      class: 'form form-signup',
      role: 'form',
      'aria-label': 'Signup form',
      'data-form-id': args.formId,
    },
  });
  appendChild(
    form,
    createNode('h2', {
      attrs: { id: `${args.formId}-title`, class: 'form-title' },
      text: 'Create your account',
    }),
  );

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
      autoComplete: 'new-password',
      onInput: (v) => values.set('password', v),
    }),
  );
  appendChild(
    form,
    buildField({
      id: 'passwordConfirm',
      label: 'Confirm password',
      type: 'password',
      value: args.passwordConfirm ?? '',
      required: true,
      autoComplete: 'new-password',
      onInput: (v) => values.set('passwordConfirm', v),
    }),
  );
  appendChild(
    form,
    buildCheckbox({
      id: 'acceptedTerms',
      label: 'I accept the terms of service',
      checked: args.acceptedTerms ?? false,
      required: true,
      onChange: (checked) => values.set('acceptedTerms', checked ? 'on' : ''),
    }),
  );

  appendChild(
    form,
    buildSubmitButton({
      formId: args.formId,
      label: 'Sign up',
      onClick: () => {
        const missing: string[] = [];
        if (!values.get('email')) missing.push('email');
        if (!values.get('password')) missing.push('password');
        if (!values.get('passwordConfirm')) missing.push('passwordConfirm');
        if (!values.get('acceptedTerms')) missing.push('acceptedTerms');
        // mismatch counts as a missing confirmation for the callback contract.
        if (
          missing.length === 0 &&
          values.get('password') !== values.get('passwordConfirm')
        ) {
          missing.push('passwordConfirm');
        }
        if (missing.length > 0) {
          currentError = `Please fix: ${missing.join(', ')}`;
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
