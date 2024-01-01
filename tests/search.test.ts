import Search from '$lib'
import PokemonHit from '$site/PokemonHit.svelte'
import { tick } from 'svelte'
import { describe, expect, test } from 'vitest'

const appId = process.env.VITE_ALGOLIA_APP_ID as string
const searchKey = process.env.VITE_ALGOLIA_SEARCH_KEY as string

const required_props = { appId, searchKey, indices: { Pokedex: PokemonHit } }
const ariaLabel = `Custom label`
const placeholder = `Search Pokedex`

test(`Search focuses input on icon click`, async () => {
  const instance = new Search({
    target: document.body,
    props: { ...required_props, ariaLabel },
  })

  expect(instance).toBeTruthy()

  expect(document.querySelector(`input.hasFocus`)).toBeFalsy()

  const btn = document.querySelector(
    `button[title='${ariaLabel}']`,
  ) as HTMLButtonElement

  btn?.click()

  await tick()
  expect(document.querySelector(`input.hasFocus`)).toBeTruthy()
})

describe(`Search`, () => {
  test(`renders custom title`, async () => {
    const search = new Search({
      target: document.body,
      props: { ...required_props, ariaLabel, placeholder },
    })

    expect(search).toBeTruthy()

    expect(
      document.querySelector(`input[aria-label='${ariaLabel}']`),
    ).toBeTruthy()

    expect(
      document.querySelector(`input[placeholder='${placeholder}']`),
    ).toBeTruthy()
  })
})
