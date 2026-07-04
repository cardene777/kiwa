<script lang="ts">
  /**
   * Chargeback dispute UI — illustrative. Lists open disputes and lets the
   * merchant submit evidence + drive the resolve step. Real card networks
   * settle disputes async on the dispute-response deadline; the dogfood app
   * exposes the resolve step synchronously so tests can drive the outcome.
   */
  interface ChargebackSummary {
    id: string;
    transactionId: string;
    customerId: string;
    amountCents: number;
    reason: string;
    state: 'opened' | 'evidence-submitted' | 'won' | 'lost';
  }

  let chargebacks: ChargebackSummary[] = [];
  let receiptUrl = '';
  let shippingProof = '';
  let customerCommunication = '';

  async function refresh(): Promise<void> {
    const res = await fetch('/dispute');
    if (res.ok) {
      const body = (await res.json()) as { chargebacks: ChargebackSummary[] };
      chargebacks = body.chargebacks;
    }
  }

  async function submitEvidence(chargebackId: string): Promise<void> {
    await fetch('/dispute/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'evidence',
        chargebackId,
        receiptUrl: receiptUrl || undefined,
        shippingProof: shippingProof || undefined,
        customerCommunication: customerCommunication || undefined,
      }),
    });
    receiptUrl = '';
    shippingProof = '';
    customerCommunication = '';
    await refresh();
  }

  async function resolve(chargebackId: string, merchantWon: boolean): Promise<void> {
    await fetch('/dispute/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'resolve', chargebackId, merchantWon }),
    });
    await refresh();
  }
</script>

<section aria-labelledby="dispute-title">
  <h1 id="dispute-title">Chargeback Disputes</h1>
  <button type="button" on:click={refresh}>Refresh</button>
  <ul>
    {#each chargebacks as dispute (dispute.id)}
      <li>
        <code>{dispute.id}</code>
        <span data-testid="dispute-state">{dispute.state}</span>
        <span>{dispute.reason}</span>
        {#if dispute.state === 'opened'}
          <div>
            <input bind:value={receiptUrl} placeholder="Receipt URL" />
            <input bind:value={shippingProof} placeholder="Shipping proof" />
            <input bind:value={customerCommunication} placeholder="Customer communication" />
            <button type="button" on:click={() => submitEvidence(dispute.id)}>Submit evidence</button>
          </div>
        {:else if dispute.state === 'evidence-submitted'}
          <button type="button" on:click={() => resolve(dispute.id, true)}>Merchant won</button>
          <button type="button" on:click={() => resolve(dispute.id, false)}>Merchant lost</button>
        {/if}
      </li>
    {/each}
  </ul>
</section>
