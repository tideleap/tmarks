/**
 * 内容提取工具函数
 */

/**
 * 安全地解析URL
 */
export function safeParseUrl(urlString: string, baseUrl?: string): string {
  if (!urlString || typeof urlString !== 'string') return '';

  try {
    urlString = urlString.trim();
    if (!urlString) return '';

    const absoluteUrl = new URL(urlString, baseUrl || window.location.href);

    if (absoluteUrl.protocol !== 'http:' && absoluteUrl.protocol !== 'https:') {
      return '';
    }

    return absoluteUrl.href;
  } catch (e) {
    return '';
  }
}
