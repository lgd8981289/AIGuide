import { SITE } from './site'
import { absoluteUrl } from '../utils'

export const WEBSITE_ID = `${absoluteUrl('/')}#website`
export const AUTHOR_ID = `${absoluteUrl('/')}#author`
export const PUBLISHER_ID = `${absoluteUrl('/')}#publisher`

// 作者是个人，出版主体是本站内容品牌；不声明未经核验的法人、地址或资质。
export const authorSchema = {
  '@type': 'Person', '@id': AUTHOR_ID, name: SITE.author,
  url: absoluteUrl('/'),
}

export const publisherSchema = {
  '@type': 'Organization', '@id': PUBLISHER_ID,
  name: SITE.name, url: absoluteUrl('/'),
  logo: { '@type': 'ImageObject', url: absoluteUrl(SITE.logo || '/favicon.svg') },
  ...(SITE.github ? { sameAs: [SITE.github] } : {}),
}

export const websiteSchema = {
  '@type': 'WebSite', '@id': WEBSITE_ID,
  name: SITE.name, url: absoluteUrl('/'),
}

export function breadcrumbSchema(crumbs: { name: string; href: string }[]) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(({ name, href }, index) => ({
      '@type': 'ListItem', position: index + 1, name, item: absoluteUrl(href),
    })),
  }
}
