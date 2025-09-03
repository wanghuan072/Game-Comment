/**
 * SEO 工具（可移植）
 * 注意：跨项目需要更改的地方已在下方中文注释中标注
 */

// 站点默认 TDK（跨项目可替换）
const defaultSEO = {
  // 【需替换】站点默认标题（跨项目修改）
  title: 'Example Games - Play Free Online Games',
  // 【需替换】站点默认描述（跨项目修改）
  description: 'Discover and play free online games. Enjoy a clean, fast, and friendly gaming experience.',
  // 【可替换】站点默认关键词（跨项目修改）
  keywords: 'online games, free games, web games'
}

// 默认社交媒体配置（跨项目可替换）
const defaultSocial = {
  // 【需替换】站点名（跨项目修改）
  siteName: 'Example Games',
  type: 'website',
  // 【可替换】默认分享图（跨项目修改，建议放主站 CDN 或 public）
  image: '/favicon.ico',
  imageAlt: 'Example Games',
  twitterCard: 'summary_large_image',
  // 【需替换】Twitter 账号占位（跨项目修改）
  twitterSite: '@example',
  twitterCreator: '@example'
}

/**
 * 设置页面 TDK 与社交媒体标签
 * @param {Object} seo - { title, description, keywords }
 * @param {string|null} canonicalUrl - 规范 URL（不带末尾斜杠，根路径除外）
 */
export function setPageSEO(seo = {}, canonicalUrl = null) {
  const { title, description, keywords } = { ...defaultSEO, ...seo }

  // 设置 Title
  document.title = title

  // 设置基础 Meta
  setMetaTag('description', description)
  setMetaTag('keywords', keywords)

  // Canonical
  if (canonicalUrl) {
    setCanonicalUrl(canonicalUrl)
  }

  // 统一设置社交媒体标签
  setSocialTags(title, description, seo?.image)
}

/**
 * 设置社交媒体标签（Open Graph + Twitter）
 * @param {string} title
 * @param {string} description
 * @param {string|null} image
 * @param {string} type
 */
export function setSocialTags(title, description, image = null, type = 'website') {
  // Open Graph
  setMetaTag('og:title', title)
  setMetaTag('og:description', description)
  setMetaTag('og:type', type)
  setMetaTag('og:url', window.location.href)
  setMetaTag('og:image', image || defaultSocial.image)
  setMetaTag('og:image:alt', defaultSocial.imageAlt)
  setMetaTag('og:site_name', defaultSocial.siteName)

  // Twitter Card
  setMetaTag('twitter:card', defaultSocial.twitterCard)
  setMetaTag('twitter:site', defaultSocial.twitterSite)
  setMetaTag('twitter:creator', defaultSocial.twitterCreator)
  setMetaTag('twitter:title', title)
  setMetaTag('twitter:description', description)
  setMetaTag('twitter:image', image || defaultSocial.image)
  setMetaTag('twitter:image:alt', defaultSocial.imageAlt)
}

/**
 * 创建或更新 meta 标签
 * @param {string} name - meta 的 name 或 property
 * @param {string} content
 */
function setMetaTag(name, content) {
  if (typeof content !== 'string') return
  let meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      meta.setAttribute('property', name)
    } else {
      meta.setAttribute('name', name)
    }
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

/**
 * 设置 Canonical URL
 * @param {string} url
 */
export function setCanonicalUrl(url) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

/**
 * 恢复默认 TDK
 */
export function resetToDefaultSEO() {
  setPageSEO(defaultSEO)
}


