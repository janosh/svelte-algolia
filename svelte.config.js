import adapter from '@sveltejs/adapter-static'
import 'dotenv/config'
import fs from 'fs'
import { s } from 'hastscript'
import { mdsvex } from 'mdsvex'
import linkHeadings from 'rehype-autolink-headings'
import headingSlugs from 'rehype-slug'
import preprocess from 'svelte-preprocess'

const rehypePlugins = [
  headingSlugs,
  [
    linkHeadings,
    {
      test: [`h2`, `h3`, `h4`, `h5`, `h6`], // don't auto-link <h1>
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

if (
  process.env.NODE_ENV === `production` &&
  fs.existsSync(`./package/main.js`)
) {
  const { indexAlgolia } = await import(`./package/main.js`)
  indexAlgolia(algoliaConfig)
}

export default {
  extensions: [`.svelte`, `.svx`],
  preprocess: [preprocess(), mdsvex({ rehypePlugins })],
  kit: {
    adapter: adapter(),

    // hydrate the <body> element in src/app.html
    target: `#svelte`,
  },
}
