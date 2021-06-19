<script>
  import { session } from '$app/stores'
  import Search from '../../../package/src/Search.svelte'
  import PokemonHit from '../components/PokemonHit.svelte'

  const { ALGOLIA_APP_ID: appId, ALGOLIA_SEARCH_KEY: searchKey } = $session

  let searchEverFocused = false
</script>

<header>
  <nav>
    <a href=".">Fake</a>
    <a href=".">Links</a>
    <a href=".">In</a>
    <a href=".">Nav</a>
  </nav>
  <div>
    {#if !searchEverFocused}
      <span>👉</span>
    {/if}
    <Search
      {appId}
      {searchKey}
      indices={{ Pokedex: PokemonHit }}
      on:focus={() => (searchEverFocused = true)}
      placeholder="Search Pokedex"
      --hitsBgColor="black" />
  </div>
</header>

<style>
  header {
    background: darkcyan;
    padding: 1ex 1em;
    border-radius: 1ex;
    display: flex;
    gap: 2em;
    justify-content: space-between;
    font-size: 1.2em;
    position: relative;
  }
  nav {
    display: flex;
    gap: 2em;
  }
  a {
    color: white;
  }
  div {
    display: flex;
    gap: 1ex;
  }
  span {
    font-size: 4ex;
    animation: bob 1.5s infinite alternate ease-in-out;
  }
  :global(aside.svelte-algolia h2) {
    margin-top: 1ex;
  }
  @keyframes bob {
    from {
      transform: 0;
    }
    to {
      transform: translateX(-1ex);
    }
  }
</style>
