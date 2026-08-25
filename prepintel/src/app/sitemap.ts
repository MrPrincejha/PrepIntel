import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://prepintel-nine.vercel.app'
  
  const staticRoutes = ['', '/about', '/contact', '/privacy'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  const topCompanies = ['google', 'amazon', 'microsoft', 'adobe', 'flipkart', 'paypal']
  
  const dynamicRoutes = topCompanies.map((company) => ({
    url: `${baseUrl}/interview-questions/${company}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))
  
  return [...staticRoutes, ...dynamicRoutes]
}
