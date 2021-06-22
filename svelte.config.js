import 'dotenv/config'
import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'
import { indexAlgolia } from './src/lib/main.js'
import fs from 'fs'

import headingSlugs from 'rehype-slug'
import linkHeadings from 'rehype-autolink-headings'
import { s } from 'hastscript'

const rehypePlugins = [
  headingSlugs,
  [
    linkHeadings,
    {
      behavior: `append`,
      content: s(
        `svg`,
        { width: 16, height: 16, viewBox: `0 0 16 16` },
        // symbol #octicon-link defined in app.html
        s(`use`, { 'xlink:href': `#octicon-link` })
      ),
    },
  ],
]

function loadJsonPokedex() {
  // each pokemon already has an ID so no need to create objectID for algolia
  const json = fs.readFileSync(`tests/fixtures/pokedex.json`, `utf8`)
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
  preprocess: mdsvex({ rehypePlugins }),
  kit: {
    adapter: adapter(),

    // hydrate the <body> element in src/app.html
    target: `#svelte`,

    vite: {
      ssr: { noExternal: [`svelte-toc`] },
    },
  },
}
