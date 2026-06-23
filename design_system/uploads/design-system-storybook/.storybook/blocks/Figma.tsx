import { useOf } from '@storybook/blocks'
import { Button } from 'design-system/components'
import { SiFile } from 'design-system/icons'

export const Figma = ({ of }: { of?: string }) => {
  const resolvedOf = useOf(of || 'story', ['story', 'meta'])
  switch (resolvedOf.type) {
    case 'story': {
      if (!resolvedOf.story.parameters.docs.figma) return null

      return (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            window.open(resolvedOf.story.parameters.docs?.figma, '_blank')
          }}
        >
          <SiFile />
          Figma
        </Button>
      )
    }
    case 'meta': {
      return <a>{resolvedOf.preparedMeta.title}</a>
    }
  }

  return null
}
