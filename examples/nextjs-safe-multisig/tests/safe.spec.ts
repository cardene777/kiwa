import { test, expect } from '@playwright/test';

/**
 * 7 tests covering the Level B scope from docs/MOCK-DESIGN.md and the lessons
 * from the first Codex attempt that failed to enforce threshold strictly:
 *
 *   T-SAFE-001 deploy + initial state (owners, threshold, nonce = 0)
 *   T-SAFE-002 propose returns a SafeTx with the current nonce
 *   T-SAFE-003 threshold not met → revert (the key regression from the first attempt)
 *   T-SAFE-004 threshold met → success + nonce increment
 *   T-SAFE-005 module path succeeds without owner signatures
 *   T-SAFE-006 guard rejects → revert with GUARD_REJECTED
 *   T-SAFE-007 nonce reuse → revert (INVALID_NONCE on replay)
 */

test.describe('Safe multi-sig (Level B mock)', () => {
  test('T-SAFE-001 deploys with owners + threshold and shows nonce = 0', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('safe-address')).toContainText('address: 0x');
    await expect(page.getByTestId('safe-threshold')).toContainText('threshold: 2');
    await expect(page.getByTestId('safe-nonce')).toContainText('nonce: 0');
  });

  test('T-SAFE-002 exec with 2 owner sigs succeeds and increments nonce', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('exec-ok').click();

    await expect(page.getByTestId('status')).toHaveText('success', { timeout: 10_000 });
    await expect(page.getByTestId('tx-hash')).toContainText('0x');
    await expect(page.getByTestId('safe-nonce')).toContainText('nonce: 1');
  });

  test('T-SAFE-003 exec with 1 sig (below threshold) reverts with THRESHOLD_NOT_MET', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('exec-below-threshold').click();

    // This is the bug pattern from the first Codex attempt. The mock must
    // refuse, not silently let the 1-of-2 transaction through.
    await expect(page.getByTestId('status')).toHaveText('error', { timeout: 10_000 });
    await expect(page.getByTestId('error-message')).toHaveText('THRESHOLD_NOT_MET');
    await expect(page.getByTestId('safe-nonce')).toContainText('nonce: 0');
  });

  test('T-SAFE-004 exec with duplicate sigs reverts with DUPLICATE_SIGNER', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('exec-duplicate').click();

    await expect(page.getByTestId('status')).toHaveText('error', { timeout: 10_000 });
    await expect(page.getByTestId('error-message')).toHaveText('DUPLICATE_SIGNER');
    await expect(page.getByTestId('safe-nonce')).toContainText('nonce: 0');
  });

  test('T-SAFE-005 module path executes without owner signatures', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('module-exec').click();

    await expect(page.getByTestId('status')).toHaveText('success', { timeout: 10_000 });
    await expect(page.getByTestId('module-result')).toContainText('module-exec success');
    await expect(page.getByTestId('safe-nonce')).toContainText('nonce: 1');
  });

  test('T-SAFE-006 guard rejecting checkTransaction reverts the exec', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('guard-reject').click();

    await expect(page.getByTestId('status')).toHaveText('error', { timeout: 10_000 });
    await expect(page.getByTestId('error-message')).toHaveText('GUARD_REJECTED');
    await expect(page.getByTestId('safe-nonce')).toContainText('nonce: 0');
  });

  test('T-SAFE-007 nonce reuse (replay) reverts on the second exec', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('exec-nonce-reuse').click();

    // First exec increments nonce to 1; the replay uses the original tx with
    // nonce = 0, so it must revert with INVALID_NONCE.
    await expect(page.getByTestId('status')).toHaveText('error', { timeout: 10_000 });
    await expect(page.getByTestId('error-message')).toHaveText('INVALID_NONCE');
    await expect(page.getByTestId('safe-nonce')).toContainText('nonce: 1');
  });
});
