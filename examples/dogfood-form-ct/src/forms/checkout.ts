import { appendChild, createNode } from '@kiwa-lab/component';
import {
  buildErrorRegion,
  buildField,
  buildSubmitButton,
} from './builders.js';
import type { FormRender } from './types.js';

/**
 * Checkout form — 5 required fields (fullName / address / city / postalCode /
 * cardNumber). Card number is validated as digits-only 12-19 chars (a permissive
 * subset of ISO/IEC 7812 PAN spec) so the CT flow exercises 3 outcomes —
 * missing-required, malformed card number, successful submit.
 */
export const buildCheckoutForm: FormRender<'checkout'> = (args) => {
  const values = new Map<string, string>();
  values.set('fullName', args.fullName ?? '');
  values.set('address', args.address ?? '');
  values.set('city', args.city ?? '');
  values.set('postalCode', args.postalCode ?? '');
  values.set('cardNumber', args.cardNumber ?? '');

  let currentError = '';
  const errorRegion = buildErrorRegion(args.formId, currentError);

  const form = createNode('form', {
    attrs: {
      class: 'form form-checkout',
      role: 'form',
      'aria-label': 'Checkout form',
      'data-form-id': args.formId,
    },
  });
  appendChild(
    form,
    createNode('h2', {
      attrs: { id: `${args.formId}-title`, class: 'form-title' },
      text: 'Complete your order',
    }),
  );

  appendChild(
    form,
    buildField({
      id: 'fullName',
      label: 'Full name',
      type: 'text',
      value: args.fullName ?? '',
      required: true,
      autoComplete: 'name',
      onInput: (v) => values.set('fullName', v),
    }),
  );
  appendChild(
    form,
    buildField({
      id: 'address',
      label: 'Street address',
      type: 'text',
      value: args.address ?? '',
      required: true,
      autoComplete: 'street-address',
      onInput: (v) => values.set('address', v),
    }),
  );
  appendChild(
    form,
    buildField({
      id: 'city',
      label: 'City',
      type: 'text',
      value: args.city ?? '',
      required: true,
      autoComplete: 'address-level2',
      onInput: (v) => values.set('city', v),
    }),
  );
  appendChild(
    form,
    buildField({
      id: 'postalCode',
      label: 'Postal code',
      type: 'text',
      value: args.postalCode ?? '',
      required: true,
      autoComplete: 'postal-code',
      onInput: (v) => values.set('postalCode', v),
    }),
  );
  appendChild(
    form,
    buildField({
      id: 'cardNumber',
      label: 'Card number',
      type: 'text',
      value: args.cardNumber ?? '',
      required: true,
      autoComplete: 'cc-number',
      onInput: (v) => values.set('cardNumber', v),
    }),
  );

  appendChild(
    form,
    buildSubmitButton({
      formId: args.formId,
      label: 'Pay',
      onClick: () => {
        const missing: string[] = [];
        for (const key of ['fullName', 'address', 'city', 'postalCode', 'cardNumber']) {
          if (!values.get(key)) missing.push(key);
        }
        // even when populated the card number must be numeric and 12-19 digits
        // long — a common gate before invoking a payment gateway. Report a
        // malformed number as `cardNumber` in missingFieldIds so the caller
        // can highlight the same field the user just typed into.
        const card = values.get('cardNumber') ?? '';
        if (card && !/^\d{12,19}$/.test(card)) {
          if (!missing.includes('cardNumber')) missing.push('cardNumber');
        }
        if (missing.length > 0) {
          currentError = `Missing or invalid: ${missing.join(', ')}`;
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
