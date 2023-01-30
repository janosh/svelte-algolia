<script>
  import { Search, SearchIcon } from '$lib'
  import { PokemonHit } from '.'

  const appId = import.meta.env.VITE_ALGOLIA_APP_ID
  const searchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY

  let searchEverFocused = false
</script>

<h2>Live Demo</h2>

<p>
  This is what Svelte-Algolia integrated into a nav bar might look like. Click the <SearchIcon
  /> icon to try it out!
</p>

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
      --search-hits-bg-color="black"
    />
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
