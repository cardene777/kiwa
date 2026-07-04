<!--
  Nuxt 3 page — `/subscription`.

  Merchant dashboard for subscription tier upgrade/downgrade + pause / resume
  / cancel / reactivate. Rendered by the Nuxt 3 pages/ convention. This
  dogfood app does not boot Nuxt at test time — the tests hit the underlying
  server routes directly — so the Vue template exists as a shape reference
  for a real merchant integration.

  The page reads the subscription list via `GET /api/subscription` and posts
  actions to `POST /api/subscription/action` keyed by the `action` field
  (see subscription-action.post.ts for the action enum).
-->
<script setup lang="ts">
// Types mirror what the server route returns.
interface SubscriptionRow {
  id: string;
  customerId: string;
  planId: string;
  amountCents: number;
  currency?: string;
  state: 'active' | 'upgraded' | 'downgraded' | 'paused' | 'canceled';
}

// The real integration uses Nuxt's `useFetch`; this dogfood illustration
// uses the composable name but leaves runtime binding to Nuxt at build
// time. Tests exercise the underlying HTTP handlers so no client-side fetch
// wiring is required.
const subscriptions = ref<SubscriptionRow[]>([]);

async function refresh(): Promise<void> {
  const response = await fetch('/api/subscription');
  const body = (await response.json()) as { subscriptions: SubscriptionRow[] };
  subscriptions.value = body.subscriptions;
}

async function upgrade(id: string, newPlanId: string, newAmountCents: number): Promise<void> {
  await fetch('/api/subscription/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'changePlan', subscriptionId: id, newPlanId, newAmountCents }),
  });
  await refresh();
}

async function downgrade(id: string, newPlanId: string, newAmountCents: number): Promise<void> {
  // Same action — the runtime derives up vs down from the amount delta.
  await upgrade(id, newPlanId, newAmountCents);
}

async function pause(id: string): Promise<void> {
  await fetch('/api/subscription/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'pause', subscriptionId: id }),
  });
  await refresh();
}

async function cancel(id: string): Promise<void> {
  await fetch('/api/subscription/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'cancel', subscriptionId: id }),
  });
  await refresh();
}

onMounted(refresh);

// Helper `ref` / `onMounted` are Nuxt 3 auto-imports. The dogfood app does
// not compile the .vue file — the type-check runs on the .ts server routes
// only.
declare function ref<T>(v: T): { value: T };
declare function onMounted(fn: () => void | Promise<void>): void;
</script>

<template>
  <section class="subscription-page">
    <h1>Subscriptions</h1>
    <table v-if="subscriptions.length > 0">
      <thead>
        <tr>
          <th>id</th>
          <th>plan</th>
          <th>amount</th>
          <th>state</th>
          <th>actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sub in subscriptions" :key="sub.id">
          <td>{{ sub.id }}</td>
          <td>{{ sub.planId }}</td>
          <td>{{ (sub.amountCents / 100).toFixed(2) }} {{ sub.currency }}</td>
          <td>{{ sub.state }}</td>
          <td>
            <button @click="upgrade(sub.id, 'pro', 4999)">Upgrade → pro</button>
            <button @click="downgrade(sub.id, 'starter', 999)">Downgrade → starter</button>
            <button @click="pause(sub.id)">Pause</button>
            <button @click="cancel(sub.id)">Cancel</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else>No subscriptions yet — start checkout to create one.</p>
  </section>
</template>
