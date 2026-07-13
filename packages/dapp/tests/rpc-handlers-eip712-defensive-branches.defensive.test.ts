import { describe, expect, it } from 'vitest';
import { parseEip712TypedDataJson } from '../src/rpc-handlers.js';

describe('parseEip712TypedDataJson defensive branches', () => {
  it('throws parse error (-32700) on invalid JSON', () => {
    expect(() => parseEip712TypedDataJson('{not-json')).toThrow(/parse error/);
  });

  it('throws invalid params (-32602) on schema mismatch (missing types)', () => {
    const bad = JSON.stringify({
      primaryType: 'Mail',
      domain: { name: 'test', chainId: 1 },
      message: { content: 'hi' },
    });
    expect(() => parseEip712TypedDataJson(bad)).toThrow(/invalid params/);
  });

  it('accepts domain.chainId as decimal string', () => {
    const good = JSON.stringify({
      primaryType: 'Mail',
      domain: {
        name: 'MyApp',
        version: '1',
        chainId: '31337',
        verifyingContract: '0x0000000000000000000000000000000000000000',
      },
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Mail: [{ name: 'content', type: 'string' }],
      },
      message: { content: 'hello' },
    });
    const result = parseEip712TypedDataJson(good);
    expect(result.domain.chainId).toBe(31337);
  });

  it('accepts domain.chainId as hex string (0x prefix)', () => {
    const good = JSON.stringify({
      primaryType: 'Mail',
      domain: {
        name: 'MyApp',
        version: '1',
        chainId: '0x7A69',
        verifyingContract: '0x0000000000000000000000000000000000000000',
      },
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Mail: [{ name: 'content', type: 'string' }],
      },
      message: { content: 'hex-chain' },
    });
    const result = parseEip712TypedDataJson(good);
    expect(result.domain.chainId).toBe(0x7a69);
  });

  it('accepts domain.chainId as number', () => {
    const good = JSON.stringify({
      primaryType: 'Mail',
      domain: {
        name: 'MyApp',
        version: '1',
        chainId: 42,
        verifyingContract: '0x0000000000000000000000000000000000000000',
      },
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Mail: [{ name: 'content', type: 'string' }],
      },
      message: { content: 'num' },
    });
    const result = parseEip712TypedDataJson(good);
    expect(result.domain.chainId).toBe(42);
  });

  it('accepts domain with salt field', () => {
    const good = JSON.stringify({
      primaryType: 'Mail',
      domain: {
        name: 'MyApp',
        version: '1',
        chainId: 1,
        verifyingContract: '0x0000000000000000000000000000000000000000',
        salt: '0xdeadbeef',
      },
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
          { name: 'salt', type: 'bytes32' },
        ],
        Mail: [{ name: 'content', type: 'string' }],
      },
      message: { content: 'salt' },
    });
    const result = parseEip712TypedDataJson(good);
    expect(result.domain.salt).toBe('0xdeadbeef');
  });

  it('throws invalid params on non-numeric chainId string', () => {
    const bad = JSON.stringify({
      primaryType: 'Mail',
      domain: {
        name: 'MyApp',
        version: '1',
        chainId: 'not-a-number',
        verifyingContract: '0x0000000000000000000000000000000000000000',
      },
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'chainId', type: 'uint256' },
        ],
        Mail: [{ name: 'content', type: 'string' }],
      },
      message: { content: 'bad' },
    });
    expect(() => parseEip712TypedDataJson(bad)).toThrow(/chainId must be numeric|invalid params/);
  });

  it('throws invalid params on non-hex verifyingContract', () => {
    const bad = JSON.stringify({
      primaryType: 'Mail',
      domain: {
        name: 'MyApp',
        version: '1',
        chainId: 1,
        verifyingContract: 'not-hex',
      },
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Mail: [{ name: 'content', type: 'string' }],
      },
      message: { content: 'bad-hex' },
    });
    expect(() => parseEip712TypedDataJson(bad)).toThrow(/must be a 0x-prefixed hex|invalid params/);
  });
});
