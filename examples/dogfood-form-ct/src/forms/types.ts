import type { ComponentRender } from '@kiwa/component';

/**
 * Provider-neutral form contract — every form renders through a `ComponentRender`
 * function (framework agnostic `(args) => MockNode`) so the mock adapter
 * (`@kiwa/component` `createPlaywrightCTMock`) and the real adapter
 * (`@playwright/experimental-ct-react` when `PW_CT_ENDPOINT` is set) drive the
 * same 4 assertions — mount / validation error / submit success / a11y violation
 * count = 0.
 *
 * The 5 form patterns exercised are the SaaS default set — login / signup /
 * checkout / profile / search. Each has 1 required field + at least 1 optional
 * field, a submit handler, and a validation branch that keeps the submit from
 * firing while any required field is empty (the CT flow asserts the validation
 * error state before the successful submit).
 */

/** Result recorded on a successful submit — passed to `onSubmit`. */
export interface FormSubmitPayload {
  formId: string;
  values: Record<string, string>;
}

/** Result recorded when the submit is blocked by validation. */
export interface FormValidationError {
  formId: string;
  missingFieldIds: string[];
}

/** args shared by every form fixture — the runtime callbacks + label overrides. */
export interface FormBaseArgs {
  formId: string;
  onSubmit?: (payload: FormSubmitPayload) => void;
  onValidationError?: (err: FormValidationError) => void;
}

// ---- Login ----

export interface LoginFormArgs extends FormBaseArgs {
  email?: string;
  password?: string;
  rememberMe?: boolean;
}

// ---- Signup ----

export interface SignupFormArgs extends FormBaseArgs {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  acceptedTerms?: boolean;
}

// ---- Checkout ----

export interface CheckoutFormArgs extends FormBaseArgs {
  fullName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  cardNumber?: string;
}

// ---- Profile ----

export interface ProfileFormArgs extends FormBaseArgs {
  displayName?: string;
  bio?: string;
  websiteUrl?: string;
}

// ---- Search ----

export interface SearchFormArgs extends FormBaseArgs {
  query?: string;
  filterCategory?: string;
}

/** All 5 form arg unions, keyed by form kind. */
export type FormArgsMap = {
  login: LoginFormArgs;
  signup: SignupFormArgs;
  checkout: CheckoutFormArgs;
  profile: ProfileFormArgs;
  search: SearchFormArgs;
};

export type FormKind = keyof FormArgsMap;

/** Type alias so form modules can express `ComponentRender<TArgs>` succinctly. */
export type FormRender<K extends FormKind> = ComponentRender<FormArgsMap[K]>;
