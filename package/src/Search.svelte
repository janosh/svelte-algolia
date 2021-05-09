<script>
  import { onMount } from 'svelte'
  import algoliasearch from 'algoliasearch/lite.js'

  import SearchIcon from './SearchIcon.svelte'
  import { onClickOutside } from './actions'

  export let appId, searchKey, indices
  export let loadingStr = `Searching...`
  export let noResultMsg = (query) => `No results for '${query}'`
  export let resultReporter = (hits) =>
    hits.length > 0 ? `<span>Results: ${hits.length}<span>` : ``
  export let placeholder = `Search`
  export let ariaLabel = `Search`

  for (let [key, val] of Object.entries({ appId, searchKey, indices })) {
    if (!val) console.error(`Invalid ${key}: ${val}`)
  }

  let client, input, query, promise
  let hasFocus = false

  onMount(() => (client = algoliasearch(appId, searchKey)))

  const processHits = (hits) =>
    hits.map((hit) => {
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

  async function search() {
    const { results } = await client.multipleQueries(
      Object.keys(indices).map((indexName) => ({ indexName, query }))
    )

    return results.map(({ hits, index }) => ({ hits: processHits(hits), index }))
  }
</script>

<aside use:onClickOutside={() => (hasFocus = false)}>
  <input
    type="text"
    bind:this={input}
    bind:value={query}
    on:keyup={() => (promise = search())}
    {placeholder}
    aria-label={ariaLabel}
    class:hasFocus />
  <button
    on:click={() => {
      hasFocus = true
      input.focus()
    }}
    title={ariaLabel}>
    <SearchIcon
      alt="Search Icon"
      height="{hasFocus ? 1.9 : 2.3}ex"
      style="cursor: pointer;" />
  </button>
  {#if hasFocus && query}
    <div class="results">
      {#await promise}
        <p>{loadingStr}</p>
      {:then allHits}
        {#if allHits?.some(({ hits }) => hits.length)}
          {#each allHits as { index, hits } (index)}
            {#if hits.length}
              <section>
                <h2>
                  {index}
                  {@html resultReporter(hits)}
                </h2>
                {#each hits as hit (hit.objectID)}
                  <svelte:component this={indices[index]} {hit} />
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
  aside {
    position: relative;
    display: flex;
    flex-direction: row-reverse;
  }
  button {
    align-items: center;
    padding: 0;
    grid-area: search;
    color: var(--headerColor);
    position: relative;
    background: transparent;
    border: none;
    font-size: 2ex;
  }
  h2 {
    color: var(--headingColor);
    border-bottom: 1px solid;
    text-align: center;
    position: relative;
  }
  h2 :global(span) {
    position: absolute;
    font-size: 1ex;
    bottom: 0;
    right: 0;
  }
  input {
    font-size: 1em;
    background: var(--bodyBg);
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
    color: var(--lightGray);
  }
  input.hasFocus {
    opacity: 1;
    width: 8em;
    background: rgba(0, 0, 0, 0.2);
    padding: 1pt 4pt 1pt 3ex;
    margin-left: -2.5ex;
    border-radius: 3pt;
  }
  input::placeholder {
    color: var(--lightGray);
  }
  input.hasFocus + button {
    color: var(--lightGray);
  }
  div.results {
    min-width: 15em;
    z-index: 1;
    background: black;
    top: 3ex;
    max-height: 60vh;
    position: absolute;
    width: max-content;
    max-width: 80vw;
    overflow: auto;
    right: 0;
    box-shadow: 0 0 1ex black;
    padding: 1ex 1em;
    border-radius: 5pt;
    overscroll-behavior: none;
    overflow-wrap: break-word;
  }
  section {
    font-size: 0.7em;
    white-space: initial;
    width: 100%;
    max-width: 40em;
  }
</style>
