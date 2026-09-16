'use client'

import { 
  Calculator, 
  FunctionSquare, 
  Shapes, 
  LineChart, 
  Sigma, 
  Binary,
  AreaChart,
  BookOpen,
  ArrowDown
} from 'lucide-react'

const mathRoadmap = [
  {
    id: 1,
    title: 'Foundations & Pre-Algebra',
    description: 'Master the basics of numbers, fractions, decimals, and basic equations. This is the bedrock of all higher math.',
    icon: BookOpen,
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    topics: ['Arithmetic Operations', 'Fractions & Decimals', 'Ratios & Proportions', 'Basic Equations'],
    status: 'completed'
  },
  {
    id: 2,
    title: 'Algebra I & II',
    description: 'Dive into variables, functions, and polynomials. Learn to solve complex equations and graph linear and quadratic functions.',
    icon: Calculator,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    topics: ['Linear Equations', 'Inequalities', 'Polynomials', 'Exponential Functions'],
    status: 'in-progress'
  },
  {
    id: 3,
    title: 'Geometry',
    description: 'Explore the properties of space and shape. Understand logic, proofs, and the relationships between points, lines, and angles.',
    icon: Shapes,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    topics: ['Logical Proofs', 'Triangles & Polygons', 'Circles', 'Area & Volume'],
    status: 'locked'
  },
  {
    id: 4,
    title: 'Pre-Calculus & Trigonometry',
    description: 'Prepare for Calculus by mastering trigonometric identities, advanced functions, complex numbers, and limits.',
    icon: FunctionSquare,
    color: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    topics: ['Trigonometric Functions', 'Identities & Equations', 'Complex Numbers', 'Introduction to Limits'],
    status: 'locked'
  },
  {
    id: 5,
    title: 'Calculus I & II',
    description: 'The mathematics of continuous change. Master derivatives, integrals, and their real-world applications.',
    icon: Sigma,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    topics: ['Derivatives', 'Integrals', 'Differential Equations', 'Infinite Series'],
    status: 'locked'
  },
  {
    id: 6,
    title: 'Linear Algebra',
    description: 'Study vector spaces and linear mappings. Crucial for computer graphics, machine learning, and quantum mechanics.',
    icon: Binary,
    color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    topics: ['Vectors & Matrices', 'Systems of Equations', 'Eigenvalues', 'Vector Spaces'],
    status: 'locked'
  },
  {
    id: 7,
    title: 'Probability & Statistics',
    description: 'Learn to analyze data, understand randomness, and make informed decisions using probability distributions.',
    icon: AreaChart,
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    topics: ['Data Analysis', 'Probability Theory', 'Distributions', 'Hypothesis Testing'],
    status: 'locked'
  }
]

export default function RoadmapPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-accent-primary to-accent-primary/50 bg-clip-text text-transparent">
          Mathematics Mastery Roadmap
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your guided journey from basic foundations to advanced mathematical concepts. 
          Track your progress and master the language of the universe.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {mathRoadmap.map((step, index) => {
          const Icon = step.icon
          const isEven = index % 2 === 0
          
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
              
              {/* Card */}
              <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:bg-card hover:-translate-y-1 ${
                step.status === 'in-progress' ? 'border-accent-primary/30 shadow-md shadow-accent-primary/5' : 
                'border-border'
              }`}>
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
                  
                  <h3 className="text-xl font-bold">{step.title}</h3>
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
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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
          More advanced domains like Topology, Number Theory, and Abstract Algebra unlock after completing the core roadmap.
        </p>
      </div>
    </div>
  )
}
