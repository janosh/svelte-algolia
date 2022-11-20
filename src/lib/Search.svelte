<script lang="ts">
  import type { Hit } from '@algolia/client-search'
  import type { SearchClient } from 'algoliasearch/lite'
  import algoliasearch from 'algoliasearch/lite'
  import { onMount, SvelteComponent } from 'svelte'
  import SearchIcon from './SearchIcon.svelte'

  export let appId: string
  export let ariaLabel: string = `Search`
  export let hasFocus: boolean = false
  export let indices:
    | Record<string, typeof SvelteComponent>
    | [string, typeof SvelteComponent][] // [indexName, component to render search results from that index]
  export let input: HTMLInputElement | null = null
  export let loadingMsg: string = `Searching...`
  export let noResultMsg = (query: string): string => `No results for '${query}'`
  export let placeholder: string = `Search`
  export let query: string = ``
  export let resultCounter = (hits: SearchHit[]): string =>
    hits.length > 0 ? `<span>Results: ${hits.length}<span>` : ``
  export let searchKey: string

  type SearchHit = Hit<Record<string, unknown>>

  for (let [key, val] of Object.entries({ appId, searchKey, indices })) {
    if (!val) console.error(`svelte-algolia: Invalid ${key}: ${val}`)
  }

  $: _indices = Array.isArray(indices) ? Object.fromEntries(indices) : indices

  let client: SearchClient
  let aside: HTMLElement
  let promise: Promise<{ index: string | undefined; hits: SearchHit[] }[]>

  onMount(() => (client = algoliasearch(appId, searchKey)))

  function processHits(hits: SearchHit[]) {
    return hits.map((hit) => {
      for (const [key, val] of Object.entries(hit)) {
        if (key.endsWith(`Orig`)) continue
        const processedVal =
          hit?._snippetResult?.[key]?.value || hit?._highlightResult?.[key]?.value
        if (processedVal) {
          hit[`${key}Orig`] = val
          hit[key] = processedVal
        }
      }
      return hit
    })
  }

  async function search() {
    const { results } = await client.search(
      Object.keys(_indices).map((indexName) => ({ indexName, query }))
    )

    return results.map(({ hits, index }) => ({ hits: processHits(hits), index }))
  }

  function close(event: MouseEvent) {
    if (!aside.contains(event.target as Node)) hasFocus = false
  }
</script>

<svelte:window on:click={close} />

<aside class="svelte-algolia" bind:this={aside}>
  <input
    type="text"
    bind:this={input}
    bind:value={query}
    on:keyup={() => (promise = search())}
    on:focus
    on:blur
    {placeholder}
    aria-label={ariaLabel}
    class:hasFocus
  />
  <button
    on:click={() => {
      hasFocus = true
      input.focus()
    }}
    title={ariaLabel}
  >
    <SearchIcon
      ariaLabel="Search Icon"
      height="{hasFocus ? 1.9 : 2.3}ex"
      style="cursor: pointer;"
    />
  </button>
  {#if hasFocus && query}
    <div class="results">
      {#await promise}
        <p>{loadingMsg}</p>
      {:then all_hits}
        {#if all_hits?.some(({ hits }) => hits.length)}
          {#each all_hits as { index: index_name, hits } (index_name)}
            {#if hits.length}
              <section>
                <h2>
                  {index_name}
                  {@html resultCounter(hits)}
                </h2>
                {#each hits as hit (hit.objectID)}
                  <svelte:component
                    this={_indices[index_name]}
                    {hit}
                    on:close={() => (hasFocus = false)}
                  />
                {/each}
              </section>
            {/if}
          {/each}
        {:else}{@html noResultMsg(query)}{/if}
      {/await}
    </div>
  {/if}
</aside>

<style>
  :where(aside.svelte-algolia) {
    position: relative;
    display: flex;
    flex-direction: row-reverse;
  }
  :where(button) {
    color: var(--search-icon-color);
    align-items: center;
    padding: 0;
    grid-area: search;
    position: relative;
    background: transparent;
    border: none;
    font-size: 2ex;
  }
  :where(h2) {
    color: var(--search-heading-color);
    border-bottom: 1px solid;
    text-align: center;
    position: relative;
  }
  :where(h2 :global(span)) {
    position: absolute;
    font-size: 1ex;
    bottom: 0;
    right: 0;
  }
  :where(input) {
    background: var(--search-input-bg);
    color: var(--search-input-color);
    font-size: var(--search-input-font-size, 1em);
    border-radius: 5pt;
    border: 0;
    outline: none;
    width: 0;
    cursor: pointer;
    transition: 0.3s;
    opacity: 0;
    padding: 0;
    height: 2.5ex;
    line-height: inherit;
  }
  :where(input.hasFocus) {
    opacity: 1;
    width: 8em;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.2);
    padding: 1pt 4pt 1pt 3ex;
    margin-left: -2.5ex;
    border-radius: 3pt;
  }
  :where(input::placeholder) {
    color: var(--search-input-color);
  }
  :where(input.hasFocus + button) {
    color: var(--search-input-color);
  }
  :where(div.results) {
    background-color: var(--search-hits-bg-color, white);
    box-shadow: var(--search-hits-shadow, 0 0 2pt black);
    z-index: 1;
    top: 3ex;
    max-height: 60vh;
    position: absolute;
    width: max-content;
    box-sizing: border-box;
    max-width: 80vw;
    overflow: auto;
    right: 0;
    padding: 1ex 1em;
    border-radius: 5pt;
    overscroll-behavior: none;
    overflow-wrap: break-word;
  }
  :where(section) {
    font-size: 0.7em;
    white-space: initial;
    width: 100%;
    max-width: 40em;
  }
</style>
