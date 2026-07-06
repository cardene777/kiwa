// Narrow ambient declaration for the `jsdom` peerDep used by the N3
// cross-realm regression test. `@types/jsdom` is intentionally NOT a devDep
// of this package (jsdom is only a runtime peer of the harness). This file
// records the tiny type surface the test needs so tsc pre-build (see
// `tsconfig.vitest.json`) accepts the dynamic import.
declare module 'jsdom' {
  export class JSDOM {
    constructor(html: string, options?: { url?: string });
    window: { document: Document };
  }
}
