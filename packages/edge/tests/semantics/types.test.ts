import { describe, expect, it } from 'vitest';
import {
  platformEventName,
  type EdgePlatform,
  type NeutralEventName,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('platformEventName — unknown neutral event falls back to neutral name', () => {
  it.each(platforms)('%s: unrecognised neutral event returns the neutral string unchanged', (platform) => {
    // Every existing runtime caller passes a neutral key that is present in
    // the dialect map. The `?? neutral` fallback keeps the map partial-safe
    // when a new neutral event is added but a per-platform entry hasn't been
    // filled in yet — this test pins that behavior.
    const neutral = 'not-in-dialect-map' as NeutralEventName;
    expect(platformEventName(platform, neutral)).toBe(neutral);
  });
});
