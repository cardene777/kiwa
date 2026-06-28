import type { Page } from '@playwright/test';

export interface WaitForWalletConnectedOptions {
  testId?: string;
  expectedText?: string;
  timeout?: number;
  pollInterval?: number;
}

const DEFAULT_TEST_ID = 'connection-status';
const DEFAULT_EXPECTED_TEXT = 'connected';
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_POLL_INTERVAL_MS = 100;

export async function waitForWalletConnected(
  page: Page,
  options: WaitForWalletConnectedOptions = {},
): Promise<void> {
  const testId = options.testId ?? DEFAULT_TEST_ID;
  const expectedText = options.expectedText ?? DEFAULT_EXPECTED_TEXT;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const pollInterval = options.pollInterval ?? DEFAULT_POLL_INTERVAL_MS;

  const locator = page.getByTestId(testId);
  const maxAttempts = Math.max(1, Math.ceil(timeout / pollInterval));
  let lastSeen = '';

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const text = (await locator.textContent()) ?? '';
      lastSeen = text;
      if (text.toLowerCase().includes(expectedText.toLowerCase())) {
        return;
      }
    } catch {
    }
    if (attempt < maxAttempts - 1) {
      await page.waitForTimeout(pollInterval);
    }
  }

  throw new Error(
    `kiwa: waitForWalletConnected timed out after ${timeout}ms (testId=${testId}, expected="${expectedText}", lastSeen="${lastSeen}")`,
  );
}
