import { sveltekit } from '@sveltejs/kit/vite'

export default {
  plugins: [sveltekit()],

  server: {
    fs: { allow: [`..`] }, // needed to import readme.md
  },

  test: {
    environment: `jsdom`,
  },
}
