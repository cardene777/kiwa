<script lang="ts">
  /**
   * License key management page — illustrative. Reads /license via `fetch`
   * and lets the user issue a new license, activate an instance, or revoke
   * one. The dogfood tests exercise the handler layer directly; this page
   * is here so a real SvelteKit consumer can build against the same shape.
   */
  interface LicenseSummary {
    id: string;
    key: string;
    status: 'active' | 'inactive' | 'expired' | 'disabled';
    activationsUsed: number;
    activationsLimit: number;
    activations: {
      instanceId: string;
      instanceName: string;
      createdAt: number;
      revokedAt?: number;
    }[];
  }

  let licenses: LicenseSummary[] = [];
  let selected: string | null = null;
  let instanceName = '';

  async function refresh(): Promise<void> {
    const res = await fetch('/license');
    if (res.ok) {
      const body = (await res.json()) as { licenses: LicenseSummary[] };
      licenses = body.licenses;
    }
  }

  async function activate(licenseKeyId: string): Promise<void> {
    if (!instanceName.trim()) return;
    await fetch('/license/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'activate', licenseKeyId, instanceName }),
    });
    instanceName = '';
    await refresh();
  }

  async function revoke(licenseKeyId: string, instanceId: string): Promise<void> {
    await fetch('/license/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'revoke', licenseKeyId, instanceId }),
    });
    await refresh();
  }
</script>

<section aria-labelledby="license-title">
  <h1 id="license-title">License Keys</h1>
  <button type="button" on:click={refresh}>Refresh</button>
  <ul>
    {#each licenses as license (license.id)}
      <li>
        <code>{license.key}</code>
        <span data-testid="license-status">{license.status}</span>
        <span>({license.activationsUsed}/{license.activationsLimit} activations)</span>
        <button type="button" on:click={() => (selected = license.id)}>Select</button>
        {#if selected === license.id}
          <div>
            <input bind:value={instanceName} placeholder="Instance name" />
            <button type="button" on:click={() => activate(license.id)}>Activate</button>
          </div>
          <ul>
            {#each license.activations as activation (activation.instanceId)}
              <li>
                {activation.instanceName} — {activation.revokedAt ? 'revoked' : 'active'}
                {#if !activation.revokedAt}
                  <button type="button" on:click={() => revoke(license.id, activation.instanceId)}>Revoke</button>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
</section>
