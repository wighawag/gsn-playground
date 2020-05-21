<script>
  import { wallet } from "../stores/wallet";
  import userflow from "../stores/userflow";
	import Modal from '../components/Modal.svelte';

  let name = "";
  let useGSN = false;
  let useDAI = false;

  $: daiChoice = useGSN && useDAI;
</script>

{#if $wallet.status === "Ready"}

{#if $wallet.chain.status === "Ready"}
<Modal on:close="{() => userflow.cancel()}" confirmButton="Confirm" on:confirm="{() => userflow.setName_confirm(name, useGSN, useDAI)}">
  <!-- <p slot="header"></p> -->

  <section class="nes-container with-title">
    <h3 class="title">openGSN</h3>
    <div id="checkboxes" class="item">
      <label>
        <input type="checkbox" class="nes-checkbox" bind:checked={useGSN}>
        <span>GSN</span>
      </label>
      <label>
        <input type="checkbox" class="nes-checkbox" bind:checked="{daiChoice}" class:disabled="{!useGSN}" disabled={!useGSN}>
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
<Modal on:close="{() => userflow.cancel()}">locked</Modal>
{:else if !$wallet.builtin}
<Modal on:close="{() => userflow.cancel()}">Error probe need to be called</Modal>
{:else if $wallet.builtin.status === "None"} <!-- assume probe was called-->
<Modal on:close="{() => userflow.cancel()}">No Wallet</Modal>
{:else}
<Modal on:close="{() => userflow.cancel()}" confirmButton="builtin", on:confirm="{() => wallet.connect('builtin')}">Chose wallet</Modal>
{/if}
