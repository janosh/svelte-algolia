<script>
  export let hit
</script>

<h2>{@html hit.name}</h2>

<div>
  <ul>
    <li>Type: {@html hit.type.join(`, `)}</li>
    <li>Height: {@html hit.height}</li>
    <li>Weight: {@html hit.weight}</li>
    <li>Weaknesses: {@html hit.weaknesses.join(`, `)}</li>
    {#if hit.nextEvolution}
      <li>Evolutions: {@html hit.nextEvolution.map((el) => el.name).join(`, `)}</li>
    {/if}
    {#if hit.prevEvolution}
      <li>
        Previous Evolutions: {@html hit.prevEvolution.map((el) => el.name).join(`, `)}
      </li>
    {/if}
  </ul>
  <img src={hit.img} alt={hit.nameOrig} />
</div>

<style>
  /* highlights text matching the search string */
  :global(em) {
    color: darkcyan;
    line-height: 1.2em;
    border-radius: 3pt;
    font-style: normal;
  }
  div {
    display: flex;
    justify-content: space-between;
  }
</style>
