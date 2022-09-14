<h1 align="center">
  <img src="https://raw.githubusercontent.com/janosh/svelte-algolia/main/static/favicon.svg" alt="Svelte Algolia" height=60>
  <br>&ensp;Svelte Algolia
</h1>

<h4 align="center">

[![Tests](https://github.com/janosh/svelte-algolia/actions/workflows/test.yml/badge.svg)](https://github.com/janosh/svelte-algolia/actions/workflows/test.yml)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/janosh/svelte-algolia/main.svg)](https://results.pre-commit.ci/latest/github/janosh/svelte-algolia/main)
[![NPM version](https://img.shields.io/npm/v/svelte-algolia?color=blue&logo=NPM)](https://npmjs.com/package/svelte-algolia)
[![Netlify Status](https://api.netlify.com/api/v1/badges/496f6094-b6b2-4929-ab16-ba2fdc61d57e/deploy-status)](https://app.netlify.com/sites/svelte-algolia/deploys)
[![Open in StackBlitz](https://img.shields.io/badge/Open%20in-StackBlitz-darkblue?logo=stackblitz)](https://stackblitz.com/github/janosh/svelte-algolia)

</h4>

<div class="hide-in-docs">

[**Live Demo**](https://svelte-algolia.netlify.app)

</div>

Utility for server-side Algolia index updates plus a client-side search component for Svelte apps. Only adds a single dependency:

- server-side: [`algoliasearch`](https://npmjs.com/package/algoliasearch)
- client-side: [`algoliasearch/lite`](https://algolia.com/doc/api-client/getting-started/install/javascript?client=javascript#explanation-of-different-builds) (13 KB).

<slot />

There are three steps to setting up `svelte-algolia`:

1. `npm i -D svelte-algolia`
2. Setup your [server-side index updates](#2-server-side-index-updates).
3. Integrate the [client-side search component](#3-client-side-ui) into your site.

## 2. Server-Side Index Updates

1. Create an `algoliaConfig` object:

   ```js
   import 'dotenv/config' // optional

   async function loadPokedex() {
     const json = await import('pokedex.json')
     return json.default.map((el) => ({ ...el, id: el.someUniqAttribute }))
   }

   const algoliaConfig = {
     appId: process.env.VITE_ALGOLIA_APP_ID,
     // don't prefix admin key with VITE_ else it would get exposed to client-side code
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
   import { indexAlgolia } from 'svelte-algolia/server-side'

   indexAlgolia(algoliaConfig)
   ```

   You can call this function wherever you'd like to update your indices, e.g. in `svelte.config.js` or in `src/hooks.ts` (as this demo site does). Typically, you would include this in every production build of your app.

### Config Options

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

### Auto-update Indices during Builds

To use this package as part of a build process (e.g. in a [SvelteKit](https://kit.svelte.dev) app), simply call `indexAlgolia` in your build config:

```js
// svelte.config.js

// only update Algolia indices on production builds (saves Algolia API quota)
if (process.env.NODE_ENV === `production`) {
  const { indexAlgolia } = await import(`svelte-algolia/server-side`)

  const algoliaConfig = {
    // see above
  }
  indexAlgolia(algoliaConfig)
}
```

## 3. Client Side UI

`<Search />` needs your Algolia app's ID and search key to access its search indices as well as a mapping from index names to corresponding Svelte-component that should render search hits coming from that index. Each hit component receives a `hit` object as prop with all attributes stored in the Algolia index.

```svelte
<script>
  import Search from 'svelte-algolia'
  import PokemonHit from '../components/PokemonHit.svelte'

  const appId = '0OJ5UL9OJX'
  const searchKey = '63f563566cdd6de606e2bb0fdc291994'
  // in a real app you'd get your credentials like this:
  const appId = import.meta.env.VITE_ALGOLIA_APP_ID
  const searchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY
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

For example, the `PokemonHit.svelte` component on the [demo site](https://svelte-algolia.netlify.app) looks like this:

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

### Props

Full list of props/bindable variables for this component:

1. ```ts
   appId: string
   ```

   [Algolia app ID](https://algolia.com/doc/tools/crawler/apis/configuration/app-id)

1. ```ts
   ariaLabel: string = 'Search'
   ```

   Tells assistive technology how to announce the input element to the user.

1. ```ts
   hasFocus: boolean = false
   ```

   Bindable boolean indicating whether the text input or results pane currently has focus.

1. ```ts
   indices: | Record<string, typeof SvelteComponent> | [string, typeof SvelteComponent][] // [indexName, component to render search results from that index]
   ```

   Object mapping the name of each index the `Search` component should tap into for finding Search results to the Svelte component that should render those hits.

1. ```ts
   loadingMsg: string = 'Searching...'
   ```

   String to display in the results pane while Search results are being fetched.

1. ```ts
   noResultMsg = (query: string): string => `No results for '${query}'`
   ```

   Function that returns the string to display when search returned no results.

1. ```ts
   placeholder: string = 'Search'
   ```

   Placeholder shown in the text input before user starts typing.

1. ```ts
   resultCounter = (hits: SearchHit[]): string =>
     hits.length > 0 ? `<span>Results: ${hits.length}<span>` : ``
   ```

   Function that returns a string which will be displayed next to the name of each index to show how many results were found in that index. Return empty string to show nothing.

1. ```ts
   searchKey: string
   ```

   [Search-only API key](https://algolia.com/doc/guides/security/api-keys/#search-only-api-key)

### Events

`Search.svelte` listens for **`on:close`** events on every hit component it renders and will set `hasFocus` to `false` to close itself when received. You can use this e.g. to close the search interface when the user clicks on a link in one of the search results and navigates to a different page on your site:

```svelte
<script>
  import { createEventDispatcher } from 'svelte'

  export let hit

  const dispatch = createEventDispatcher()
</script>

<h3>
  <a href={hit.slug} on:click={() => dispatch(`close`)}>{@html hit.title}</a>
</h3>
<p>{@html hit.body}</p>
```

It also emits a **`focus`** event every the user clicks the search icon and focus enters the text input.

```svelte
<Search on:focus={() => console.log("Let's search!")} />
```

### Styling

`Search.svelte` offers the following CSS variables listed here with their defaults (if any) that can be [passed in directly as props](https://github.com/sveltejs/rfcs/pull/13):

- `var(--iconColor)`
- `var(--headingColor)`
- `var(--inputBg)`
- `var(--inputColor)`
- `var(--hitsBgColor, white)`
- `var(--hitsShadow, 0 0 2pt black)`

For example:

```svelte
<Search
  indices={{ Pages: SearchHit, Posts: SearchHit }}
  {appId}
  {searchKey}
  --hitsBgColor="var(--bodyBg)"
  --inputColor="var(--textColor)"
  --iconColor="var(--linkColor)"
/>
```

The top level element is an `aside` with class `svelte-algolia`. So you can also style the entire DOM tree below it by defining global styles like

```css
:global(aside.svelte-algolia input button svg) {
  /* this would target the search icon */
}
:global(aside.svelte-algolia div.results section h2) {
  /* this would target the heading shown above the list of results for each index */
}
```

## Examples

Some sites using `svelte-algolia` in production:

- [`studenten-bilden-schueler.de`](https://studenten-bilden-schueler.de) [[code](https://github.com/sbsev/svelte-site)]
- [`afara.foundation`](https://afara.foundation) [[code](https://github.com/janosh/afara)]
- [`ocean-artup.eu`](https://ocean-artup.eu) [[code](https://github.com/janosh/ocean-artup)]

Using `svelte-algolia` yourself? [Submit a PR](https://github.com/janosh/svelte-algolia/pulls) to add your site here!

## Want to contribute?

[PRs](https://github.com/janosh/svelte-algolia/pulls) are welcome but best [open an issue](https://github.com/janosh/svelte-algolia/issues/new) first to discuss changes.

The app ID and search key `.env` were intentionally committed so you can clone this repo and work on it without having to create your own index first. To get a dev server running locally so you can try out changes in `src/lib` as you make them, use

```sh
git clone https://github.com/janosh/svelte-algolia
cd svelte-algolia
sed -i.bak 's/name: `Pokedex`/name: `Pokedex Clone`/' svelte.config.js
npm install
npm run dev
```

Note the `sed` command that changes the index name in `site/svelte.config.js` from `'Pokedex'` to `'Pokedex Clone'` so you don't accidentally mess up the search index for [this demo site](https://svelte-algolia.netlify.app) while developing.
