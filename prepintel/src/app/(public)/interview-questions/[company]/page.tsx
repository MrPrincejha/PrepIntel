import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { DifficultyBadge } from '@/components/core/DifficultyBadge'
import { TOPIC_STYLES } from '@/lib/topics'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api"

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { company } = await params
  const companyName = company.charAt(0).toUpperCase() + company.slice(1)
  
  return {
    title: `${companyName} Interview Questions (2025)`,
    description: `Real ${companyName} online assessment and interview questions. See difficulty distribution, common topics, and get a personalized prep plan.`,
  }
}

export async function generateStaticParams() {
  return [
    { company: 'google' },
    { company: 'amazon' },
    { company: 'microsoft' },
    { company: 'adobe' },
  ]
}

export default async function CompanyQuestionsPage({ params }: any) {
  const { company } = await params
  
  let questions = []
  try {
    const res = await fetch(`${API_BASE}/questions?company=${company}&limit=100`, { next: { revalidate: 3600 } })
    if (res.ok) {
      questions = await res.json()
    }
  } catch (e) {
    // Backend might be sleeping on free tier during build
    console.warn("Backend fetch failed during SSG:", e)
  }
  
  if (!questions || questions.length === 0) {
    // FALLBACK DATA FOR ADSENSE CRAWLER WHEN BACKEND IS DOWN
    questions = [
      {
        id: "mock-1",
        canonical_title: `Two Sum - ${companyName} Array Problem`,
        difficulty: 1,
        tags: ["Arrays", "Hash Tables", "Algorithm"]
      },
      {
        id: "mock-2",
        canonical_title: `Design a Distributed Message Queue like SQS`,
        difficulty: 3,
        tags: ["System Design", "Distributed Systems", "Message Queues"]
      },
      {
        id: "mock-3",
        canonical_title: `Find the longest palindromic substring in a string`,
        difficulty: 2,
        tags: ["Dynamic Programming", "Strings"]
      },
      {
        id: "mock-4",
        canonical_title: `Implement an LRU Cache with O(1) operations`,
        difficulty: 2,
        tags: ["Data Structures", "Linked Lists", "Hash Maps"]
      },
      {
        id: "mock-5",
        canonical_title: `Behavioral: Tell me about a time you had a conflict with a teammate`,
        difficulty: 1,
        tags: ["Behavioral", "Leadership", "Conflict Resolution"]
      },
      {
        id: "mock-6",
        canonical_title: `Serialize and Deserialize a Binary Tree`,
        difficulty: 3,
        tags: ["Trees", "Serialization", "DFS"]
      },
      {
        id: "mock-7",
        canonical_title: `Merge K Sorted Lists`,
        difficulty: 3,
        tags: ["Heaps", "Linked Lists", "Divide and Conquer"]
      },
      {
        id: "mock-8",
        canonical_title: `Word Search II - Find all words in a 2D board`,
        difficulty: 3,
        tags: ["Trie", "Backtracking", "Matrix"]
      }
    ];
  }

  const companyName = company.charAt(0).toUpperCase() + company.slice(1)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.slice(0, 10).map((q: any) => ({
      '@type': 'Question',
      name: q.canonical_title,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.description || 'View the full problem description and personalized prep insights on PrepIntel.'
      }
    }))
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{companyName} Interview Questions</h1>
        <p className="text-white/60">Based on recent real-world interview reports. Create a free account to unlock your Bayesian skill-gap score.</p>
      </div>
      
      {/* Gated Feature CTA Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-primary font-semibold text-lg">Want to know your exact chances?</h2>
          <p className="text-sm text-white/70 mt-1">Our engine mathematically adjusts these questions based on your skill gaps.</p>
        </div>
        <Link href="/login" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold shrink-0 hover:bg-primary/90 transition-colors">
          Get Personalized Plan
        </Link>
      </div>

      <div className="space-y-4">
        {questions.map((q: any) => (
           <div key={q.id} className="p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-colors">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
               <h2 className="text-white font-medium text-lg">{q.canonical_title}</h2>
               <DifficultyBadge level={q.difficulty} />
             </div>
             
             <div className="flex flex-wrap gap-2">
               {q.tags?.map((tag: string) => {
                 const style = TOPIC_STYLES[tag] || { name: tag, color: "text-gray-400", bg: "bg-gray-500/20" };
                 return (
                   <span key={tag} className={`text-xs px-2.5 py-1 rounded-md font-medium border border-white/5 ${style.bg} ${style.color}`}>
                     {style.name}
                   </span>
                 )
               })}
             </div>
           </div>
        ))}
      </div>
    </main>
  )
}

