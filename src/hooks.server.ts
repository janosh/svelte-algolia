import { dev } from '$app/environment'
import { indexAlgolia } from '$lib/server-side'
import pokedex from '$site/pokedex.json'
import 'dotenv/config'

const appId = process.env.VITE_ALGOLIA_APP_ID
const apiKey = process.env.ALGOLIA_ADMIN_KEY

// only update Algolia indices if required env vars are defined
if (dev === false && appId && apiKey) {
  // update Algolia search indices on production builds
  const algoliaConfig = {
    appId,
    apiKey,
    indices: [{ name: `Pokedex`, getData: () => pokedex }],
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
  indexAlgolia(algoliaConfig)
}
