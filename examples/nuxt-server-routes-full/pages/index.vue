<template>
  <main>
    <h1>kiwa Nuxt PoC</h1>
    <p>This is the {{ pocName }} example demonstrating @kiwa-test/nuxt v1.0.4+.</p>
    <ul>
      <li><a href="/api/items">/api/items</a> — Server Routes layer</li>
      <li>Route middleware (auth.global.ts) — applies to all pages</li>
      <li>Nitro plugin (analytics.ts) — request/response logging</li>
    </ul>
  </main>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const pocName = config.public.kiwaPocName as string;
</script>
