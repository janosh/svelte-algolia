import { sveltekit } from '@sveltejs/kit/vite'
import { resolve } from 'path'
import type { UserConfig } from 'vite'
import type { UserConfig as VitestConfig } from 'vitest'

const vite_config: UserConfig & { test: VitestConfig } = {
  plugins: [sveltekit()],

  test: {
    environment: `jsdom`,
    css: true,
    coverage: {
      // add 'json'/'html' for more detailed reports
      reporter: [`text`, `json-summary`],
    },
  },

  resolve: {
    alias: {
      $site: resolve(`./src/site`),
      $root: resolve(`.`),
    },
  },

  server: {
    fs: { allow: [`..`] }, // needed to import from $root
    port: 3000,
  },

  preview: {
    port: 3000,
  },
}

export default vite_config
