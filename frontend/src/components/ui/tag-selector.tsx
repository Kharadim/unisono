import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { TAG_COLORS, cn } from '@/lib/utils'
import type { TagDefinition } from '@/types'

interface TagSelectorProps {
  selected: string[]
  onChange: (tags: string[]) => void
  compact?: boolean
}

export function TagSelector({ selected, onChange, compact }: TagSelectorProps) {
  const { data: tags = [] } = useQuery<TagDefinition[]>({
    queryKey: ['tags'],
    queryFn: api.getTags,
  })

  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter(t => t !== name))
    } else {
      onChange([...selected, name])
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(tag => {
        const active = selected.includes(tag.name)
        const colors = TAG_COLORS[tag.color] || TAG_COLORS.blue
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.name)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border transition-colors',
              compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
              active
                ? `${colors.bg} ${colors.text} border-current/20`
                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', active ? colors.dot : 'bg-muted-foreground/40')} />
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}

interface TagPillsProps {
  tags: string
  compact?: boolean
}

export function TagPills({ tags, compact }: TagPillsProps) {
  const { data: tagDefs = [] } = useQuery<TagDefinition[]>({
    queryKey: ['tags'],
    queryFn: api.getTags,
  })

  if (!tags) return null

  const tagNames = tags.split(',').map(t => t.trim()).filter(Boolean)
  if (tagNames.length === 0) return null

  const tagMap = new Map(tagDefs.map(t => [t.name, t]))

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {tagNames.map(name => {
        const def = tagMap.get(name)
        const colors = TAG_COLORS[def?.color || 'blue'] || TAG_COLORS.blue
        return (
          <span
            key={name}
            className={cn(
              'inline-flex items-center gap-1 rounded-full',
              compact ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs',
              colors.bg, colors.text
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
            {name}
          </span>
        )
      })}
    </div>
  )
}
