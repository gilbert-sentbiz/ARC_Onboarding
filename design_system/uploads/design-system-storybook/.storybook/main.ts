import type { StorybookConfig } from '@storybook/react-webpack5'
import { dirname, join } from 'path'

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, 'package.json')))
}

const config: StorybookConfig = {
  stories: [
    '../../../packages/design-system/src/tokens/**/*.mdx',
    '../../../packages/design-system/src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@storybook/addon-webpack5-compiler-swc'),
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-interactions'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-webpack5'),
    options: {},
  },
  swc: () => ({
    jsc: {
      transform: {
        react: {
          runtime: 'automatic',
        },
      },
    },
  }),
  webpackFinal: async (config) => {
    config.resolve = config.resolve || {}
    config.resolve.plugins = config.resolve?.plugins || []

    // Add support for emotion
    config.module = config.module || {}
    config.module.rules = config.module.rules || []

    const use = {
      loader: 'babel-loader',
      options: {
        presets: [
          '@babel/preset-env',
          '@babel/preset-typescript',
          '@emotion/babel-preset-css-prop',
        ],
        plugins: ['@emotion', 'react-require'],
      },
    }
    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use,
    })

    config.module.rules.push({
      test: /\.tsx?$/,
      include: /design-system/,
      use,
    })

    return config
  },
}
export default config
