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
  import SetUserNameViaGSN from "../flows/SetUserNameViaGSN";
  const flows = {SetUserNameFlow, SetUserNameViaGSN}
</script>

<div id="nescss">
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
        <h2 id="about"><a href="#about">#</a>Set Your Name</h2>
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
