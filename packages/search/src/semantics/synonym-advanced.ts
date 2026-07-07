import { providerEventName, type AxisStep, type SearchTarget } from './types.js';

export type SynonymState =
  | 'idle'
  | 'multilang-expanded'
  | 'phonetic-matched'
  | 'stemmer-normalized'
  | 'typo-bridged';

export type Language = 'en' | 'ja' | 'fr' | 'de' | 'es';

export interface SynonymEntry {
  base: string;
  synonyms: string[];
  language: Language;
}

export interface SynonymSession {
  target: SearchTarget;
  indexId: string;
  entries: SynonymEntry[];
  activeLanguage: Language;
  state: SynonymState;
  history: AxisStep<SynonymState>[];
}

export function startSynonymSession(input: {
  target: SearchTarget;
  indexId: string;
  activeLanguage?: Language;
}): SynonymSession {
  if (input.indexId.length === 0) {
    throw new Error('startSynonymSession: indexId must not be empty');
  }
  return {
    target: input.target,
    indexId: input.indexId,
    entries: [],
    activeLanguage: input.activeLanguage ?? 'en',
    state: 'idle',
    history: [],
  };
}

export function registerSynonyms(session: SynonymSession, entries: SynonymEntry[]): void {
  for (const e of entries) {
    session.entries.push({ base: e.base, synonyms: [...e.synonyms], language: e.language });
  }
}

export function expandMultiLanguage(
  session: SynonymSession,
  input: { query: string; languages: Language[] },
): { step: AxisStep<SynonymState>; expanded: string[] } {
  if (input.query.length === 0) {
    throw new Error('expandMultiLanguage: query must not be empty');
  }
  if (input.languages.length === 0) {
    throw new Error('expandMultiLanguage: languages must not be empty');
  }
  const expanded = new Set<string>([input.query.toLowerCase()]);
  for (const entry of session.entries) {
    if (!input.languages.includes(entry.language)) continue;
    if (entry.base.toLowerCase() === input.query.toLowerCase()) {
      for (const s of entry.synonyms) expanded.add(s.toLowerCase());
    } else if (entry.synonyms.some((s) => s.toLowerCase() === input.query.toLowerCase())) {
      expanded.add(entry.base.toLowerCase());
      for (const s of entry.synonyms) expanded.add(s.toLowerCase());
    }
  }
  session.state = 'multilang-expanded';
  const step = emit(session, 'synonym.multi_language_expanded', {
    original: input.query,
    languages: input.languages.join(','),
    expandedCount: expanded.size,
  });
  return { step, expanded: [...expanded] };
}

export function matchPhonetic(
  session: SynonymSession,
  input: { query: string; candidates: string[] },
): { step: AxisStep<SynonymState>; matched: string[] } {
  const queryCode = soundex(input.query);
  const matched = input.candidates.filter((c) => soundex(c) === queryCode);
  session.state = 'phonetic-matched';
  const step = emit(session, 'synonym.phonetic_matched', {
    query: input.query,
    soundexCode: queryCode,
    matchedCount: matched.length,
  });
  return { step, matched };
}

export function normalizeStemmer(
  session: SynonymSession,
  input: { tokens: string[]; language: Language },
): { step: AxisStep<SynonymState>; normalized: string[] } {
  const normalized = input.tokens.map((t) => stemmerFor(input.language, t));
  session.state = 'stemmer-normalized';
  const step = emit(session, 'synonym.stemmer_normalized', {
    language: input.language,
    inputCount: input.tokens.length,
    normalizedCount: normalized.length,
  });
  return { step, normalized };
}

export function bridgeTypo(
  session: SynonymSession,
  input: { query: string; dictionary: string[]; maxDistance?: number },
): { step: AxisStep<SynonymState>; suggestions: Array<{ term: string; distance: number }> } {
  const max = input.maxDistance ?? 2;
  const suggestions = input.dictionary
    .map((term) => ({ term, distance: levenshtein(input.query, term) }))
    .filter((s) => s.distance > 0 && s.distance <= max)
    .sort((a, b) => a.distance - b.distance);
  session.state = 'typo-bridged';
  const step = emit(session, 'synonym.typo_bridged', {
    query: input.query,
    dictionarySize: input.dictionary.length,
    suggestionCount: suggestions.length,
    maxDistance: max,
  });
  return { step, suggestions };
}

function soundex(input: string): string {
  const s = input.toLowerCase().replace(/[^a-z]/g, '');
  if (s.length === 0) return '0000';
  const map: Record<string, string> = {
    b: '1',
    f: '1',
    p: '1',
    v: '1',
    c: '2',
    g: '2',
    j: '2',
    k: '2',
    q: '2',
    s: '2',
    x: '2',
    z: '2',
    d: '3',
    t: '3',
    l: '4',
    m: '5',
    n: '5',
    r: '6',
  };
  let code = s.charAt(0).toUpperCase();
  let prev = map[s.charAt(0)] ?? '';
  for (let i = 1; i < s.length && code.length < 4; i += 1) {
    const d = map[s.charAt(i)] ?? '';
    if (d && d !== prev) code += d;
    if (d !== '') prev = d;
    else prev = '';
  }
  return (code + '0000').slice(0, 4);
}

function stemmerFor(language: Language, token: string): string {
  const t = token.toLowerCase();
  switch (language) {
    case 'en':
      return t.replace(/(ing|ed|ly|es|s)$/, '');
    case 'de':
      return t.replace(/(en|er|es|em|s)$/, '');
    case 'fr':
      return t.replace(/(ment|eux|euse|es|s|e)$/, '');
    case 'es':
      return t.replace(/(mente|ando|iendo|ado|ido|es|s)$/, '');
    case 'ja':
      return t.replace(/(です|ます|した|ない)$/, '');
    default:
      return t;
  }
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i += 1) dp.push(new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) {
    const row = dp[i];
    if (row) row[0] = i;
  }
  const row0 = dp[0];
  if (row0) for (let j = 0; j <= n; j += 1) row0[j] = j;
  for (let i = 1; i <= m; i += 1) {
    const row = dp[i];
    const prev = dp[i - 1];
    if (!row || !prev) continue;
    for (let j = 1; j <= n; j += 1) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      row[j] = Math.min(
        (row[j - 1] ?? 0) + 1,
        (prev[j] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
  }
  return dp[m]?.[n] ?? 0;
}

function emit(
  session: SynonymSession,
  neutralEvent: AxisStep<SynonymState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<SynonymState> {
  const step: AxisStep<SynonymState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, indexId: session.indexId, ...metadata },
  };
  session.history.push(step);
  return step;
}
