<p align="center">
  <img src="assets/banner.svg" alt="Banner" height=150>
</p>

# svelte-algolia &nbsp; [![Test Status](https://github.com/janosh/svelte-algolia/workflows/Tests/badge.svg)](https://github.com/janosh/svelte-algolia/actions) ![NPM version](https://img.shields.io/npm/v/svelte-algolia?color=blue&logo=NPM) ![GitHub](https://img.shields.io/github/license/janosh/svelte-algolia)

This package was inspired by [`gatsby-plugin-algolia`](https://github.com/algolia/gatsby-plugin-algolia).

## Usage

1. Install with `yarn` or `npm`

   ```sh
   yarn add -D svelte-algolia
   ```

   ```sh
   npm i -D svelte-algolia
   ```

2. Create an `algoliaConfig` object:

   ```js
   import 'dotenv/config' // optional

   const algoliaConfig = {
     appId: process.env.algoliaAppId,
     apiKey: process.env.algoliaAdminKey,
     indices: [
       { name: `pokedex`, getData: pokemonDataLoader },
       { name: `hitchHikersGuide`, getData: guideGetter },
     ],
   }
   ```

   The `getData` function is expected to return an array of objects containing the data you wish to index (a product catalog, blog posts, documentation pages, pokémons or whatever). Each object in the data array should have a key named `id` or `objectID` for Algolia to recognize it and overwrite existing data where appropriate.

3. Pass your config to `indexAlgolia`:

   ```js
   import { indexAlgolia } from 'svelte-algolia'

   indexAlgolia(algoliaConfig)
   ```

   You can call this function wherever you'd like to update your indices. Typically, you would include this in every production build of your app.

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
  settings: {}, // an object of Algolia index settings that applies to all indices
  // see https://algolia.com/doc/api-reference/settings-api-parameters for available options
  // can be overridden for individual indices by passing a settings object as part of the indices array:
  // indices = [{ name: `pokedex`, ..., settings: { foo: `bar` }}],
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

PRs are welcome but best [open an issue](https://github.com/janosh/svelte-algolia/issues/new/choose) first to discuss changes.
