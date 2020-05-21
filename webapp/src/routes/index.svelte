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
  import dai from "../stores/dai";

  import {BigNumber} from "@ethersproject/bignumber";

  import SetUserNameFlow from "../flows/SetUserNameFlow";
  const flows = {SetUserNameFlow}
</script>

<div id="nescss">
  <p style="position: fixed;top:0px; z-index: 1000; right:0px;">
    {#if $dai.balance}
    DAI: {BigNumber.from($dai.balance).div("10000000000000000").toNumber() / 100}
    {/if}
  </p>
  <header>
    <div class="container">
      <div class="nav-brand">
        <h1>META TX</h1>
        <p>OpenGSN with user control and DAI payment</p>
        
      </div>
    </div>
  </header>

  <div class="container">
    <main class="main-content">
  
      <!-- About -->
      <section class="topic">
        <h2># Set Your Name</h2>
        <button class="nes-btn is-primary" on:click="{() => userflow.setName_start()}">Set your Name</button>
      </section>

      <section class="topic with-title">
        <h3 class="title">existing names</h3>
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
      </section>
      

    </main>
  </div>
</div>

<svelte:component this={flows[$userflow.flow]}/>
