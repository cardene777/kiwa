import { appendChild, createNode } from '@kiwa-test/component';
import {
  buildErrorRegion,
  buildField,
  buildSelect,
  buildSubmitButton,
} from './builders.js';
import type { FormRender } from './types.js';

/**
 * Search form — a single required query text input + an optional filter
 * category select. The submit path treats blank queries as a validation error
 * (missing `query`) so the CT flow can assert the same 4 outcomes as the other
 * 4 forms — mount / validation error / submit success / a11y violation = 0.
 */
export const buildSearchForm: FormRender<'search'> = (args) => {
  const values = new Map<string, string>();
  values.set('query', args.query ?? '');
  values.set('filterCategory', args.filterCategory ?? 'all');

  let currentError = '';
  const errorRegion = buildErrorRegion(args.formId, currentError);

  const form = createNode('form', {
    attrs: {
      class: 'form form-search',
      role: 'search',
      'aria-label': 'Search',
      'data-form-id': args.formId,
    },
  });
  appendChild(
    form,
    createNode('h2', {
      attrs: { id: `${args.formId}-title`, class: 'form-title' },
      text: 'Find something',
    }),
  );

  appendChild(
    form,
    buildField({
      id: 'query',
      label: 'Search',
      type: 'search',
      value: args.query ?? '',
      required: true,
      autoComplete: 'off',
      placeholder: 'Search products',
      onInput: (v) => values.set('query', v),
    }),
  );
  appendChild(
    form,
    buildSelect({
      id: 'filterCategory',
      label: 'Category',
      value: args.filterCategory ?? 'all',
      options: [
        { value: 'all', label: 'All categories' },
        { value: 'books', label: 'Books' },
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
      ],
      onChange: (v) => values.set('filterCategory', v),
    }),
  );

  appendChild(
    form,
    buildSubmitButton({
      formId: args.formId,
      label: 'Search',
      onClick: () => {
        const missing: string[] = [];
        if (!values.get('query')) missing.push('query');
        if (missing.length > 0) {
          currentError = `Please enter: ${missing.join(', ')}`;
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
