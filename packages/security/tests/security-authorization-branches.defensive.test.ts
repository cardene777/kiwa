import { describe, expect, it } from 'vitest';
import { evaluateAbac } from '../src/authorization.js';

describe('evaluateAbac combining algorithm branches', () => {
  it('deny-overrides falls to permit when only permit rules match', () => {
    const result = evaluateAbac(
      {
        algorithm: 'deny-overrides',
        rules: [
          { id: 'p1', effect: 'permit', condition: () => true },
          { id: 'p2', effect: 'permit', condition: () => false },
        ],
      },
      { subject: {}, resource: {}, action: 'read', environment: {} },
    );
    expect(result.effect).toBe('permit');
    expect(result.matchedRule).toBe('p1');
    expect(result.reason).toContain('deny-overrides falls to permit');
  });

  it('deny-overrides returns deny when no rule matches', () => {
    const result = evaluateAbac(
      {
        algorithm: 'deny-overrides',
        rules: [
          { id: 'r1', effect: 'permit', condition: () => false },
        ],
      },
      { subject: {}, resource: {}, action: 'read', environment: {} },
    );
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBeNull();
  });

  it('permit-overrides falls to deny when only deny rules match', () => {
    const result = evaluateAbac(
      {
        algorithm: 'permit-overrides',
        rules: [
          { id: 'd1', effect: 'deny', condition: () => true },
          { id: 'p1', effect: 'permit', condition: () => false },
        ],
      },
      { subject: {}, resource: {}, action: 'read', environment: {} },
    );
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBe('d1');
    expect(result.reason).toContain('permit-overrides falls to deny');
  });

  it('permit-overrides returns deny when no rule matches', () => {
    const result = evaluateAbac(
      {
        algorithm: 'permit-overrides',
        rules: [
          { id: 'r1', effect: 'permit', condition: () => false },
        ],
      },
      { subject: {}, resource: {}, action: 'read', environment: {} },
    );
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBeNull();
  });

  it('first-applicable returns first matched effect (deny)', () => {
    const result = evaluateAbac(
      {
        algorithm: 'first-applicable',
        rules: [
          { id: 'd1', effect: 'deny', condition: () => true },
          { id: 'p1', effect: 'permit', condition: () => true },
        ],
      },
      { subject: {}, resource: {}, action: 'read', environment: {} },
    );
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBe('d1');
  });

  it('first-applicable returns deny when no rule matches', () => {
    const result = evaluateAbac(
      {
        algorithm: 'first-applicable',
        rules: [
          { id: 'r1', effect: 'permit', condition: () => false },
        ],
      },
      { subject: {}, resource: {}, action: 'read', environment: {} },
    );
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBeNull();
  });
});
