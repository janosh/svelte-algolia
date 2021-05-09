<script>
  import { session } from '$app/stores'
  import Search from '../../../package/src/Search.svelte'
  import PokemonHit from '../components/PokemonHit.svelte'

  const { ALGOLIA_APP_ID: appId, ALGOLIA_SEARCH_KEY: searchKey } = $session
</script>

<header>
  <nav>
    <a href=".">About</a>
    <a href=".">Contact</a>
    <a href=".">Fake</a>
    <a href=".">Links</a>
  </nav>
  <Search
    {appId}
    {searchKey}
    indices={{ Pokedex: PokemonHit }}
    placeholder="Search Pokedex" />
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
  }
  nav {
    display: flex;
    gap: 2em;
  }
  a {
    color: white;
  }
</style>
