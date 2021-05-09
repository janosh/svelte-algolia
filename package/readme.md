<div class="hide-in-demo">

<p align="center">
  <img src="site/static/banner.svg" alt="Svelte Algolia" height=150>
</p>

# Svelte Algolia

[![Test Status](https://github.com/janosh/svelte-algolia/workflows/Tests/badge.svg)](https://github.com/janosh/svelte-algolia/actions)
[![NPM version](https://img.shields.io/npm/v/svelte-algolia?color=blue&logo=NPM)](https://www.npmjs.com/package/svelte-algolia)
[![Netlify Status](https://api.netlify.com/api/v1/badges/496f6094-b6b2-4929-ab16-ba2fdc61d57e/deploy-status)](https://app.netlify.com/sites/svelte-algolia/deploys)

Utility for server-side Algolia index updates plus a client-side search component for Svelte apps. Only adds a single dependency on client and server: [`algoliasearch`](https://npmjs.com/package/algoliasearch).

> The server-side part of this package was inspired by [`gatsby-plugin-algolia`](https://github.com/algolia/gatsby-plugin-algolia).

</div>

## Usage

There are three steps to setting up `svelte-algolia`. First, get it from NPM, then setup your server-side index updates and finally integrate the client-side search component into your UI.

### Installation

Install with `yarn` or `(p)npm`

```sh
yarn add -D svelte-algolia
```

```sh
npm i -D svelte-algolia
```

### Server Side

1. Create an `algoliaConfig` object:

   ```js
   import 'dotenv/config' // optional

   function loadPokedex() {
     const json = fs.readFileSync(`../package/tests/fixtures/pokedex.json`, `utf8`)
     return JSON.parse(json).map(el => ({ ...el, id: el.someUniqAttribute }))
   }

   const algoliaConfig = {
     appId: process.env.ALGOLIA_APP_ID,
     apiKey: process.env.ALGOLIA_ADMIN_KEY,
     indices: [
       { name: `Pokedex`, getData: loadPokedex },
       { name: `Hitchhiker's Guide`, getData: guideLoader },
     ],
    settings: {
      attributesToHighlight: [`name`],
    },
   }
   ```

   The `getData` function is expected to return an array of objects containing the data you wish to index (a product catalog, blog posts, documentation pages, pokémons or whatever). Each object in the data array should have a key named `id`, `_id` or `objectID` for Algolia to recognize it and overwrite existing data where appropriate.

   The settings object applies to all indices. You can also pass a settings object to each index individually which overrides the general one.

2. Pass your config to `indexAlgolia`:

   ```js
   import { indexAlgolia } from 'svelte-algolia'

   indexAlgolia(algoliaConfig)
   ```

   You can call this function wherever you'd like to update your indices. Typically, you would include this in every production build of your app.

#### Config Options

```js
const defaultConfig = {
  verbosity: 1, // 0, 1 or 2 for no/some/lots of logging
  partialUpdates: false, // if true, figures out diffs between existing
  // items and new ones and only uploads changes, otherwise, completely
  // overwrites each index on every call to indexAlgolia()
  matchFields: [], // (only used when partialUpdates is true) keys of fields to check
  // for whether an item has changed; could e.g. be a timestamp, hash or an ID that's
  // updated every time the item has changed; if not provided, items are checked for
  // deep-equality to discover changes which can become slow for thousands of items
  settings: {}, // an object of Algolia index settings that applies to all indices
  // see https://algolia.com/doc/api-reference/settings-api-parameters for available options
  // can be overridden for individual indices by passing a settings object as part of the indices array:
  // indices = [{ name: `pokedex`, ..., settings: { foo: `bar` }}],
}
```

#### Auto-update Indices during Builds

To use this package as part of a build process (e.g. in a [SvelteKit](https://kit.svelte.dev) app), simply call `indexAlgolia` in your build config:

```js
// svelte.config.js
import { indexAlgolia } from 'svelte-algolia'

const algoliaConfig = {
  // see above
}

// only update Algolia indices on production builds (saves Algolia API quota)
if (process.env.NODE_ENV === `production`) indexAlgolia(algoliaConfig)
```

### Client Side

`<Search />` needs your Algolia app's ID and search key to access its search indices as well as a mapping from index to corresponding Svelte-component that should render hits (items matching searches in that index). Each hit component receives a `hit` object as prop with all attributes stored in the Algolia index.

```svelte
<script>
  import Search from 'svelte-algolia'
  import PokemonHit from '../components/PokemonHit.svelte'

  const appId = '0OJ5UL9OJX'
  const searchKey = '63f563566cdd6de606e2bb0fdc291994'
</script>

<header>
  <nav>{...}</nav>
  <Search
    {appId}
    {searchKey}
    indices={{ Pokedex: PokemonHit }}
    placeholder="Search Pokedex" />
</header>
```

For example, the `PokemonHit.svelte` component on the [demo site](https://svelte-algolia.netlify.app/) looks like this:

```svelte
<script>
  export let hit
</script>

<h2>{@html hit.name}</h2>

<div>
  <ul>
    <li>Type: {@html hit.type.join(`, `)}</li>
    <li>Height: {@html hit.height}</li>
    <li>Weight: {@html hit.weight}</li>
    <li>Weaknesses: {@html hit.weaknesses.join(`, `)}</li>
  </ul>
  <img src={hit.img} alt={hit.nameOrig} />
</div>

<style>
  /* highlights text matching the search string */
  :global(em) {
    color: darkcyan;
    line-height: 1.2em;
    border-radius: 3pt;
    font-style: normal;
  }
  div {
    display: flex;
    justify-content: space-between;
  }
</style>
```

Substrings in attributes matching the current search string will be wrapped in `<em>` which need the `{@html ...}` tag to be rendered correctly but can then be styled to highlight why a particular hit matches the current search string. The original value (i.e. without `<em>` tags) of every highlighted attribute is available as `hit.[attr]Orig`. See `hit.nameOrig` above.

## Want to contribute?

[PRs](https://github.com/janosh/svelte-algolia/pulls) are welcome but best [open an issue](https://github.com/janosh/svelte-algolia/issues/new) first to discuss changes.

The repo is split into two workspaces, the `package` itself and the demo `site`. The app ID and search key `.env` were intentionally committed so you can clone this repo and work on it without having to create your own index first. To get a dev server running locally so you can try out changes in `package` as you make them, use

```sh
git clone https://github.com/janosh/svelte-algolia
cd svelte-algolia/site
sed -i '' 's/name: `Pokedex`/name: `Pokedex Clone`/' site/svelte.config.js
yarn
yarn dev
```

Note the `sed` command that changes the index name in [`site/svelte.config.js`](site/svelte.config.js) from `'Pokedex'` to `'Pokedex Clone'` so you don't accidentally mess up the search index for this demo site while developing.
