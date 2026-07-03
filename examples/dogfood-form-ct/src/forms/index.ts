import { buildCheckoutForm } from './checkout.js';
import { buildLoginForm } from './login.js';
import { buildProfileForm } from './profile.js';
import { buildSearchForm } from './search.js';
import { buildSignupForm } from './signup.js';
import type { FormArgsMap, FormKind, FormRender } from './types.js';

/** Canonical 5 form kinds — the CT flow iterates this array so the count stays
 *  wired into the SSOT. */
export const FORM_KINDS: readonly FormKind[] = [
  'login',
  'signup',
  'checkout',
  'profile',
  'search',
] as const;

/** Bundle each form kind with its renderer + a default args factory so the
 *  adapters can drive them uniformly by name.
 *
 *  Each entry carries three shapes — `mountArgs` (the neutral first mount,
 *  every required field empty), `validationArgs` (leaves at least 1 required
 *  field empty so the submit path fires `onValidationError`), and
 *  `submitArgs` (every required field populated with valid values so the
 *  submit path fires `onSubmit`). The CT flow drives all 3 in sequence for
 *  each form to make the 4 axes measurable end-to-end.
 */
export type FormSpec<K extends FormKind> = {
  kind: K;
  render: FormRender<K>;
  mountArgs: () => FormArgsMap[K];
  validationArgs: () => FormArgsMap[K];
  submitArgs: () => FormArgsMap[K];
};

/** All 5 specs. Wrapping each renderer here keeps the CT flow implementation
 *  short — no per-form conditional inside the flow module. */
export const FORM_SPECS: {
  [K in FormKind]: FormSpec<K>;
} = {
  login: {
    kind: 'login',
    render: buildLoginForm,
    mountArgs: () => ({ formId: 'login-mount' }),
    validationArgs: () => ({
      formId: 'login-validation',
      email: 'user@example.com',
      // password intentionally missing so the submit reports missing=['password']
    }),
    submitArgs: () => ({
      formId: 'login-submit',
      email: 'user@example.com',
      password: 'hunter2!',
      rememberMe: true,
    }),
  },
  signup: {
    kind: 'signup',
    render: buildSignupForm,
    mountArgs: () => ({ formId: 'signup-mount' }),
    validationArgs: () => ({
      formId: 'signup-validation',
      email: 'user@example.com',
      password: 'hunter2!',
      // passwordConfirm mismatch — triggers 'passwordConfirm' in missing
      passwordConfirm: 'hunter2?',
      acceptedTerms: true,
    }),
    submitArgs: () => ({
      formId: 'signup-submit',
      email: 'user@example.com',
      password: 'hunter2!',
      passwordConfirm: 'hunter2!',
      acceptedTerms: true,
    }),
  },
  checkout: {
    kind: 'checkout',
    render: buildCheckoutForm,
    mountArgs: () => ({ formId: 'checkout-mount' }),
    validationArgs: () => ({
      formId: 'checkout-validation',
      fullName: 'Ada Lovelace',
      address: '10 Downing Street',
      city: 'London',
      postalCode: 'SW1A 2AA',
      // malformed card number — triggers 'cardNumber' in missing
      cardNumber: 'abc',
    }),
    submitArgs: () => ({
      formId: 'checkout-submit',
      fullName: 'Ada Lovelace',
      address: '10 Downing Street',
      city: 'London',
      postalCode: 'SW1A 2AA',
      cardNumber: '4242424242424242',
    }),
  },
  profile: {
    kind: 'profile',
    render: buildProfileForm,
    mountArgs: () => ({ formId: 'profile-mount' }),
    validationArgs: () => ({
      formId: 'profile-validation',
      displayName: 'Ada',
      bio: 'Mathematician.',
      // malformed URL — triggers 'websiteUrl' in missing
      websiteUrl: 'not-a-real-url',
    }),
    submitArgs: () => ({
      formId: 'profile-submit',
      displayName: 'Ada',
      bio: 'Mathematician.',
      websiteUrl: 'https://ada.example.com',
    }),
  },
  search: {
    kind: 'search',
    render: buildSearchForm,
    mountArgs: () => ({ formId: 'search-mount' }),
    validationArgs: () => ({
      formId: 'search-validation',
      // query left empty → missing=['query']
      filterCategory: 'books',
    }),
    submitArgs: () => ({
      formId: 'search-submit',
      query: 'introduction to computing',
      filterCategory: 'books',
    }),
  },
} as const;

export { buildCheckoutForm } from './checkout.js';
export { buildLoginForm } from './login.js';
export { buildProfileForm } from './profile.js';
export { buildSearchForm } from './search.js';
export { buildSignupForm } from './signup.js';
export type {
  CheckoutFormArgs,
  FormArgsMap,
  FormBaseArgs,
  FormKind,
  FormSubmitPayload,
  FormValidationError,
  LoginFormArgs,
  ProfileFormArgs,
  SearchFormArgs,
  SignupFormArgs,
} from './types.js';
