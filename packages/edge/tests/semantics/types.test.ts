import { describe, expect, it } from 'vitest';
import {
  platformEventName,
  type EdgePlatform,
  type NeutralEventName,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('platformEventName — unknown neutral event falls back to neutral name', () => {
  it.each(platforms)('%s: unrecognised neutral event returns the neutral string unchanged', (platform) => {
    // The dialect map is typed `Partial<Record<NeutralEventName, string>>`, so
    // adding a new neutral event to the union does not force every per-platform
    // sub-map to be updated at the same time. The `?? neutral` fallback keeps
    // that partial-map safe: unmapped neutral events surface with their
    // vendor-neutral name instead of undefined. Reaching the fallback from a
    // type-safe caller is not possible today (every neutral in the union has an
    // entry in every platform sub-map), so this test bypasses the type via
    // `as NeutralEventName` to exercise the runtime branch that keeps future
    // partial-map states safe.
    const neutral = 'not-in-dialect-map' as NeutralEventName;
    expect(platformEventName(platform, neutral)).toBe(neutral);
  });
});
