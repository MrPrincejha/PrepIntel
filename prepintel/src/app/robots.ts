import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://prepintel-nine.vercel.app'
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/about', '/contact', '/privacy', '/interview-questions/'],
      disallow: ['/dashboard/', '/admin/', '/api/', '/bookmarks/', '/progress/', '/questions/', '/roadmap/', '/reports/', '/analytics/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
