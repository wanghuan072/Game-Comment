/**
 * 结构化数据工具（可移植）
 * 注意：跨项目需要更改的地方已在下方中文注释中标注
 */

// 【需替换】站点基础信息（跨项目修改）
const siteInfo = {
  name: 'Example Games', // 站点名（跨项目替换）
  url: 'https://example.com', // 站点域名（跨项目替换）
  logo: '/favicon.ico', // 站点 Logo 路径（跨项目替换）
  description: 'Play free online games with a clean and friendly experience.', // 站点描述（跨项目替换）
  sameAs: [
    'https://twitter.com/example', // 社交媒体占位（跨项目替换或删除）
  ]
}

/** 生成 Organization */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteInfo.name,
    url: siteInfo.url,
    logo: siteInfo.logo,
    description: siteInfo.description,
    sameAs: siteInfo.sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${siteInfo.url}/contact`
    }
  }
}

/** 生成 Website（最简，不含站内搜索） */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteInfo.name,
    url: siteInfo.url,
    description: siteInfo.description
  }
}

/**
 * 生成 BreadcrumbList
 * @param {Array<{name: string, url: string}>} breadcrumbs - 形如 [{name:'Home', url:'/'}, ...]
 */
export function generateBreadcrumbSchema(breadcrumbs) {
  const itemListElement = breadcrumbs.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${siteInfo.url}${item.url}`
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement
  }
}

/**
 * 生成游戏结构化数据（SoftwareApplication）
 * @param {Object} game - 必需字段：title, imageUrl, publishDate, addressBar, seo
 */
export function generateGameSchema(game) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: game.title,
    description: game.seo?.description || game.title,
    image: game.imageUrl,
    applicationCategory: 'Game',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    author: {
      '@type': 'Organization',
      name: siteInfo.name
    },
    publisher: {
      '@type': 'Organization',
      name: siteInfo.name,
      logo: {
        '@type': 'ImageObject',
        url: siteInfo.logo
      }
    },
    datePublished: game.publishDate || new Date().toISOString(),
    dateModified: game.publishDate || new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteInfo.url}/games/${game.addressBar}`
    },
    genre: 'Game',
    platform: 'Web Browser',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      ratingCount: '100'
    }
  }
}

/** 在页面中插入单个 JSON-LD（会先清空所有同类脚本） */
export function insertStructuredData(schema) {
  const existing = document.querySelectorAll('script[type="application/ld+json"]')
  existing.forEach(s => s.remove())
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(schema, null, 2)
  document.head.appendChild(script)
}

/** 在页面中插入多个 JSON-LD（会先清空所有同类脚本） */
export function insertMultipleStructuredData(schemas) {
  const existing = document.querySelectorAll('script[type="application/ld+json"]')
  existing.forEach(s => s.remove())
  schemas.forEach(schema => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(schema, null, 2)
    document.head.appendChild(script)
  })
}


