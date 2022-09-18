import { indexAlgolia } from '$lib/server-side'
import algoliasearch from 'algoliasearch'
import 'dotenv/config'
import { beforeEach, expect, test } from 'vitest'
// data from https://git.io/J3hvR
import pokedex from './fixtures/pokedex.json'

const { VITE_ALGOLIA_APP_ID: appId, ALGOLIA_ADMIN_KEY: apiKey } = process.env
const client = algoliasearch(appId, apiKey)

const indices = [{ name: `Pokedex`, getData: () => pokedex }]
const config = { appId, apiKey, indices }

async function resetApp() {
  const { items } = await client.listIndices()
  const ops = items.map((idx) => ({ indexName: idx.name, action: `delete` }))
  await client.multipleBatch(ops).wait()
}

beforeEach(async () => {
  await resetApp()
  const { items } = await client.listIndices()
  expect(items.length).toBe(0)
})

const assertIndex = async () => {
  const { items } = await client.listIndices()
  const indexObj = items.find((idx) => idx.name === `Pokedex`)

  // assert number of items in index matches those returned by getData function
  expect(indexObj.entries).toBe(pokedex.length)

  const index = client.initIndex(`Pokedex`)
  const { hits } = await index.search(`Caterpie`)

  // assert every key in local object also exists in indexed object
  const indexedCaterpie = hits.find((itm) => itm.name === `Caterpie`)
  const localCaterpie = pokedex.find((itm) => itm.name === `Caterpie`)

  // does not hold when swapping local and indexed Caterpie
  // as Algolia adds new keys in returned hits
  expect(Object.keys(localCaterpie).every((key) => indexedCaterpie[key])).toBe(
    true
  )
}

test(`can create an index in overwrite mode`, async () => {
  await indexAlgolia(config)
  await assertIndex()
})

test(`can create an index in partialUpdate mode`, async () => {
  await indexAlgolia({ ...config, partialUpdates: true })
  await assertIndex()
})
