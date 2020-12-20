/* eslint-disable no-console */
import algoliasearch from 'algoliasearch'

const defaultConfig = {
  partialUpdates: false,
  verbosity: 1,
  matchFields: [],
  settings: {},
}

export function deepEqual(x, y) {
  return x && y && typeof x === 'object' && typeof x === typeof y
    ? Object.keys(x).length === Object.keys(y).length &&
        Object.keys(x).every((key) => deepEqual(x[key], y[key]))
    : x === y
}

export async function indexAlgolia({ appId, apiKey, indices, ...config }) {
  const client = algoliasearch(appId, apiKey)
  config = { ...defaultConfig, ...config }

  if (config.verbosity > 0) {
    if (config.partialUpdates)
      console.log(`svelte-algolia: Partial updates enabled`)
    console.log(
      `svelte-algolia: ${indices.length} ${
        indices.length > 1 ? `indices` : `index`
      } to update`
    )
  }

  try {
    await Promise.all(indices.map(updateIndex(client, config)))
  } catch (err) {
    console.error(`failed to index to Algolia`, err)
  }
}

const updateIndex = (client, config) => async (indexObj) => {
  const { partialUpdates = false, matchFields: mainMatchFields } = config
  const { name, getData, matchFields = mainMatchFields } = indexObj
  let { settings = config.settings } = indexObj

  const index = client.initIndex(name)
  const data = await callGetter(getData)

  // if user specified any settings, apply them
  if (settings && (await index.exists())) await index.setSettings(settings)
  // if the index doesn't exist yet, applying settings (even if empty) will create it
  // see https://algolia.com/doc/api-client/methods/manage-indices#create-an-index
  else if (!(await index.exists())) {
    const { taskID } = await index.setSettings(settings)
    await index.waitTask(taskID)
  }

  if (partialUpdates) {
    // get all match fields for all indices to minimize calls to the api
    const allMatchFields = [...new Set([...mainMatchFields, ...matchFields])]
    await partialUpdate(index, data, allMatchFields, config)
  } else {
    // if partialUpdates isn't true, overwrite old index with all of data
    await overwriteUpdate(index, data, client, config)
  }
}

async function callGetter(getter) {
  const results = await getter()
  if (results.errors)
    console.error(
      `failed to index to Algolia, ` +
        `errors:\n ${JSON.stringify(results.errors, null, 2)}`
    )

  results.forEach((obj) => {
    if (!obj.objectID && !obj.id)
      console.error(
        `failed to index to svelte-algolia: ${JSON.stringify(obj, null, 2)}` +
          ` has neither an 'objectID' nor 'id' key`
      )
    // convert to string to prevent processing items with integer IDs as new in partialUpdate
    obj.objectID = `${obj.objectID || obj.id}`
  })
  return results
}

async function overwriteUpdate(index, data, client, config) {
  const { indexName: name } = index
  const tmpIndex = client.initIndex(`${name}_tmp`)

  // copy settings from old to new index
  const settings = await index.getSettings()
  await tmpIndex.setSettings(settings)

  await tmpIndex.saveObjects(data).wait()
  // move the tmp index to the existing index, overwrites the latter
  await client.moveIndex(`${name}_tmp`, name).wait()
  if (config.verbosity > 0)
    console.log(`index '${name}': wrote ${data.length} items`)
}

async function partialUpdate(index, data, matchFields, config) {
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
      // id matches existing object, so compare match fields to check if existing object neeeds to be updated
      if (!matchFields.every((field) => newObj[field])) {
        console.error(
          `when partialUpdates is true, the objects must have at least one of the match fields.` +
            `Current object:\n${JSON.stringify(newObj, null, 2)}` +
            `\nexpected one of these fields:\n${matchFields.join(`\n`)}`
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
        `index '${name}': found ${toIndex.length} new or modified objects; indexing...`
      )
    if (config.verbosity > 1) console.log(JSON.stringify(toIndex, null, 2))
    await index.saveObjects(toIndex).wait()
  }

  if (toRemove.length) {
    if (config.verbosity > 0)
      console.log(
        `index '${name}': found ${toRemove.length} stale objects; removing...`
      )
    if (config.verbosity > 1) console.log(JSON.stringify(toRemove, null, 2))
    await index.deleteObjects(toRemove)
  }

  if (!toIndex.length && !toRemove.length)
    if (config.verbosity > 0)
      console.log(`index '${name}': no updates necessary; skipping!`)
    else if (config.verbosity > 0) console.log(`index '${name}': done updating`)
}

// Fetches all records for the current index from Algolia
async function fetchExistingData(index, attributesToRetrieve) {
  const hits = []
  await index.browseObjects({
    query: ``, // Empty query matches all records
    batch: (batch) => hits.push(...batch),
    attributesToRetrieve,
  })
  return hits
}
