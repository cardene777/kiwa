import type {
  InterpolationValues,
  Locale,
  MessageBundle,
  MessageEntry,
  Messages,
  TranslateResult,
} from './client.js';
import { interpolate } from './interpolate.js';
import { selectPlural } from './plural.js';

export interface TranslateInput {
  key: string;
  messages: Messages;
  locale: Locale;
  fallbackLocale: Locale;
  values?: InterpolationValues;
  count?: number;
  defaultMessage?: string;
}

/**
 * translation lookup + fallback + pluralization + interpolation の統合 entry。
 * 実 provider の t() / $t() / gettext() を差し替えても同じ signature で呼べる想定。
 */
export function translate(input: TranslateInput): TranslateResult {
  const { key, messages, locale, fallbackLocale, values, count, defaultMessage } = input;
  const primaryBundle = messages[locale];
  const fallbackBundle = messages[fallbackLocale];

  const primaryEntry = primaryBundle ? lookupEntry(primaryBundle, key) : undefined;
  if (primaryEntry !== undefined) {
    const text = resolveEntry(primaryEntry, locale, count, values);
    return { text, locale, used: 'primary' };
  }

  const fallbackEntry = fallbackBundle ? lookupEntry(fallbackBundle, key) : undefined;
  if (fallbackEntry !== undefined) {
    const text = resolveEntry(fallbackEntry, fallbackLocale, count, values);
    return { text, locale: fallbackLocale, used: 'fallback' };
  }

  if (defaultMessage !== undefined) {
    const text = values ? interpolate(defaultMessage, values).text : defaultMessage;
    return { text, locale, used: 'default' };
  }

  return { text: key, locale, used: 'missing', missing: [key] };
}

function lookupEntry(bundle: MessageBundle, key: string): MessageEntry | undefined {
  if (key in bundle) return bundle[key];
  const parts = key.split('.');
  if (parts.length <= 1) return undefined;
  let cur: unknown = bundle;
  for (const p of parts) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  if (typeof cur === 'string') return cur;
  if (typeof cur === 'object' && cur !== null) return cur as MessageEntry;
  return undefined;
}

function resolveEntry(
  entry: MessageEntry,
  locale: Locale,
  count: number | undefined,
  values: InterpolationValues | undefined,
): string {
  let text: string;
  if (typeof entry === 'string') {
    text = entry;
  } else {
    const category = selectPlural(locale, count ?? 0);
    const record = entry as Record<string, string>;
    const candidate =
      (typeof record[category] === 'string' ? record[category] : undefined) ??
      (typeof record.other === 'string' ? record.other : undefined) ??
      (typeof record.one === 'string' ? record.one : undefined);
    if (candidate !== undefined) {
      text = candidate;
    } else {
      const firstString = Object.values(record).find((v) => typeof v === 'string') as
        | string
        | undefined;
      text = firstString ?? '';
    }
  }
  const effectiveValues: InterpolationValues = { ...(values ?? {}) };
  if (count !== undefined && !('count' in effectiveValues)) effectiveValues.count = count;
  return interpolate(text, effectiveValues).text;
}
