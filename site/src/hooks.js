// https://kit.svelte.dev/docs#hooks-getsession
/** @type {import('@sveltejs/kit').GetSession} */
export function getSession() {
  const keys = [`ALGOLIA_APP_ID`, `ALGOLIA_SEARCH_KEY`]

  const session = Object.fromEntries(keys.map((key) => [key, process.env[key]]))

  return session
}
