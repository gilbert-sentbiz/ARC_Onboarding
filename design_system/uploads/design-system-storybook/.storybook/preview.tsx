import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import { Title, Subtitle, Description, Stories } from '@storybook/blocks'
import { Global } from '@emotion/react'
import { globalStyle } from 'design-system/styles'
import { Figma } from './blocks/Figma'

import type { Preview } from '@storybook/react'

const GlobalStyles = () => <Global styles={globalStyle} />

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: ['*', 'Foundation', 'Components'],
      },
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle />
          <Description />
          <Figma />
          <Stories title={''} />
        </>
      ),
    },
  },
  decorators: [
    (Story) => (
      <>
        <Global styles={globalStyle} />
        <Story />
      </>
    ),
  ],
}

export default preview

export const decorators = [
  withThemeFromJSXProvider({
    GlobalStyles,
  }),
]
