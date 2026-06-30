<script lang="ts">
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>kiwa SvelteKit PoC — items</title>
</svelte:head>

<h1>kiwa SvelteKit PoC</h1>

<p>signed in as: <strong>{data.user ?? 'guest'}</strong> ({data.count} items)</p>

<ul>
  {#each data.items as item (item.id)}
    <li>
      <strong>{item.name}</strong> — tags: {item.tags.join(', ')}
    </li>
  {/each}
</ul>

<h2>Create new item</h2>

<form method="POST" action="?/create">
  <label>
    name: <input type="text" name="name" required minlength="2" />
  </label>
  <button type="submit">create</button>
</form>

{#if form && 'id' in form}
  <p data-testid="create-success">created id={form.id} name={form.name}</p>
{/if}

{#if form && 'field' in form}
  <p data-testid="create-error">error: {form.message}</p>
{/if}
