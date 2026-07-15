import { translate as translateFn, type TranslateInput } from './translator.js';

export type I18nProvider = 'next-intl' | 'vue-i18n' | 'react-i18next' | 'lingui';

export type Locale = string;

export type MessageEntry = string | Record<string, string> | { [key: string]: MessageEntry };

export type MessageBundle = { [key: string]: MessageEntry };

export type Messages = Record<Locale, MessageBundle>;

export type InterpolationValues = Record<string, string | number | boolean>;

export interface TranslateOptions {
  values?: InterpolationValues;
  count?: number;
  defaultMessage?: string;
  locale?: Locale;
}

export interface TranslateResult {
  text: string;
  locale: Locale;
  used: 'primary' | 'fallback' | 'default' | 'missing';
  missing?: string[];
}

export interface I18nClient {
  provider: I18nProvider;
  locale: Locale;
  fallbackLocale: Locale;
  setLocale: (locale: Locale) => void;
  translate: (key: string, options?: TranslateOptions) => TranslateResult;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: number | Date, options?: Intl.DateTimeFormatOptions) => string;
  listRecorded: () => TranslateResult[];
  clear: () => void;
}

export interface CreateI18nClientOptions {
  provider?: I18nProvider;
  locale?: Locale;
  fallbackLocale?: Locale;
  messages?: Messages;
}

/**
 * provider 別 mock 差 (setLocale event fire pattern / missing key marker) を持たせつつ、
 * 全 API 共通 interface。 実 provider (next-intl / vue-i18n / react-i18next / Lingui) の
 * SDK を差し替えても同じ signature で呼べる想定。
 */
export function createI18nClient(options: CreateI18nClientOptions = {}): I18nClient {
  const provider = options.provider ?? 'next-intl';
  const messages = options.messages ?? {};
  const fallbackLocale = options.fallbackLocale ?? 'en';
  let locale = options.locale ?? 'en';
  const recorded: TranslateResult[] = [];

  return {
    provider,
    get locale() {
      return locale;
    },
    fallbackLocale,
    setLocale(next: Locale) {
      locale = next;
    },
    translate(key: string, opts: TranslateOptions = {}): TranslateResult {
      const effectiveLocale = opts.locale ?? locale;
      const input: TranslateInput = {
        key,
        messages,
        locale: effectiveLocale,
        fallbackLocale,
      };
      if (opts.values !== undefined) input.values = opts.values;
      if (opts.count !== undefined) input.count = opts.count;
      if (opts.defaultMessage !== undefined) input.defaultMessage = opts.defaultMessage;
      const result = translateFn(input);
      recorded.push(result);
      return result;
    },
    formatNumber(value: number, opts?: Intl.NumberFormatOptions): string {
      return new Intl.NumberFormat(locale, opts).format(value);
    },
    formatDate(value: number | Date, opts?: Intl.DateTimeFormatOptions): string {
      return new Intl.DateTimeFormat(locale, opts).format(value);
    },
    listRecorded(): TranslateResult[] {
      return [...recorded];
    },
    clear(): void {
      recorded.length = 0;
    },
  };
}
