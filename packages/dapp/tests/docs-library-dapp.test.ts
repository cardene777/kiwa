import { expect, it } from 'vitest';
import {
  ANVIL_DEFAULT_PRIVATE_KEYS,
  createInjectorScript,
  createRpcHandler,
  handleRpcRequest,
} from '../src/index.js';

it('validates the Quickstart EIP-1193 chain response', async () => {
  const response = await handleRpcRequest({
    privateKey: ANVIL_DEFAULT_PRIVATE_KEYS[0],
    chainState: { current: 31337 },
    approvalMode: { current: 'approve' },
  }, { method: 'eth_chainId' });

  expect(response).toBe('0x7a69');
});

it('validates the multi-wallet configuration described in the how-to', () => {
  const script = createInjectorScript({
    wallets: [
      {
        name: 'Alpha', rdns: 'io.alpha', icon: 'data:image/svg+xml,alpha',
        privateKey: ANVIL_DEFAULT_PRIVATE_KEYS[0],
      },
      {
        name: 'Beta', rdns: 'io.beta', icon: 'data:image/svg+xml,beta',
        privateKey: ANVIL_DEFAULT_PRIVATE_KEYS[1],
      },
    ],
  });

  expect(script).toContain('io.alpha');
  expect(script).toContain('io.beta');
  expect(script).toContain('eip6963:announceProvider');
  expect(createRpcHandler).toBeTypeOf('function');
});
