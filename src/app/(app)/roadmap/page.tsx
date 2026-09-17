'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowDown, Building2, Code2 } from 'lucide-react'
import { civilRoadmap, csRoadmap } from '@/lib/data/roadmaps'

export default function RoadmapPage() {
  const [activeTab, setActiveTab] = useState<'civil' | 'cs'>('civil')

  const currentRoadmap = activeTab === 'civil' ? civilRoadmap : csRoadmap
  const roadmapTitle = activeTab === 'civil' ? 'Civil Engineering Mathematics' : 'Computer Science Mathematics'
  const roadmapDescription = activeTab === 'civil' 
    ? 'Your guided mathematical journey for designing, building, and maintaining the physical and naturally built environment.'
    : 'Your guided mathematical journey for mastering algorithms, data structures, and computational theory.'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-accent-primary to-accent-primary/50 bg-clip-text text-transparent">
          {roadmapTitle} Roadmap
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          {roadmapDescription}
        </p>

        {/* Custom Tab Switcher */}
        <div className="inline-flex bg-muted/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('civil')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'civil'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Civil Engineering
          </button>
          <button
            onClick={() => setActiveTab('cs')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'cs'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Computer Science
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent mt-12">
        {currentRoadmap.map((step, index) => {
          const Icon = step.icon
          
          return (
            <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Timeline dot */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform duration-300 group-hover:scale-110 ${
                step.status === 'completed' ? 'border-emerald-500/50' : 
                step.status === 'in-progress' ? 'border-accent-primary/50' : 
                'border-border'
              }`}>
                <Icon className={`w-5 h-5 ${
                  step.status === 'completed' ? 'text-emerald-500' : 
                  step.status === 'in-progress' ? 'text-accent-primary' : 
                  'text-muted-foreground'
                }`} />
              </div>
              
              {/* Card - Now Clickable */}
              <Link 
                href={`/roadmap/${activeTab}/${step.id}`}
                className={`block w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:bg-card hover:-translate-y-1 cursor-pointer ${
                  step.status === 'in-progress' ? 'border-accent-primary/30 shadow-md shadow-accent-primary/5' : 
                  'border-border'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${step.color}`}>
                      Stage {step.id}
                    </span>
                    {step.status === 'completed' && (
                      <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Completed
                      </span>
                    )}
                    {step.status === 'in-progress' && (
                      <span className="text-xs font-medium text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full">
                        In Progress
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold group-hover/card:text-accent-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Key Topics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {step.topics.map((topic, i) => (
                        <span key={i} className="text-xs bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-md">
                          {topic.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
      
      {/* Footer */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-accent-primary/10 text-accent-primary mb-4 animate-bounce">
          <ArrowDown className="w-5 h-5" />
        </div>
        <p className="text-muted-foreground text-sm">
          More advanced domains unlock after completing the core roadmap for your chosen field.
        </p>
      </div>
    </div>
  )
}
