/* eslint-disable no-console */
import type {
  ObjectWithObjectID,
  Settings as IndexSettings,
} from '@algolia/client-search'
import type { SearchClient, SearchIndex } from 'algoliasearch'
import algoliasearch from 'algoliasearch'

type MaybePromise<T> = T | Promise<T> | PromiseLike<T>

const defaultConfig = {
  partialUpdates: false,
  verbosity: 1,
  matchFields: [],
  settings: {},
}

export type IndexConfig = {
  name: string
  getData(): MaybePromise<
    // getData can return any array of objects but each must have a key id, _id or objectID
    ({
      [key: string]: unknown
    } & ({ id: unknown } | { _id: unknown } | { objectID: unknown }))[]
  >
  settings?: IndexSettings
  matchFields?: string[]
}

export type Options = {
  verbosity: number
  partialUpdates: boolean
  matchFields: string[]
  settings: IndexSettings
}

export type Config = {
  appId: string
  apiKey: string
  indices: IndexConfig[]
} & Partial<Options>
// Partial<T> makes all keys in T optional

export function deepEqual(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
): boolean {
  return obj1 && obj2 && typeof obj1 === `object` && typeof obj1 === typeof obj2
    ? Object.keys(obj1).length === Object.keys(obj2).length &&
        Object.keys(obj1).every((key) => deepEqual(obj1[key], obj2[key]))
    : obj1 === obj2
}

export async function indexAlgolia({
  appId,
  apiKey,
  indices,
  ...rest
}: Config): Promise<void> {
  const client = algoliasearch(appId, apiKey)
  const config = { ...defaultConfig, ...rest }

  if (config.verbosity > 0) {
    if (config.partialUpdates)
      console.log(`svelte-algolia: Partial updates enabled`)
    console.log(
      `svelte-algolia: ${indices.length} ${
        indices.length > 1 ? `indices` : `index`
      } to update`,
    )
  }

  try {
    await Promise.all(indices.map(updateIndex(client, config)))
  } catch (err) {
    console.error(`failed to index to Algolia`, err)
  }
}

const updateIndex = (client: SearchClient, config: Options) => {
  return async (indexConfig: IndexConfig) => {
    const { partialUpdates = false, matchFields: mainMatchFields } = config

    const { name, getData, matchFields = mainMatchFields } = indexConfig
    const { settings = config.settings || {} } = indexConfig

    const index = client.initIndex(name)
    const data = await callGetter(getData)

    // if user specified any settings, apply them
    // if the index doesn't exist yet, applying settings (even if empty) will create it
    // see https://algolia.com/doc/api-client/methods/manage-indices#create-an-index
    const { taskID } = await index.setSettings(settings)
    await index.waitTask(taskID)

    if (partialUpdates) {
      // get all match fields for all indices to minimize calls to the api
      const allMatchFields = [...new Set([...mainMatchFields, ...matchFields])]
      await partialUpdate(index, data, allMatchFields, config)
    } else {
      // if partialUpdates isn't true, overwrite old index with all of data
      await overwriteUpdate(index, data, client, config)
    }
  }
}

async function callGetter(
  getter: IndexConfig[`getData`],
): Promise<ObjectWithObjectID[] | void> {
  try {
    const results = await getter()

    results.forEach((obj: { [key: string]: unknown }) => {
      if (!obj.objectID && !obj.id && !obj._id)
        console.error(
          `failed to index to svelte-algolia: ${JSON.stringify(obj, null, 2)}` +
            ` has neither an 'objectID' nor 'id' key`,
        )
      // convert to string to prevent processing items with integer IDs as new in partialUpdate
      obj.objectID = `${obj.objectID || obj.id || obj._id}`
    })

    return results
  } catch (err) {
    console.error(`failed to index to Algolia due to ${err}`)
  }
}

async function overwriteUpdate(
  index: SearchIndex,
  data: ObjectWithObjectID[],
  client: SearchClient,
  config: Options,
) {
  const { indexName: name } = index
  try {
    const tmpIndex = client.initIndex(`${name}_tmp`)

    // copy settings from old to new index
    const settings = await index.getSettings()
    await tmpIndex.setSettings(settings)

    await tmpIndex.saveObjects(data).wait()
    // move the tmp index to the existing index, overwrites the latter
    await client.moveIndex(`${name}_tmp`, name).wait()
    if (config.verbosity > 0)
      console.log(`index '${name}': wrote ${data.length} items`)
  } catch (err) {
    console.error(err)
    // clean up by removing temporary index in case of errors
    await client.moveIndex(`${name}_tmp`, name).wait()
  }
}

async function partialUpdate(
  index: SearchIndex,
  data: ObjectWithObjectID[],
  matchFields: string[],
  config: Options,
) {
  const { indexName: name } = index
  const existingObjects = await fetchExistingData(index, matchFields)

  const existingIDs = existingObjects.map((obj) => obj.objectID)
  const newIDs = data.map((obj) => obj.objectID)

  // objects to be added/updated
  const toIndex = data.filter((newObj) => {
    const { objectID: id } = newObj
    // object with new ID, needs to be indexed
    if (!existingIDs.includes(id)) return true

    if (matchFields) {
      // id matches existing object, so compare match fields to check if existing object needs to be updated
      if (!matchFields.every((field) => newObj[field])) {
        console.error(
          `when partialUpdates is true, the objects must have at least one of the match fields.` +
            `Current object:\n${JSON.stringify(newObj, null, 2)}` +
            `\nexpected one of these fields:\n${matchFields.join(`\n`)}`,
        )
      }
      const existingObj = existingObjects.find((obj) => obj.objectID === id)
      // check if one or more fields differ, if so update object
      if (matchFields.some((field) => existingObj[field] !== newObj[field]))
        return true
    } else {
      // if user did not specify matchFields compare entire object for differences
      if (!deepEqual(oldObj, newObj)) {
        return true
      }
    }
    return false // neither new nor changed object, no need to index
  })

  // stale objects to be removed
  const toRemove = existingIDs.filter((id) => !newIDs.includes(id))

  if (toIndex.length) {
    if (config.verbosity > 0)
      console.log(
        `index '${name}': found ${toIndex.length} new or modified objects; indexing...`,
      )
    if (config.verbosity > 1) console.log(JSON.stringify(toIndex, null, 2))
    await index.saveObjects(toIndex).wait()
  }

  if (toRemove.length) {
    if (config.verbosity > 0)
      console.log(
        `index '${name}': found ${toRemove.length} stale objects; removing...`,
      )
    if (config.verbosity > 1) console.log(JSON.stringify(toRemove, null, 2))
    await index.deleteObjects(toRemove)
  }

  if (config.verbosity > 0) {
    if (toIndex.length === 0 && toRemove.length === 0) {
      console.log(`index '${name}': no updates necessary; skipping!`)
    } else {
      console.log(`index '${name}': done updating`)
    }
  }
}

// Fetches all records for the current index from Algolia
async function fetchExistingData(
  index: SearchIndex,
  attributesToRetrieve: string[],
) {
  const hits: ObjectWithObjectID[] = []
  await index.browseObjects({
    query: ``, // Empty query matches all records
    batch: (batch) => hits.push(...batch),
    attributesToRetrieve,
  })
  return hits
}
