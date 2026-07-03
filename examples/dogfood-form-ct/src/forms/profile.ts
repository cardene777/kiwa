import { appendChild, createNode } from '@kiwa-test/component';
import {
  buildErrorRegion,
  buildField,
  buildSubmitButton,
  buildTextArea,
} from './builders.js';
import type { FormRender, ProfileFormArgs } from './types.js';

/**
 * Profile form — displayName (required) + bio (optional textarea) + websiteUrl
 * (optional URL). URL validation runs when the value is non-empty; malformed
 * URLs go back through the same `onValidationError` path as missing required
 * fields. This is the only form with an optional URL — the CT flow exercises
 * both the "valid submit" case and the "malformed URL rejected" case.
 */
export const buildProfileForm: FormRender<'profile'> = (args) => {
  const values = new Map<string, string>();
  values.set('displayName', args.displayName ?? '');
  values.set('bio', args.bio ?? '');
  values.set('websiteUrl', args.websiteUrl ?? '');

  let currentError = '';
  const errorRegion = buildErrorRegion(args.formId, currentError);

  const form = createNode('form', {
    attrs: {
      class: 'form form-profile',
      role: 'form',
      'aria-label': 'Profile form',
      'data-form-id': args.formId,
    },
  });
  appendChild(
    form,
    createNode('h2', {
      attrs: { id: `${args.formId}-title`, class: 'form-title' },
      text: 'Edit profile',
    }),
  );

  appendChild(
    form,
    buildField({
      id: 'displayName',
      label: 'Display name',
      type: 'text',
      value: args.displayName ?? '',
      required: true,
      autoComplete: 'nickname',
      onInput: (v) => values.set('displayName', v),
    }),
  );
  appendChild(
    form,
    buildTextArea({
      id: 'bio',
      label: 'Bio',
      value: args.bio ?? '',
      placeholder: 'Tell people about yourself',
      onInput: (v) => values.set('bio', v),
    }),
  );
  appendChild(
    form,
    buildField({
      id: 'websiteUrl',
      label: 'Website',
      type: 'url',
      value: args.websiteUrl ?? '',
      autoComplete: 'url',
      placeholder: 'https://example.com',
      onInput: (v) => values.set('websiteUrl', v),
    }),
  );

  appendChild(
    form,
    buildSubmitButton({
      formId: args.formId,
      label: 'Save profile',
      onClick: () => {
        const missing: string[] = [];
        if (!values.get('displayName')) missing.push('displayName');
        const url = values.get('websiteUrl') ?? '';
        if (url && !isLikelyUrl(url)) {
          missing.push('websiteUrl');
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

/** Small non-crypto URL sanity check — good enough for a client-side form.
 *  Real validation happens server-side, but the CT flow needs a deterministic
 *  branch to prove the malformed URL rejection path fires. */
function isLikelyUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+$/.test(value);
}
