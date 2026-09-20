'use client'

import { useMemo } from 'react'
import { useStoredValue } from '@/hooks/use-stored-value'
import { ShieldCheck, Layers } from 'lucide-react'
import type { Topic } from '@/lib/data/roadmaps'

interface TopicChecklistProps {
  topics: Topic[]
  stageId: number
  track: string
}

export function TopicChecklist({ topics, stageId, track }: TopicChecklistProps) {
  const [saved, setSaved] = useStoredValue(`roadmap-${track}-stage-${stageId}`)
  const checkedItems = useMemo<Record<string, boolean>>(() => {
    try {
      const parsed: unknown = JSON.parse(saved || '{}')
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
      return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === 'boolean'))
    } catch { return {} }
  }, [saved])

  const toggleCheck = (topicName: string, subtopic: string) => {
    const key = `${topicName}-${subtopic}`
    setSaved(JSON.stringify({ ...checkedItems, [key]: !checkedItems[key] }))
  }

  return (
    <div className="space-y-12">
      {topics.map((topic, index) => (
        <div key={index} className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-accent-primary">{index + 1}.</span> {topic.name}
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Prerequisites */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Prerequisites (Familiar?)
              </h3>
              {topic.prerequisites.length > 0 ? (
                <div className="space-y-4">
                  {topic.prerequisites.map((req, i) => (
                    <div key={i} className="bg-muted/20 border border-border/50 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-muted/40 border-b border-border/50 font-medium text-sm text-foreground">
                        {req.name}
                      </div>
                      <ul className="divide-y divide-border/30">
                        {req.subtopics.map((sub, j) => {
                          const key = `${topic.name}-prereq-${req.name}-${sub}`
                          const isChecked = !!checkedItems[key]
                          
                          return (
                            <li key={j}>
                                <label className={`flex items-center gap-3 text-sm px-4 py-2.5 transition-all cursor-pointer select-none hover:bg-muted/50 ${
                                isChecked ? 'bg-emerald-500/5' : ''
                              }`}
                            >
                              <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(`${topic.name}-prereq-${req.name}`, sub)} className="h-5 w-5 shrink-0 accent-accent-primary" />
                              <span className={`${isChecked ? 'text-muted-foreground line-through decoration-emerald-500/50' : ''}`}>
                                {sub}
                              </span>
                                </label>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No specific prerequisites.</p>
              )}
            </div>

            {/* Subtopics */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Subtopics (Familiar?)
              </h3>
              {topic.subtopics && topic.subtopics.length > 0 ? (
                <ul className="space-y-3">
                  {topic.subtopics.map((sub, i) => {
                    const key = `${topic.name}-${sub}`
                    const isChecked = !!checkedItems[key]
                    
                    return (
                      <li key={i}>
                        <label className={`flex items-center gap-4 text-sm px-4 py-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground' 
                            : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                        }`}
                      >
                        <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(topic.name, sub)} className="h-5 w-5 shrink-0 accent-accent-primary" />
                        <span className={`font-medium ${isChecked ? 'text-muted-foreground line-through decoration-emerald-500/50' : ''}`}>
                          {sub}
                        </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No specific subtopics.</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
