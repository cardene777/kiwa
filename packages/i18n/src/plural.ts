export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

export interface PluralRule {
  locale: string;
  category: PluralCategory;
  count: number;
}

/**
 * Intl.PluralRules 経由で count に対する plural category を返す。 実 provider の
 * pluralization rule (CLDR SSOT) を差し替えても同じ signature で呼べる想定。
 * 失敗時は 'other' を返す (safe default)。
 */
export function selectPlural(locale: string, count: number): PluralCategory {
  try {
    const rules = new Intl.PluralRules(locale);
    return rules.select(count) as PluralCategory;
  } catch {
    return 'other';
  }
}
