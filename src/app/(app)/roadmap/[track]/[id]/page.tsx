import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { civilRoadmap, csRoadmap } from '@/lib/data/roadmaps'
import { TopicChecklist } from '@/components/roadmap/topic-checklist'

export function generateStaticParams() {
  const params: { track: string; id: string }[] = []
  
  civilRoadmap.forEach((stage) => {
    params.push({ track: 'civil', id: stage.id.toString() })
  })
  
  csRoadmap.forEach((stage) => {
    params.push({ track: 'cs', id: stage.id.toString() })
  })
  
  return params
}

export default async function RoadmapStagePage({ 
  params 
}: { 
  params: Promise<{ track: string; id: string }> 
}) {
  const resolvedParams = await params
  const { track, id } = resolvedParams
  const stageId = parseInt(id, 10)

  const roadmap = track === 'civil' ? civilRoadmap : track === 'cs' ? csRoadmap : null
  
  if (!roadmap) {
    return notFound()
  }

  const stage = roadmap.find(s => s.id === stageId)

  if (!stage) {
    return notFound()
  }

  const Icon = stage.icon

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link 
        href="/roadmap" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Roadmap
      </Link>

      {/* Header */}
      <div className="mb-12 border-b border-border/50 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className={`flex items-center justify-center w-16 h-16 rounded-2xl border ${stage.color} bg-card shadow-sm`}>
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${stage.color}`}>
                Stage {stage.id}
              </span>
              <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                {track === 'civil' ? 'Civil Engineering' : 'Computer Science'}
              </span>
            </div>
            <h1 className="text-3xl font-bold">{stage.title}</h1>
          </div>
        </div>
        <p className="text-lg text-muted-foreground leading-relaxed mt-4">
          {stage.description}
        </p>
      </div>

      {/* Topics & Interactive Checklist */}
      <TopicChecklist topics={stage.topics} stageId={stage.id} track={track} />
    </div>
  )
}
