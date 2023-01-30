<script>
  import { repository } from '$root/package.json'
  import Readme from '$root/readme.md'
  import Example from '$site/Example.svelte'
  import Toc from 'svelte-toc'
  import { GitHubCorner } from 'svelte-zoo'
</script>

<Toc
  headingSelector="main > :where(h2, h3)"
  --toc-mobile-bg="black"
  --toc-mobile-btn-color="white"
  --toc-desktop-margin="11em 0 0 0"
/>

<GitHubCorner
  href={repository}
  --zoo-github-corner-color="var(--body-bg)"
  --zoo-github-corner-bg="white"
/>

<main>
  <Readme>
    <Example />
  </Readme>
</main>

<style>
  :global(h1) {
    display: flex;
    font-size: clamp(2rem, 2rem + 2vw, 3rem);
    place-items: center;
    place-content: center;
    margin: 1.2em 0;
  }
  :global(h1 br) {
    display: none;
  }
  @media (max-width: 600px) {
    :global(h1) {
      flex-direction: column;
      gap: 1ex;
    }
  }
  :global(.hide-in-docs) {
    display: none;
  }
</style>
