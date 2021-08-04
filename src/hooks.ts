// https://kit.svelte.dev/docs#hooks-getsession
export function getSession(): Record<string, string> {
  const keys = [`ALGOLIA_APP_ID`, `ALGOLIA_SEARCH_KEY`]

  for (const key of keys) {
    if (!process.env[key]) {
      // eslint-disable-next-line no-console
      console.error(`missing secret key: ${key}`)
    }
  }

  const session = Object.fromEntries(keys.map((key) => [key, process.env[key] as string]))

  return session
}
