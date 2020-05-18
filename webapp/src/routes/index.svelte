<script context="module">
  //// ---------- SERVER SIDE RENDERRING ----------- ///
  import names from "../stores/names";
  export const preload = names.load; // this make SSR load the data first
</script>

<script>
  export let data; // this is named data so it matchesthe data given by preload (names.load)
  names.boot(data); // this boot the store with the data from server and make it listen for updates
  //// ---------- SERVER SIDE RENDERRING ----------- ///

  import userflow from "../stores/userflow";

  import SetUserNameFlow from "../flows/SetUserNameFlow";
  const flows = {SetUserNameFlow}
</script>

{#if !$names.status}
  <div>Name not loaded</div>
{:else if $names.status === 'error'}
  <div>Error</div>
{:else if $names.status === 'loading'}
  <div>Loading Names...</div>
{:else}
  {#each $names.data as name, index}
    <li>{name.id} : {name.name}</li>
  {/each}
{/if}

<button on:click="{() => userflow.setName_start()}">Set your Name</button>

<svelte:component this={flows[$userflow.flow]}/>
