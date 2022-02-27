import { readFileSync } from 'fs'
import { expect, test } from 'vitest'
import PokemonHit from '../src/components/PokemonHit.svelte'
import Search from '../src/lib/Search.svelte'

const appId = import.meta.env.VITE_ALGOLIA_APP_ID as string
const searchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY as string

const req_props = { appId, searchKey, indices: { Pokedex: PokemonHit } }

test(`readme documents all props`, () => {
  const readme = readFileSync(`readme.md`, `utf8`)

  const instance = new Search({
    target: document.body,
    props: req_props,
  })

  for (const prop of Object.keys(instance.$$.props)) {
    expect(readme).to.contain(`\n| \`${prop}\``)
  }
})
