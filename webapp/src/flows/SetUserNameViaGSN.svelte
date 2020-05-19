<script>
  import { wallet } from "../stores/wallet";
  import userflow from "../stores/userflow";
	import Modal from '../components/Modal.svelte';

  let name = "";
</script>

{#if $wallet.status === "Ready"}

{#if $wallet.chain.status === "Ready"}
<Modal on:close="{() => userflow.cancel()}" confirmButton="Confirm" on:confirm="{() => userflow.setNameGSN_confirm(name)}">
  <h2 slot="header">
   Set Your Name
  </h2>

  <div>
    <!-- TODO show DAI balance and warn when cannot buy // DAI balance could be shown in navbar (once connected)-->
    <input type="text" name="name" bind:value="{name}"/>
    <label for="name">Name</label>
  </div>
</Modal>
{:else}
<Modal on:close="{() => userflow.cancel()}">loading chain</Modal>
{/if}
<!-- TODO wrong chain -->

{:else if $wallet.status === "Loading"}
<Modal on:close="{() => userflow.cancel()}">loading</Modal>
{:else if $wallet.status === "Locked"}
<Modal on:close="{() => userflow.cancel()}">locked</Modal>
{:else if !$wallet.builtin}
<Modal on:close="{() => userflow.cancel()}">Error probe need to be called</Modal>
{:else if $wallet.builtin.status === "None"} <!-- assume probe was called-->
<Modal on:close="{() => userflow.cancel()}">No Wallet</Modal>
{:else}
<Modal on:close="{() => userflow.cancel()}" confirmButton="builtin", on:confirm="{() => wallet.connect('builtin')}">Chose wallet</Modal>
{/if}
