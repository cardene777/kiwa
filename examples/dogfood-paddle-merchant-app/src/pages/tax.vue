<!--
  Nuxt 3 page — `/tax`.

  Tax configuration + calculation UI. The buyer enters their country + VAT
  id + amount and sees the VAT/GST/sales-tax computation Paddle would apply
  under Merchant-of-Record. B2B intra-EU with a valid VAT id triggers the
  reverse-charge branch; buyers in unsupported countries are marked exempt.

  The page reads the tax record list via `GET /api/tax` and calculates ad
  hoc via `POST /api/tax/calculate`.
-->
<script setup lang="ts">
interface TaxLineRow {
  kind: 'vat' | 'gst' | 'sales-tax';
  country: string;
  rateBps: number;
  amountCents: number;
  taxCents: number;
  reverseCharged: boolean;
  exempt: boolean;
}

interface TaxRecord {
  customerId: string;
  line: TaxLineRow;
  createdAt: number;
}

const records = ref<TaxRecord[]>([]);
const currentLine = ref<TaxLineRow | null>(null);
const form = ref({
  customerId: 'cus_test_dashboard',
  netAmountCents: 2999,
  buyerCountry: 'DE',
  buyerVatId: '',
  merchantCountry: 'GB',
  productKind: 'digital' as 'digital' | 'physical' | 'service',
});

async function refresh(): Promise<void> {
  const response = await fetch('/api/tax');
  const body = (await response.json()) as { records: TaxRecord[] };
  records.value = body.records;
}

async function calculate(): Promise<void> {
  const payload: Record<string, unknown> = {
    customerId: form.value.customerId,
    netAmountCents: form.value.netAmountCents,
    buyerCountry: form.value.buyerCountry,
    merchantCountry: form.value.merchantCountry,
    productKind: form.value.productKind,
  };
  if (form.value.buyerVatId) payload['buyerVatId'] = form.value.buyerVatId;
  const response = await fetch('/api/tax/calculate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as { tax: TaxLineRow };
  currentLine.value = body.tax;
  await refresh();
}

/**
 * Convert the tax kind + reverse-charge / exempt flags into a human-readable
 * label. Used to render the outcome badge next to the amount so the buyer
 * (or merchant) sees which branch triggered.
 */
function taxLabel(line: TaxLineRow): string {
  if (line.exempt) return 'exempt (out of coverage)';
  if (line.reverseCharged) return 'reverse-charged (B2B intra-EU)';
  return `${line.kind.toUpperCase()} @ ${(line.rateBps / 100).toFixed(2)}%`;
}

onMounted(refresh);

declare function ref<T>(v: T): { value: T };
declare function onMounted(fn: () => void | Promise<void>): void;
</script>

<template>
  <section class="tax-page">
    <h1>Tax configuration</h1>
    <form @submit.prevent="calculate">
      <label>Customer id <input v-model="form.customerId" /></label>
      <label>Amount (cents) <input v-model.number="form.netAmountCents" type="number" /></label>
      <label>Buyer country
        <select v-model="form.buyerCountry">
          <option>GB</option>
          <option>DE</option>
          <option>FR</option>
          <option>IT</option>
          <option>ES</option>
          <option>NL</option>
          <option>JP</option>
          <option>AU</option>
          <option>NZ</option>
          <option>US</option>
          <option>CA</option>
          <option>ZZ</option>
        </select>
      </label>
      <label>Buyer VAT id <input v-model="form.buyerVatId" /></label>
      <label>Merchant country <input v-model="form.merchantCountry" /></label>
      <label>Product kind
        <select v-model="form.productKind">
          <option value="digital">digital</option>
          <option value="physical">physical</option>
          <option value="service">service</option>
        </select>
      </label>
      <button type="submit">Calculate</button>
    </form>
    <div v-if="currentLine" class="tax-current">
      <h2>Latest calculation</h2>
      <p>Country: {{ currentLine.country }}</p>
      <p>Tax label: {{ taxLabel(currentLine) }}</p>
      <p>Net amount: {{ (currentLine.amountCents / 100).toFixed(2) }}</p>
      <p>Tax amount: {{ (currentLine.taxCents / 100).toFixed(2) }}</p>
    </div>
    <h2>Recent tax records</h2>
    <ul v-if="records.length > 0">
      <li v-for="r in records" :key="`${r.customerId}-${r.createdAt}`">
        {{ r.customerId }} — {{ taxLabel(r.line) }} — {{ (r.line.taxCents / 100).toFixed(2) }}
      </li>
    </ul>
    <p v-else>No tax records yet.</p>
  </section>
</template>
