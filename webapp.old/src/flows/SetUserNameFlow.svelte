<script>
  import { wallet } from "../stores/wallet";
  import userflow from "../stores/userflow";
	import Modal from '../components/Modal.svelte';

  let name = "";
  let useGSN = false;
  let useDAI = false;
</script>

{#if $wallet.status === "Ready"}

{#if $wallet.chain.status === "Ready"}
<Modal on:close="{() => userflow.cancel()}" confirmButton="Confirm" on:confirm="{() => userflow.setName_confirm(name, useGSN, useDAI)}">
  <!-- <p slot="header"></p> -->

  <section class="nes-container with-title">
    <h3 class="title">openGSN</h3>
    <div id="checkboxes" class="item">
      <label>
        {#if $wallet.selected === "builtin"}
        <input type="checkbox" class="nes-checkbox" bind:checked={useGSN}><span>GSN</span>
        {:else}
        <input type="checkbox" class="nes-checkbox disabled" checked="" disabled="true"><span class="disabled">GSN</span>
        {/if}
        
      </label>
      <label>
        {#if useGSN}
        <input type="checkbox" class="nes-checkbox" bind:checked="{useDAI}" class:disabled="{!useGSN}" disabled={!useGSN}>
        {:else}
        <input type="checkbox" class="nes-checkbox disabled" checked="" disabled="true">
        {/if}
        <span class:disabled="{!useGSN}">DAI</span>
      </label>
    <div>
  </section>
  <div class="nes-field">
    <label for="name_field">Your name</label>
    <input type="text" id="name_field" class="nes-input" bind:value="{name}">
  </div>
</Modal>
{:else}
<Modal on:close="{() => userflow.cancel()}">loading chain</Modal>
{/if}
<!-- TODO wrong chain -->

{:else if $wallet.status === "Loading"}
<Modal on:close="{() => userflow.cancel()}">loading</Modal>
{:else if $wallet.status === "Locked"}
<Modal on:close="{() => userflow.cancel()}" confirmButton="unlock", on:confirm="{() => wallet.unlock()}">Your wallet is locked.</Modal>
<!-- {:else if !$wallet.builtin}
<Modal on:close="{() => userflow.cancel()}">Error probe need to be called</Modal>
{:else if $wallet.builtin.status === "None"} <!-- assume probe was called-->
<!-- <Modal on:close="{() => userflow.cancel()}">No Wallet</Modal> --> -->
{:else}
<Modal on:close="{() => userflow.cancel()}">
  {#if $wallet.builtin.status == "None"}
  <section class="nes-container with-title">
    <h3 class="title">Connect via Portis</h3>
    <button class="nes-btn is-primary" on:click="{() => wallet.connect('portis')}">connect</button>
  </section>
  {:else}
  <section class="nes-container with-title">
    <h3 class="title">Choose Wallet</h3>
    <div id="wallets" class="item">
      <button class="nes-btn is-primary" on:click="{() => wallet.connect('builtin')}">Metamask</button>
      <button class="nes-btn is-primary" on:click="{() => wallet.connect('portis')}">Portis</button>
    <div>
  </section>
  {/if}
</Modal>
{/if}
