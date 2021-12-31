import algoliasearch from 'algoliasearch'
import test from 'ava'
import 'dotenv/config'
import { indexAlgolia } from '../package/main.js'
// data from https://git.io/J3hvR
import pokedex from './fixtures/pokedex.json' assert { type: 'json' }

const { ALGOLIA_APP_ID: appId, ALGOLIA_ADMIN_KEY: apiKey } = process.env
const client = algoliasearch(appId, apiKey)

const indices = [{ name: `Pokedex`, getData: () => pokedex }]
const config = { appId, apiKey, indices }

async function resetApp() {
  const { items } = await client.listIndices()
  const ops = items.map((idx) => ({ indexName: idx.name, action: `delete` }))
  await client.multipleBatch(ops).wait()
}

test.serial.beforeEach(async (t) => {
  await resetApp()
  const { items } = await client.listIndices()
  t.is(items.length, 0)
})

const assertIndex = async (t) => {
  const { items } = await client.listIndices()
  const indexObj = items.find((idx) => idx.name === `Pokedex`)

  // assert number of items in index matches those returned by getData function
  t.is(indexObj.entries, pokedex.length)

  const index = client.initIndex(`Pokedex`)
  const { hits } = await index.search(`Caterpie`)

  // assert every key in local object also exists in indexed object
  const indexedCaterpie = hits.find((itm) => itm.name === `Caterpie`)
  const localCaterpie = pokedex.find((itm) => itm.name === `Caterpie`)

  // does not hold when swapping local and indexed Caterpie
  // as Algolia adds new keys in returned hits
  t.true(Object.keys(localCaterpie).every((key) => indexedCaterpie[key]))
}

test.serial(`can create an index in overwrite mode`, async (t) => {
  await indexAlgolia(config)
  await assertIndex(t)
})

test.serial(`can create an index in partialUpdate mode`, async (t) => {
  await indexAlgolia({ ...config, partialUpdates: true })
  await assertIndex(t)
})
