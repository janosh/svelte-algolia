import IndexToc from '$lib'
import Toc from '$lib/Search.svelte'
import { expect, test } from 'vitest'

test(`src/lib/index.ts default export is Toc component`, () => {
  expect(IndexToc).toBe(Toc)
})
