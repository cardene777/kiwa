/**
 * App-side tool implementations. Kept deliberately dead simple so real vs
 * mock fidelity measures the model's *tool-call pattern* (schema shape +
 * ordering + parallelism) rather than the tool implementation details.
 *
 * All executors are synchronous today but are wrapped in `Promise` so the
 * agent loop can await them uniformly with async tools in the future.
 */

/** Weather executor — deterministic canned JSON per location. */
export async function executeWeatherTool(args: Record<string, unknown>): Promise<string> {
  const location = typeof args['location'] === 'string' ? args['location'] : 'Unknown';
  const canned: Record<string, { temp_c: number; humidity_pct: number; sky: string }> = {
    Tokyo: { temp_c: 22, humidity_pct: 65, sky: 'clear' },
    Washington: { temp_c: 24, humidity_pct: 58, sky: 'partly cloudy' },
    'Washington DC': { temp_c: 24, humidity_pct: 58, sky: 'partly cloudy' },
    'New York': { temp_c: 20, humidity_pct: 62, sky: 'overcast' },
    London: { temp_c: 15, humidity_pct: 70, sky: 'rain' },
  };
  const hit = canned[location] ?? { temp_c: 18, humidity_pct: 60, sky: 'clear' };
  return JSON.stringify({ location, ...hit });
}

/** Calculator executor — safe subset of arithmetic operators only. */
export async function executeCalculatorTool(args: Record<string, unknown>): Promise<string> {
  const expression = typeof args['expression'] === 'string' ? args['expression'] : '';
  return String(evalSafeArithmetic(expression));
}

/** Search executor — matches the query against a tiny canned index. */
export async function executeSearchTool(args: Record<string, unknown>): Promise<string> {
  const query = typeof args['query'] === 'string' ? args['query'].toLowerCase() : '';
  const index = [
    { title: 'Typhoon Nari approaches Kanto region', tags: ['typhoon', 'japan', 'weather'] },
    { title: 'Fed signals holding rates through Q3', tags: ['fed', 'rates', 'us'] },
    { title: 'Robotics conference in Tokyo attracts 12000 attendees', tags: ['robot', 'tokyo', 'ai'] },
    { title: 'New AI safety benchmark released', tags: ['ai', 'safety'] },
    { title: 'Weather anomaly across the Pacific coast', tags: ['weather', 'pacific'] },
  ];
  const hits = index
    .filter((entry) => entry.tags.some((tag) => query.includes(tag)) || entry.title.toLowerCase().includes(query))
    .slice(0, 3)
    .map((entry) => entry.title);
  return JSON.stringify(hits.length > 0 ? hits : ['no results']);
}

/**
 * Central dispatch used by the adapter tool loop. Unknown tools return a
 * distinct message so the model's error handling shows up in the trace.
 */
export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  if (name === 'get_weather') return executeWeatherTool(args);
  if (name === 'calculator') return executeCalculatorTool(args);
  if (name === 'search') return executeSearchTool(args);
  return `unknown tool ${name}`;
}

/** Safe arithmetic — refuses anything outside the operator whitelist. */
function evalSafeArithmetic(expression: string): number {
  if (!/^[\s0-9+\-*/().]+$/.test(expression)) return NaN;
  // eslint-disable-next-line no-new-func
  const fn = new Function(`return (${expression});`) as () => number;
  try {
    const v = fn();
    return typeof v === 'number' && Number.isFinite(v) ? v : NaN;
  } catch {
    return NaN;
  }
}
