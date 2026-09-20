import { 
  Calculator, 
  FunctionSquare, 
  Shapes, 
  Sigma, 
  Binary,
  AreaChart,
  Boxes,
  Network,
  Key,
  LucideIcon
} from 'lucide-react'

export interface Prerequisite {
  name: string
  subtopics: string[]
}

export interface Topic {
  name: string
  prerequisites: Prerequisite[]
  subtopics: string[]
}

export interface RoadmapStep {
  id: number
  title: string
  description: string
  icon: LucideIcon
  color: string
  status: 'completed' | 'in-progress' | 'locked'
  topics: Topic[]
}

export const civilRoadmap: RoadmapStep[] = [
  {
    id: 1,
    title: 'Calculus I & II',
    description: 'Master derivatives, integrals, and their real-world applications in engineering.',
    icon: Sigma,
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    status: 'completed',
    topics: [
      {
        name: 'Derivatives',
        prerequisites: [
          { name: 'Pre-Calculus', subtopics: ['Functions', 'Graphing', 'Trigonometry'] },
          { name: 'Limits', subtopics: ['Limit Laws', 'Continuity', 'One-Sided Limits'] }
        ],
        subtopics: [
          'Definition of a Derivative', 
          'Power Rule & Constant Multiple Rule', 
          'Sum & Difference Rules', 
          'Product & Quotient Rules', 
          'Chain Rule', 
          'Implicit Differentiation', 
          'Higher-Order Derivatives', 
          'Derivatives of Trigonometric Functions', 
          'Derivatives of Exponential/Logarithmic Functions', 
          'Logarithmic Differentiation', 
          'Related Rates', 
          'Linear Approximations & Differentials', 
          'Mean Value Theorem', 
          'Optimization Problems'
        ]
      },
      {
        name: 'Integrals',
        prerequisites: [
          { name: 'Derivatives', subtopics: ['Antiderivatives', 'Fundamental Theorem'] }
        ],
        subtopics: [
          'Riemann Sums & Area', 
          'Definite & Indefinite Integrals', 
          'Fundamental Theorem of Calculus (Parts 1 & 2)', 
          'Net Change Theorem', 
          'The Substitution Rule (u-substitution)', 
          'Integration by Parts', 
          'Trigonometric Integrals', 
          'Trigonometric Substitution', 
          'Method of Partial Fractions', 
          'Improper Integrals (Type I & Type II)', 
          'Approximate Integration (Simpson\'s & Trapezoidal)'
        ]
      },
      {
        name: 'Applications of Integration',
        prerequisites: [
          { name: 'Integrals', subtopics: ['Definite Integrals', 'Area Calculation'] }
        ],
        subtopics: [
          'Area Between Curves', 
          'Volumes by Disks & Washers', 
          'Volumes by Cylindrical Shells', 
          'Work & Force Calculation', 
          'Average Value of a Function', 
          'Arc Length of a Curve', 
          'Area of a Surface of Revolution', 
          'Moments & Centers of Mass (Centroids)', 
          'Hydrostatic Pressure & Force'
        ]
      },
      {
        name: 'Infinite Series',
        prerequisites: [
          { name: 'Integrals', subtopics: ['Improper Integrals'] },
          { name: 'Limits', subtopics: ['Limits at Infinity', 'L\'Hopital\'s Rule'] }
        ],
        subtopics: [
          'Sequences & Limit of a Sequence', 
          'Infinite Series Definition', 
          'Geometric & Telescoping Series', 
          'The Integral Test', 
          'Comparison & Limit Comparison Tests', 
          'Alternating Series Test', 
          'Absolute Convergence', 
          'Ratio & Root Tests', 
          'Power Series & Interval of Convergence', 
          'Taylor & Maclaurin Series', 
          'Binomial Series', 
          'Applications of Taylor Polynomials'
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Multivariable Calculus',
    description: 'Extend calculus to multiple dimensions, crucial for fluid dynamics and structural analysis.',
    icon: Shapes,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    status: 'in-progress',
    topics: [
      {
        name: 'Partial Derivatives',
        prerequisites: [
          { name: 'Calculus I & II', subtopics: ['Derivatives', 'Chain Rule'] }
        ],
        subtopics: [
          'Functions of Several Variables', 
          'Limits & Continuity in Higher Dimensions', 
          'First & Second-Order Partial Derivatives', 
          'Clairaut\'s Theorem', 
          'Tangent Planes & Linear Approximations', 
          'The Chain Rule for Multiple Variables', 
          'Directional Derivatives', 
          'The Gradient Vector', 
          'Maximum/Minimum Values', 
          'Lagrange Multipliers'
        ]
      },
      {
        name: 'Multiple Integrals',
        prerequisites: [
          { name: 'Partial Derivatives', subtopics: ['Integration Concepts'] }
        ],
        subtopics: [
          'Double Integrals over Rectangles', 
          'Iterated Integrals (Fubini\'s Theorem)', 
          'Double Integrals over General Regions', 
          'Double Integrals in Polar Coordinates', 
          'Applications of Double Integrals (Mass, Moments)', 
          'Surface Area', 
          'Triple Integrals', 
          'Triple Integrals in Cylindrical Coordinates', 
          'Triple Integrals in Spherical Coordinates', 
          'Change of Variables in Multiple Integrals (Jacobians)'
        ]
      },
      {
        name: 'Vector Fields & Line Integrals',
        prerequisites: [
          { name: 'Multiple Integrals', subtopics: ['Area & Volume'] },
          { name: 'Vectors', subtopics: ['Dot Product', 'Cross Product'] }
        ],
        subtopics: [
          'Definition of Vector Fields', 
          'Line Integrals of Scalar Functions', 
          'Line Integrals of Vector Fields (Work)', 
          'Fundamental Theorem for Line Integrals', 
          'Conservative Vector Fields & Potential Functions', 
          'Green\'s Theorem', 
          'Curl & Divergence'
        ]
      },
      {
        name: 'Surface Integrals & Theorems',
        prerequisites: [
          { name: 'Vector Fields', subtopics: ['Curl', 'Line Integrals'] }
        ],
        subtopics: [
          'Parametric Surfaces and their Areas', 
          'Surface Integrals of Scalar Functions', 
          'Surface Integrals of Vector Fields (Flux)', 
          'Stokes\' Theorem', 
          'The Divergence Theorem (Gauss\'s Theorem)', 
          'Summary of Vector Calculus (Unified Theorems)'
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'Differential Equations',
    description: 'Learn to model dynamic systems like heat transfer, structural vibrations, and fluid flow.',
    icon: FunctionSquare,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    status: 'locked',
    topics: [
      {
        name: 'First-Order ODEs',
        prerequisites: [
          { name: 'Calculus I & II', subtopics: ['Integration Techniques', 'Derivatives'] }
        ],
        subtopics: [
          'Basic Definitions & Terminology', 
          'Direction Fields & Euler\'s Method', 
          'Separable Equations', 
          'Linear First-Order Equations (Integrating Factors)', 
          'Exact Equations', 
          'Bernoulli Equations', 
          'Modeling: Population Dynamics, Cooling, Mixtures', 
          'Existence & Uniqueness Theorem'
        ]
      },
      {
        name: 'Higher-Order Linear ODEs',
        prerequisites: [
          { name: 'First-Order ODEs', subtopics: ['Linear Equations'] }
        ],
        subtopics: [
          'Homogeneous Linear Equations', 
          'Constant Coefficient Homogeneous Equations', 
          'The Wronskian & Linear Independence', 
          'Method of Undetermined Coefficients', 
          'Method of Variation of Parameters', 
          'Cauchy-Euler Equations', 
          'Spring-Mass Systems (Free/Forced & Damped/Undamped Vibrations)', 
          'Electrical Circuits (RLC)'
        ]
      },
      {
        name: 'Laplace Transforms',
        prerequisites: [
          { name: 'Higher-Order Linear ODEs', subtopics: ['Constant Coefficients'] }
        ],
        subtopics: [
          'Definition & Basic Properties of Laplace Transform', 
          'Inverse Laplace Transforms', 
          'Transforms of Derivatives & Integrals', 
          'Solving Initial Value Problems (IVPs)', 
          'Heaviside Step Functions', 
          'Dirac Delta Functions', 
          'Convolution Theorem', 
          'Systems of Linear ODEs using Laplace'
        ]
      },
      {
        name: 'Systems of ODEs',
        prerequisites: [
          { name: 'Laplace Transforms', subtopics: ['Matrix Methods'] },
          { name: 'Linear Algebra', subtopics: ['Eigenvalues', 'Eigenvectors'] }
        ],
        subtopics: [
          'Theory of Linear Systems', 
          'Homogeneous Linear Systems with Constant Coefficients', 
          'Real & Distinct Eigenvalues', 
          'Complex Eigenvalues', 
          'Repeated Eigenvalues', 
          'Nonhomogeneous Linear Systems', 
          'Phase Plane Analysis & Trajectories', 
          'Stability of Linear Systems'
        ]
      }
    ]
  },
  {
    id: 4,
    title: 'Linear Algebra',
    description: 'Study matrices and vectors, essential for finite element analysis and structural modeling.',
    icon: Binary,
    color: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    status: 'locked',
    topics: [
      {
        name: 'Matrices & Systems of Equations',
        prerequisites: [
          { name: 'Basic Algebra', subtopics: ['Systems of Equations', 'Variables'] }
        ],
        subtopics: [
          'Systems of Linear Equations', 
          'Row Reduction & Echelon Forms', 
          'Vector Equations', 
          'The Matrix Equation Ax = b', 
          'Solution Sets of Linear Systems', 
          'Matrix Operations (Addition, Multiplication, Transpose)', 
          'The Inverse of a Matrix', 
          'Characterizations of Invertible Matrices'
        ]
      },
      {
        name: 'Vector Spaces & Determinants',
        prerequisites: [
          { name: 'Matrices & Systems of Equations', subtopics: ['Matrix Properties'] }
        ],
        subtopics: [
          'Introduction to Determinants', 
          'Properties of Determinants', 
          'Cramer\'s Rule & Volume', 
          'Vector Spaces & Subspaces', 
          'Null Spaces, Column Spaces, and Linear Transformations', 
          'Linearly Independent Sets & Bases', 
          'Coordinate Systems', 
          'The Dimension of a Vector Space', 
          'Rank & The Rank Theorem'
        ]
      },
      {
        name: 'Eigenvalues & Eigenvectors',
        prerequisites: [
          { name: 'Vector Spaces & Determinants', subtopics: ['Basis', 'Dimension'] }
        ],
        subtopics: [
          'Eigenvectors and Eigenvalues', 
          'The Characteristic Equation', 
          'Diagonalization', 
          'Eigenvectors and Linear Transformations', 
          'Complex Eigenvalues', 
          'Discrete Dynamical Systems'
        ]
      },
      {
        name: 'Orthogonality & Least Squares',
        prerequisites: [
          { name: 'Eigenvalues & Eigenvectors', subtopics: ['Transformations'] }
        ],
        subtopics: [
          'Inner Product, Length, and Orthogonality', 
          'Orthogonal Sets & Matrices', 
          'Orthogonal Projections', 
          'The Gram-Schmidt Process', 
          'Least-Squares Problems', 
          'Applications to Linear Models', 
          'Inner Product Spaces', 
          'Symmetric Matrices & Quadratic Forms'
        ]
      }
    ]
  },
  {
    id: 5,
    title: 'Probability & Statistics',
    description: 'Understand risk assessment, quality control, and data analysis in engineering projects.',
    icon: AreaChart,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    status: 'locked',
    topics: [
      {
        name: 'Probability Basics & Random Variables',
        prerequisites: [
          { name: 'Calculus I & II', subtopics: ['Integration'] }
        ],
        subtopics: [
          'Sample Spaces & Events', 
          'Axioms of Probability', 
          'Conditional Probability & Independence', 
          'Bayes\' Theorem', 
          'Discrete Random Variables (PMF, CDF)', 
          'Expected Value & Variance (Discrete)', 
          'Continuous Random Variables (PDF, CDF)', 
          'Expected Value & Variance (Continuous)'
        ]
      },
      {
        name: 'Common Distributions & Joint Variables',
        prerequisites: [
          { name: 'Probability Basics & Random Variables', subtopics: ['Expected Value', 'Variance'] }
        ],
        subtopics: [
          'Binomial & Geometric Distributions', 
          'Poisson Distribution', 
          'Uniform & Exponential Distributions', 
          'The Normal Distribution', 
          'Joint Probability Distributions', 
          'Marginal & Conditional Distributions', 
          'Covariance & Correlation', 
          'Central Limit Theorem'
        ]
      },
      {
        name: 'Statistical Estimation & Hypothesis Testing',
        prerequisites: [
          { name: 'Common Distributions & Joint Variables', subtopics: ['Confidence Intervals'] }
        ],
        subtopics: [
          'Point Estimation & Properties of Estimators', 
          'Maximum Likelihood Estimation (MLE)', 
          'Confidence Intervals for Means (Large & Small Samples)', 
          'Confidence Intervals for Proportions', 
          'Null & Alternative Hypotheses', 
          'Type I and Type II Errors, p-values', 
          'Tests Concerning Means (Z-test, T-test)', 
          'Tests Concerning Proportions & Variances'
        ]
      },
      {
        name: 'Regression Analysis & ANOVA',
        prerequisites: [
          { name: 'Statistical Estimation & Hypothesis Testing', subtopics: ['Variances'] },
          { name: 'Linear Algebra', subtopics: ['Least Squares'] }
        ],
        subtopics: [
          'Simple Linear Regression Models', 
          'Estimating Model Parameters', 
          'Inferences about Regression Coefficients', 
          'Correlation Analysis', 
          'Multiple Linear Regression', 
          'Goodness of Fit (R-squared)', 
          'One-Way Analysis of Variance (ANOVA)', 
          'Two-Way ANOVA'
        ]
      }
    ]
  },
  {
    id: 6,
    title: 'Numerical Methods',
    description: 'Solve complex mathematical problems using computational algorithms and approximations.',
    icon: Calculator,
    color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    status: 'locked',
    topics: [
      {
        name: 'Root Finding & Error Analysis',
        prerequisites: [
          { name: 'Calculus I & II', subtopics: ['Derivatives'] },
          { name: 'Basic Programming', subtopics: ['Loops', 'Functions'] }
        ],
        subtopics: [
          'Sources of Error (Round-off, Truncation)', 
          'Absolute & Relative Error', 
          'Bisection Method', 
          'Newton-Raphson Method', 
          'Secant Method', 
          'Method of False Position (Regula Falsi)', 
          'Fixed-Point Iteration', 
          'Convergence Analysis of Root-Finding Methods'
        ]
      },
      {
        name: 'Interpolation & Curve Fitting',
        prerequisites: [
          { name: 'Root Finding & Error Analysis', subtopics: ['Algorithm Logic'] }
        ],
        subtopics: [
          'Polynomial Interpolation', 
          'Lagrange Interpolating Polynomials', 
          'Newton\'s Divided-Difference Interpolation', 
          'Cubic Spline Interpolation', 
          'Least Squares Regression (Linear & Polynomial)', 
          'Multiple Linear Regression', 
          'Nonlinear Regression'
        ]
      },
      {
        name: 'Numerical Integration & Differentiation',
        prerequisites: [
          { name: 'Interpolation & Curve Fitting', subtopics: ['Polynomials'] }
        ],
        subtopics: [
          'Finite Difference Approximations (Forward, Backward, Central)', 
          'Richardson Extrapolation', 
          'Newton-Cotes Formulas', 
          'The Trapezoidal Rule', 
          'Simpson\'s 1/3 and 3/8 Rules', 
          'Romberg Integration', 
          'Gaussian Quadrature', 
          'Improper Integrals Numerically'
        ]
      },
      {
        name: 'Numerical Solutions to ODEs & Linear Systems',
        prerequisites: [
          { name: 'Numerical Integration & Differentiation', subtopics: ['Curve Fitting'] },
          { name: 'Differential Equations', subtopics: ['IVPs'] }
        ],
        subtopics: [
          'Euler\'s Method & Improved Euler', 
          'Runge-Kutta Methods (RK2, RK4)', 
          'Multistep Methods (Adams-Bashforth)', 
          'Boundary Value Problems (Finite Difference Method)', 
          'Gaussian Elimination & LU Decomposition', 
          'Iterative Methods for Linear Systems (Jacobi, Gauss-Seidel)', 
          'Power Method for Eigenvalues'
        ]
      }
    ]
  }
]

export const csRoadmap: RoadmapStep[] = [
  {
    id: 1,
    title: 'Discrete Mathematics',
    description: 'The foundation of computer science. Learn about logic, sets, relations, and proof techniques.',
    icon: Boxes,
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    status: 'completed',
    topics: [
      {
        name: 'Logic & Proofs',
        prerequisites: [
          { name: 'Basic Algebra', subtopics: ['Variables', 'Equations'] }
        ],
        subtopics: [
          'Propositional Logic', 
          'Logical Connectives & Truth Tables', 
          'Logical Equivalences (De Morgan\'s Laws)', 
          'Predicates & Quantifiers', 
          'Nested Quantifiers', 
          'Rules of Inference', 
          'Direct & Indirect Proofs', 
          'Proof by Contradiction', 
          'Proof by Cases'
        ]
      },
      {
        name: 'Sets, Functions, & Relations',
        prerequisites: [
          { name: 'Logic & Proofs', subtopics: ['Truth Values'] }
        ],
        subtopics: [
          'Set Definitions & Operations (Union, Intersection)', 
          'Power Sets & Cartesian Products', 
          'Venn Diagrams & Set Identities', 
          'Types of Functions (Injective, Surjective, Bijective)', 
          'Inverse & Composite Functions', 
          'Properties of Relations (Reflexive, Symmetric, Transitive)', 
          'Equivalence Relations & Partitions', 
          'Partial Orderings & Hasse Diagrams'
        ]
      },
      {
        name: 'Algorithms & Complexity',
        prerequisites: [
          { name: 'Sets, Functions, & Relations', subtopics: ['Functions'] }
        ],
        subtopics: [
          'Properties of Algorithms', 
          'Searching & Sorting Algorithms (Linear, Binary, Bubble, Insertion)', 
          'Growth of Functions (Big-O, Big-Omega, Big-Theta)', 
          'Complexity of Algorithms', 
          'Recursive Algorithms'
        ]
      },
      {
        name: 'Induction, Recursion & Combinatorics',
        prerequisites: [
          { name: 'Algorithms & Complexity', subtopics: ['Recursion'] }
        ],
        subtopics: [
          'Mathematical Induction', 
          'Strong Induction & Well-Ordering', 
          'Recursive Definitions', 
          'Structural Induction', 
          'Basic Counting Principles (Sum & Product Rules)', 
          'Pigeonhole Principle', 
          'Permutations & Combinations', 
          'Binomial Theorem', 
          'Generalized Permutations & Combinations'
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Linear Algebra',
    description: 'Essential for computer graphics, machine learning, and quantum computing.',
    icon: Binary,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    status: 'in-progress',
    topics: [
      {
        name: 'Matrices & Systems',
        prerequisites: [
          { name: 'Basic Algebra', subtopics: ['Linear Equations'] }
        ],
        subtopics: [
          'Linear Equations & Matrices', 
          'Gaussian Elimination', 
          'Matrix Arithmetic', 
          'Matrix Inverses', 
          'Elementary Matrices', 
          'Block Matrices', 
          'Determinants & Cofactor Expansion', 
          'Cramer\'s Rule'
        ]
      },
      {
        name: 'Vector Spaces',
        prerequisites: [
          { name: 'Matrices & Systems', subtopics: ['Determinants'] }
        ],
        subtopics: [
          'Euclidean Vector Spaces', 
          'General Vector Spaces', 
          'Subspaces', 
          'Linear Independence & Span', 
          'Basis & Dimension', 
          'Row Space, Column Space, & Null Space', 
          'Rank-Nullity Theorem'
        ]
      },
      {
        name: 'Inner Product Spaces',
        prerequisites: [
          { name: 'Vector Spaces', subtopics: ['Bases'] }
        ],
        subtopics: [
          'Inner Products (Dot Product)', 
          'Angle & Orthogonality in Inner Product Spaces', 
          'Gram-Schmidt Process', 
          'QR-Decomposition', 
          'Orthogonal Projections', 
          'Best Approximation & Least Squares'
        ]
      },
      {
        name: 'Eigenvalues & Transformations',
        prerequisites: [
          { name: 'Inner Product Spaces', subtopics: ['Matrix Algebra'] }
        ],
        subtopics: [
          'Eigenvalues & Eigenvectors', 
          'Diagonalization', 
          'Complex Vector Spaces', 
          'General Linear Transformations', 
          'Kernel & Range', 
          'Matrices of General Linear Transformations', 
          'Similarity', 
          'Singular Value Decomposition (SVD)', 
          'Principal Component Analysis (PCA) Basics'
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'Calculus',
    description: 'Master continuous change for optimization algorithms and machine learning models.',
    icon: Sigma,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    status: 'locked',
    topics: [
      {
        name: 'Limits & Derivatives',
        prerequisites: [
          { name: 'Pre-Calculus', subtopics: ['Functions', 'Trigonometry'] }
        ],
        subtopics: [
          'Limits & Continuity', 
          'Definition of the Derivative', 
          'Derivative Rules (Power, Product, Quotient, Chain)', 
          'Derivatives of Transcendental Functions', 
          'Implicit Differentiation', 
          'L\'Hopital\'s Rule', 
          'Applications: Optimization & Curve Sketching'
        ]
      },
      {
        name: 'Integration & Series',
        prerequisites: [
          { name: 'Limits & Derivatives', subtopics: ['Anti-derivatives'] }
        ],
        subtopics: [
          'Definite & Indefinite Integrals', 
          'Fundamental Theorem of Calculus', 
          'Techniques of Integration (Substitution, Parts, Fractions)', 
          'Improper Integrals', 
          'Sequences & Infinite Series', 
          'Convergence Tests', 
          'Taylor & Maclaurin Series'
        ]
      },
      {
        name: 'Multivariate Calculus',
        prerequisites: [
          { name: 'Integration & Series', subtopics: ['Integration Rules'] }
        ],
        subtopics: [
          'Vectors & Geometry of Space', 
          'Vector Functions', 
          'Partial Derivatives', 
          'Chain Rule for Multiple Variables', 
          'Directional Derivatives & Gradients', 
          'Tangent Planes & Linear Approximations', 
          'Double & Triple Integrals'
        ]
      },
      {
        name: 'Advanced Optimization',
        prerequisites: [
          { name: 'Multivariate Calculus', subtopics: ['Gradients', 'Critical Points'] }
        ],
        subtopics: [
          'Local & Global Extrema', 
          'Saddle Points & the Hessian Matrix', 
          'Constrained Optimization', 
          'Lagrange Multipliers', 
          'Gradient Descent Algorithm', 
          'Convex Functions & Convex Sets', 
          'Karush-Kuhn-Tucker (KKT) Conditions Overview'
        ]
      }
    ]
  },
  {
    id: 4,
    title: 'Probability & Statistics',
    description: 'The math behind data science, AI, and randomized algorithms.',
    icon: AreaChart,
    color: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    status: 'locked',
    topics: [
      {
        name: 'Probability Theory',
        prerequisites: [
          { name: 'Discrete Mathematics', subtopics: ['Combinatorics'] },
          { name: 'Calculus', subtopics: ['Integration'] }
        ],
        subtopics: [
          'Axioms of Probability', 
          'Permutations & Combinations in Probability', 
          'Conditional Probability', 
          'Law of Total Probability', 
          'Bayes\' Theorem', 
          'Independence of Events'
        ]
      },
      {
        name: 'Random Variables',
        prerequisites: [
          { name: 'Probability Theory', subtopics: ['Bayes'] }
        ],
        subtopics: [
          'Discrete Random Variables (PMF, CDF)', 
          'Continuous Random Variables (PDF, CDF)', 
          'Expected Value (Mean)', 
          'Variance & Standard Deviation', 
          'Moments & Moment Generating Functions', 
          'Functions of a Random Variable'
        ]
      },
      {
        name: 'Distributions & Joint Probabilities',
        prerequisites: [
          { name: 'Random Variables', subtopics: ['Expectation'] }
        ],
        subtopics: [
          'Discrete Distributions (Bernoulli, Binomial, Poisson, Geometric)', 
          'Continuous Distributions (Uniform, Normal, Exponential, Beta)', 
          'Joint Probability Distributions', 
          'Marginal & Conditional Distributions', 
          'Covariance & Correlation', 
          'Central Limit Theorem', 
          'Law of Large Numbers'
        ]
      },
      {
        name: 'Statistics & Bayesian Inference',
        prerequisites: [
          { name: 'Distributions & Joint Probabilities', subtopics: ['Normal', 'Binomial'] }
        ],
        subtopics: [
          'Point Estimation (MLE, MAP)', 
          'Confidence Intervals', 
          'Hypothesis Testing (p-values, T-tests)', 
          'Linear Regression Basics', 
          'Bayesian Statistics Fundamentals', 
          'Priors, Likelihoods, and Posteriors', 
          'Conjugate Priors', 
          'Markov Chain Monte Carlo (MCMC) Introduction'
        ]
      }
    ]
  },
  {
    id: 5,
    title: 'Graph Theory',
    description: 'Study networks, crucial for routing algorithms, social networks, and database design.',
    icon: Network,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    status: 'locked',
    topics: [
      {
        name: 'Foundations of Graphs',
        prerequisites: [
          { name: 'Discrete Mathematics', subtopics: ['Relations', 'Sets'] }
        ],
        subtopics: [
          'Graph Definitions (Vertices, Edges, Directed, Undirected)', 
          'Graph Representation (Adjacency Matrix, Adjacency List)', 
          'Graph Isomorphism', 
          'Bipartite Graphs', 
          'Subgraphs & Induced Subgraphs', 
          'Paths, Cycles, & Connectivity', 
          'Eulerian Paths & Circuits', 
          'Hamiltonian Paths & Cycles'
        ]
      },
      {
        name: 'Trees & Network Searches',
        prerequisites: [
          { name: 'Foundations of Graphs', subtopics: ['Graph Traversals'] }
        ],
        subtopics: [
          'Properties of Trees', 
          'Rooted Trees & Binary Trees', 
          'Tree Traversal (Pre-order, In-order, Post-order)', 
          'Breadth-First Search (BFS)', 
          'Depth-First Search (DFS)', 
          'Spanning Trees', 
          'Minimum Spanning Trees (Kruskal\'s Algorithm)', 
          'Prim\'s Algorithm'
        ]
      },
      {
        name: 'Shortest Path & Network Flow',
        prerequisites: [
          { name: 'Trees & Network Searches', subtopics: ['Paths'] }
        ],
        subtopics: [
          'Shortest Path Problems', 
          'Dijkstra\'s Algorithm', 
          'Bellman-Ford Algorithm', 
          'Floyd-Warshall Algorithm (All-Pairs Shortest Path)', 
          'A* Search Algorithm', 
          'Flow Networks', 
          'Max-Flow Min-Cut Theorem', 
          'Ford-Fulkerson Method', 
          'Edmonds-Karp Algorithm'
        ]
      },
      {
        name: 'Advanced Graph Concepts',
        prerequisites: [
          { name: 'Shortest Path & Network Flow', subtopics: ['Bipartite Graphs'] }
        ],
        subtopics: [
          'Graph Coloring (Vertex & Edge)', 
          'Chromatic Number', 
          'Four Color Theorem', 
          'Planar Graphs', 
          'Euler\'s Formula', 
          'Kuratowski\'s Theorem', 
          'Matching in Bipartite Graphs', 
          'Hall\'s Marriage Theorem', 
          'PageRank Algorithm (Link Analysis)'
        ]
      }
    ]
  },
  {
    id: 6,
    title: 'Number Theory & Cryptography',
    description: 'The mathematics of securing data and communication in the digital age.',
    icon: Key,
    color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    status: 'locked',
    topics: [
      {
        name: 'Divisibility & Primes',
        prerequisites: [
          { name: 'Discrete Mathematics', subtopics: ['Logic', 'Proofs'] }
        ],
        subtopics: [
          'Divisibility Rules', 
          'Prime & Composite Numbers', 
          'Fundamental Theorem of Arithmetic', 
          'The Division Algorithm', 
          'Greatest Common Divisor (GCD) & Least Common Multiple (LCM)', 
          'The Euclidean Algorithm', 
          'Bezout\'s Identity (Extended Euclidean Algorithm)', 
          'Sieve of Eratosthenes', 
          'Distribution of Primes'
        ]
      },
      {
        name: 'Modular Arithmetic',
        prerequisites: [
          { name: 'Divisibility & Primes', subtopics: ['Congruences'] }
        ],
        subtopics: [
          'Congruences & Modular Operations', 
          'Modular Exponentiation (Fast Exponentiation)', 
          'Linear Congruences', 
          'Modular Inverse', 
          'Fermat\'s Little Theorem', 
          'Euler\'s Totient Function (Phi)', 
          'Euler\'s Theorem', 
          'Chinese Remainder Theorem', 
          'Primitive Roots & Discrete Logarithms'
        ]
      },
      {
        name: 'Foundations of Cryptography',
        prerequisites: [
          { name: 'Modular Arithmetic', subtopics: ['Factorization'] }
        ],
        subtopics: [
          'Historical Ciphers (Caesar, Vigenere, Substitution)', 
          'Symmetric-Key Cryptography', 
          'Block Ciphers (DES, AES overview)', 
          'Modes of Operation (ECB, CBC)', 
          'Public-Key (Asymmetric) Cryptography Concepts', 
          'Diffie-Hellman Key Exchange', 
          'Man-in-the-Middle Attacks'
        ]
      },
      {
        name: 'Advanced Cryptosystems & Security',
        prerequisites: [
          { name: 'Foundations of Cryptography', subtopics: ['Security'] }
        ],
        subtopics: [
          'The RSA Algorithm (Key Generation, Encryption, Decryption)', 
          'Security of RSA (Factoring Problem)', 
          'Elliptic Curve Cryptography (ECC) Basics', 
          'Cryptographic Hash Functions (Properties, SHA-256)', 
          'Message Authentication Codes (MACs)', 
          'Digital Signatures (RSA Signatures)', 
          'Public Key Infrastructure (PKI) & Certificates', 
          'Zero-Knowledge Proofs Introduction', 
          'Quantum Cryptography & Post-Quantum Concepts'
        ]
      }
    ]
  }
]
