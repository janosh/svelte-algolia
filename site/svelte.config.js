import { config } from 'dotenv'
import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'
import { indexAlgolia } from '../package/src/main.js'
import fs from 'fs'

config({ path: `../.env` })

function loadJsonPokedex() {
  // each pokemon already has an ID so no need to create objectID for algolia
  const json = fs.readFileSync(`../package/tests/fixtures/pokedex.json`, `utf8`)
  return JSON.parse(json)
}

const algoliaConfig = {
  appId: process.env.ALGOLIA_APP_ID,
  apiKey: process.env.ALGOLIA_ADMIN_KEY,
  indices: [{ name: `Pokedex`, getData: loadJsonPokedex }],
  settings: {
    attributesToHighlight: [
      `avgSpawns`,
      `candy`,
      `candyCount`,
      `egg`,
      `height`,
      `multipliers`,
      `name`,
      `nextEvolution.name`,
      `num`,
      `prevEvolution.name`,
      `spawnChance`,
      `spawnTime`,
      `type`,
      `weaknesses`,
      `weight`,
    ],
  },
}

if (process.env.NODE_ENV === `production`) {
  indexAlgolia(algoliaConfig)
}

export default {
  extensions: [`.svelte`, `.svx`],
  preprocess: mdsvex(),
  kit: {
    adapter: adapter(),

    // hydrate the <body> element in src/app.html
    target: `body`,
    vite: {
      ssr: { noExternal: [`svelte-toc`] },
    },
  },
}
