import { readFileSync } from 'fs'
import { tick } from 'svelte'
import { expect, test } from 'vitest'
import PokemonHit from '../src/components/PokemonHit.svelte'
import Search from '../src/lib/Search.svelte'

const appId = import.meta.env.VITE_ALGOLIA_APP_ID as string
const searchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY as string

const req_props = { appId, searchKey, indices: { Pokedex: PokemonHit } }
const opt_props = { placeholder: `Search Pokedex`, ariaLabel: `Search` }

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

test(`Search focuses input on icon click`, async () => {
  const instance = new Search({
    target: document.body,
    props: { ...req_props, ...opt_props },
  })

  expect(instance).toBeTruthy()

  expect(document.querySelector(`input.hasFocus`)).toBeFalsy()

  const btn = document.querySelector(`button[title='${opt_props.ariaLabel}']`)

  expect(btn).toBeTruthy()

  btn?.click()

  await tick()
  expect(document.querySelector(`input.hasFocus`)).toBeTruthy()
})
