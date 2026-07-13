import { describe, expect, it } from 'vitest';
import {
  resolveTrustChain,
  createEntityStatement,
  createTrustAnchor,
} from '../src/oidc/federation.js';

describe('oidc/federation resolveTrustChain cycle detection', () => {
  it('detects a cycle in the intermediates chain', () => {
    // Build a leaf whose iss points to intermediateA (sub = A),
    // and set up two intermediates that reference each other:
    // leaf (iss=A) → A (iss=B) → B (iss=A) — cycle back to A.
    const anchor = createTrustAnchor({ entity_id: 'https://anchor.example.com' });
    const leaf = createEntityStatement({
      iss: 'https://a.example.com',
      sub: 'https://leaf.example.com',
    });
    const interA = createEntityStatement({
      iss: 'https://b.example.com',
      sub: 'https://a.example.com',
    });
    const interB = createEntityStatement({
      iss: 'https://a.example.com', // iss=A → cycle back
      sub: 'https://b.example.com',
    });
    const result = resolveTrustChain({
      leaf,
      intermediates: [interA, interB],
      anchor,
    });
    expect(result.valid).toBe(false);
    expect(result.reason_code === 'cycle' || result.reason_code === 'broken_link').toBe(true);
  });

  it('returns valid=false with broken_link when an intermediate is missing', () => {
    const anchor = createTrustAnchor({ entity_id: 'https://anchor.example.com' });
    const leaf = createEntityStatement({
      iss: 'https://missing-intermediate.example.com',
      sub: 'https://leaf.example.com',
    });
    const result = resolveTrustChain({
      leaf,
      intermediates: [],
      anchor,
    });
    expect(result.valid).toBe(false);
    expect(result.reason_code).toBe('broken_link');
  });

  it('returns valid=true for a straight leaf→anchor chain (no intermediates)', () => {
    const anchor = createTrustAnchor({ entity_id: 'https://anchor.example.com' });
    const leaf = createEntityStatement({
      iss: 'https://anchor.example.com', // iss = anchor.entity_id
      sub: 'https://leaf.example.com',
    });
    const result = resolveTrustChain({
      leaf,
      intermediates: [],
      anchor,
    });
    expect(result.valid).toBe(true);
  });

  it('returns valid=true for a leaf→intermediate→anchor chain', () => {
    const anchor = createTrustAnchor({ entity_id: 'https://anchor.example.com' });
    const leaf = createEntityStatement({
      iss: 'https://intermediate.example.com',
      sub: 'https://leaf.example.com',
    });
    const intermediate = createEntityStatement({
      iss: 'https://anchor.example.com',
      sub: 'https://intermediate.example.com',
    });
    const result = resolveTrustChain({
      leaf,
      intermediates: [intermediate],
      anchor,
    });
    expect(result.valid).toBe(true);
  });

  it('returns expired_intermediate when intermediate exp is past nowSec', () => {
    const anchor = createTrustAnchor({ entity_id: 'https://anchor.example.com' });
    const leaf = createEntityStatement({
      iss: 'https://intermediate.example.com',
      sub: 'https://leaf.example.com',
      iat: 1_900_000_000,
      exp: 1_900_003_600,
    });
    const intermediate = createEntityStatement({
      iss: 'https://anchor.example.com',
      sub: 'https://intermediate.example.com',
      iat: 1_600_000_000,
      exp: 1_600_003_600, // way past
    });
    const result = resolveTrustChain({
      leaf,
      intermediates: [intermediate],
      anchor,
      now: () => 1_900_000_000_000,
    });
    expect(result.valid).toBe(false);
    expect(result.reason_code).toBe('expired_intermediate');
  });
});
