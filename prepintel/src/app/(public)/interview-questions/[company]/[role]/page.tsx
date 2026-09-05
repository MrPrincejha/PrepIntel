import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { DifficultyBadge } from '@/components/core/DifficultyBadge'
import { TOPIC_STYLES } from '@/lib/topics'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api"

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { company, role } = await params
  const companyName = company.charAt(0).toUpperCase() + company.slice(1)
  const roleName = role.toUpperCase()
  
  return {
    title: `${companyName} ${roleName} Interview Questions (2025)`,
    description: `Real ${companyName} ${roleName} online assessment and interview questions. See difficulty distribution, common topics, and get a personalized prep plan.`,
  }
}

export async function generateStaticParams() {
  return [
    { company: 'google', role: 'sde' },
    { company: 'amazon', role: 'sde' },
    { company: 'microsoft', role: 'sde' },
  ]
}

export default async function CompanyRoleQuestionsPage({ params }: any) {
  const { company, role } = await params
  
  let questions = []
  try {
    const res = await fetch(`${API_BASE}/questions?company=${company}&role=${role}&limit=100`, { next: { revalidate: 3600 } })
    if (res.ok) {
      questions = await res.json()
    }
  } catch (e) {
    console.warn("Backend fetch failed during SSG:", e)
  }
  
  if (!questions || questions.length === 0) {
    questions = []
  }

  const companyName = company.charAt(0).toUpperCase() + company.slice(1)
  const roleName = role.toUpperCase()

  const faqJsonLd = {
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Companies", "item": "https://prepintel-nine.vercel.app" },
      { "@type": "ListItem", "position": 2, "name": companyName, "item": `https://prepintel-nine.vercel.app/interview-questions/${company}` },
      { "@type": "ListItem", "position": 3, "name": roleName }
    ]
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-white/40 mb-4">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/interview-questions/${company}`} className="hover:text-white transition-colors">{companyName}</Link>
          <span>/</span>
          <span className="text-white/80">{roleName}</span>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">{companyName} {roleName} Interview Questions</h1>
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

