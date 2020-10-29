<p align="center">
  <img src="assets/banner.svg" alt="Banner" height=150>
</p>

# svelte-algolia

[![Test Status](https://github.com/janosh/svelte-algolia/workflows/ci/badge.svg)](https://github.com/janosh/svelte-algolia/actions)

This package was inspired by the official [`gatsby-plugin-algolia`](https://github.com/algolia/gatsby-plugin-algolia).

## Usage

1. Install with `yarn` or `npm`

   ```sh
   yarn add -D svelte-algolia
   ```

   ```sh
   npm i -D svelte-algolia
   ```

2. Create an `algoliaConfig`:

   ```js
   const algoliaConfig = {
     appId: process.env.algoliaAppId,
     apiKey: process.env.algoliaAdminKey,
     indices: [
       { name: `pokedex`, getData: pokemonDataLoader },
       { name: `hitchHikersGuide`, getData: guideGetter },
     ],
   }
   ```

3. Pass your config to the `indexAlgolia` export from this package:

   ```js
   import { indexAlgolia } from 'svelte-algolia'

   indexAlgolia(algoliaConfig)
   ```

## Config Options

```js
const defaultConfig = {
  verbosity: 1, // 0, 1 or 2 for no/some/lots of logging
  partialUpdates: false, // if true, figures out diffs between existing
  // items and new ones and only uploads changes, otherwise, completely
  // overwrites each index on every call to indexAlgolia()
  matchFields: [], // (only used when partialUpdates is true) keys of fields to
  // check for whether an item has changed; could e.g. be a timestamp, hash or
  // an ID that's updated every time the item has changed; if not provided, items
  // are checked for deep-equality to discover changes
}
```

## As a `rollup` plugin

To use this package as part of a `rollup` build (e.g. in a Svelte or Sapper app), simply include it in your `plugins` array:

```js
// rollup.config.js
import { indexAlgolia } from 'svelte-algolia'

const algoliaConfig = {
  // see above
}

// check if running in build or development mode
const dev = process.env.NODE_ENV === `development`

export default {
  input: './src/index.js',
  output: {
    file: './build/bundle.js',
    format: 'iife',
    name: 'bundle'
    plugins: [
      // to save Algolia indexing operations, you may want to only
      // update your indices when building your app for production
      !dev && indexAlgolia(algoliaConfig),
    ]
  }
}
```

## Contribute

PRs are welcome but best [open an issue](https://github.com/janosh/svelte-algolia/issues/new/choose) first to discuss any changes.
