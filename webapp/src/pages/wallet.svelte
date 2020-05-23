<script>
  import {wallet} from "../stores/wallet"
</script>

{JSON.stringify($wallet, null, '  ')}

<br/>
<button on:click="{() => wallet.probeBuiltin()}">probeBuiltin</button><br/>
<button on:click="{() => wallet.connect('builtin')}">builtin</button><br/>
<button on:click="{() => wallet.connect('portis')}">portis</button><br/>

<button on:click="{() => wallet.unlock()}">unlock</button><br/>

<!-- 
{#if !$names.status}
  <div>Name not loaded</div>
{:else if $names.status === 'error'}
  <div>Error</div>
{:else if $names.status === 'loading'}
  <div>Loading Names...</div>
{:else}
  {#each $names.data as name, index}
    <li>{name}</li>
  {/each}
{/if} -->
