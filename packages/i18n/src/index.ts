export {
  createI18nClient,
  type I18nProvider,
  type I18nClient,
  type Locale,
  type Messages,
  type MessageBundle,
  type TranslateOptions,
  type TranslateResult,
  type CreateI18nClientOptions,
} from './client.js';

export {
  translate,
  type TranslateInput,
} from './translator.js';

export {
  interpolate,
  type InterpolateResult,
} from './interpolate.js';

export {
  selectPlural,
  type PluralCategory,
  type PluralRule,
} from './plural.js';
