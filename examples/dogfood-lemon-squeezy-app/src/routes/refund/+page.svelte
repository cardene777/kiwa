<script lang="ts">
  /**
   * Refund UI — illustrative. Lists orders + issued refunds and lets the
   * merchant issue a full or partial refund. Real Lemon Squeezy refunds
   * emit `order_refunded` with the delta so downstream analytics can sum
   * refund totals.
   */
  interface RefundSummary {
    id: string;
    orderId: string;
    customerId: string;
    amountCents: number;
    refundAmountCents: number;
    kind: 'full' | 'partial';
    reason: string;
    createdAt: number;
  }

  let refunds: RefundSummary[] = [];
  let orderId = '';
  let refundAmountCents: number | null = null;
  let reason = '';

  async function refresh(): Promise<void> {
    const res = await fetch('/refund');
    if (res.ok) {
      const body = (await res.json()) as { refunds: RefundSummary[] };
      refunds = body.refunds;
    }
  }

  async function submitRefund(): Promise<void> {
    if (!orderId.trim()) return;
    const payload: Record<string, unknown> = { orderId };
    if (refundAmountCents !== null && refundAmountCents > 0) payload.refundAmountCents = refundAmountCents;
    if (reason.trim()) payload.reason = reason;
    await fetch('/refund', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    orderId = '';
    refundAmountCents = null;
    reason = '';
    await refresh();
  }
</script>

<section aria-labelledby="refund-title">
  <h1 id="refund-title">Refunds</h1>
  <form on:submit|preventDefault={submitRefund}>
    <input bind:value={orderId} placeholder="Order id" required />
    <input type="number" bind:value={refundAmountCents} placeholder="Refund amount (cents, leave empty for full)" />
    <input bind:value={reason} placeholder="Reason" />
    <button type="submit">Issue refund</button>
  </form>
  <button type="button" on:click={refresh}>Refresh</button>
  <ul>
    {#each refunds as refund (refund.id)}
      <li>
        <code>{refund.orderId}</code>
        <span data-testid="refund-kind">{refund.kind}</span>
        <span>{refund.refundAmountCents} / {refund.amountCents}</span>
        <span>{refund.reason}</span>
      </li>
    {/each}
  </ul>
</section>
