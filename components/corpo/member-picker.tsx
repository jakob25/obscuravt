'use client'

import { useState, useMemo } from 'react'
import { useVTubers } from '@/hooks/use-data'
import { X } from 'lucide-react'

interface Props {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  label?: string
}

export function MemberPicker({ selectedIds, onChange, label = 'Members' }: Props) {
  const { vtubers } = useVTubers()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return vtubers.slice(0, 20)
    return vtubers.filter(v => v.name.toLowerCase().includes(q)).slice(0, 20)
  }, [vtubers, search])

  const selected = useMemo(
    () => vtubers.filter(v => selectedIds.includes(v.id)),
    [vtubers, selectedIds],
  )

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-vault-cream">{label}</label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map(v => (
            <span
              key={v.id}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-vault-gold/15 text-vault-gold border border-vault-gold/30"
            >
              {v.name}
              <button type="button" onClick={() => toggle(v.id)} className="hover:text-vault-cream">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search VTubers to add…"
        className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground focus:outline-none focus:border-vault-bronze/60"
      />
      <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
        {filtered.map(v => (
          <label
            key={v.id}
            className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/30"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(v.id)}
              onChange={() => toggle(v.id)}
              className="rounded border-border"
            />
            <span className="text-vault-cream truncate">{v.name}</span>
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-xs text-muted-foreground text-center">No matches</p>
        )}
      </div>
    </div>
  )
}