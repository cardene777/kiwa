import { expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCalledWith,
  assertToolCallOrder,
  assertToolNotCalled,
  createToolSpy,
} from '../src/index.js';

type ToolCall = (name: string, argumentsJson: string) => void;

async function answer(input: string, onToolCall: ToolCall): Promise<string> {
  onToolCall('Read', JSON.stringify({ path: 'policy.md' }));
  if (input.includes('deploy')) {
    onToolCall('Search', JSON.stringify({ query: 'deployment policy', limit: 5 }));
    onToolCall('Bash', JSON.stringify({ cmd: 'pnpm deploy --dry-run' }));
    return 'dry run started';
  }
  return 'nothing to deploy';
}

it('keeps the documented agent tool path test runnable', async () => {
  const deploySpy = createToolSpy();
  await expect(answer('deploy this service', deploySpy.record)).resolves.toBe('dry run started');
  assertToolCalled(deploySpy, 'Read', { times: 1 });
  assertToolCalled(deploySpy, 'Bash', { times: 1 });
  assertToolCalledWith(deploySpy, 'Search', { query: 'deployment policy', limit: 5 });
  assertToolCallOrder(deploySpy, ['Read', 'Bash']);
  assertToolNotCalled(deploySpy, 'Write');

  const safeSpy = createToolSpy();
  await expect(answer('summarize the policy', safeSpy.record)).resolves.toBe('nothing to deploy');
  assertToolNotCalled(safeSpy, 'Bash');
});
