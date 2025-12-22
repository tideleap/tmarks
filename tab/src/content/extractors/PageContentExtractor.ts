/**
 * 页面内容提取器
 */

import type { PageInfo } from '@/types';
import { safeParseUrl } from './utils';

export class PageContentExtractor {
  /**
   * Extract page information
   */
  extract(): PageInfo {
    const thumbnails = this.getAllThumbnails();
    return {
      title: this.getTitle(),
      url: window.location.href,
      description: this.getDescription(),
      content: this.getMainContent(),
      thumbnail: thumbnails[0] || '',
      thumbnails: thumbnails,
      favicon: this.getFavicon(),
    };
  }

  /**
   * Get page title
   */
  private getTitle(): string {
    return (
      document.title ||
      this.getMeta('og:title') ||
      document.querySelector('h1')?.textContent?.trim() ||
      'Untitled'
    );
  }

  /**
   * Get page description
   */
  private getDescription(): string {
    return (
      this.getMeta('description') ||
      this.getMeta('og:description') ||
      this.getMeta('twitter:description') ||
      ''
    );
  }

  /**
   * Get main content from page
   */
  private getMainContent(): string {
    const contentElement =
      document.querySelector('article') ||
      document.querySelector('main') ||
      document.querySelector('[role="main"]') ||
      document.body;

    if (!contentElement) {
      return '';
    }

    const clone = contentElement.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll('script, style, nav, header, footer, iframe, noscript')
      .forEach((el) => el.remove());

    const text = clone.textContent || '';
    return text.replace(/\s+/g, ' ').trim().substring(0, 1000);
  }

  /**
   * Get website favicon/logo
   */
  private getFavicon(): string {
    // 1. Apple Touch Icon
    try {
      const appleTouchIcons = Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel="apple-touch-icon"]')
      );
      if (appleTouchIcons.length > 0) {
        let largestIcon: HTMLLinkElement | undefined;
        let maxSize = 0;

        for (const icon of appleTouchIcons) {
          if (icon.href) {
            const sizes = icon.getAttribute('sizes');
            if (sizes) {
              const size = parseInt(sizes.split('x')[0]);
              if (!isNaN(size) && size > maxSize) {
                maxSize = size;
                largestIcon = icon;
              }
            } else if (!largestIcon) {
              largestIcon = icon;
            }
          }
        }

        if (largestIcon && largestIcon.href) {
          const url = safeParseUrl(largestIcon.href);
          if (url) return url;
        }
      }
    } catch (e) {
      // Silently handle error
    }

    // 2. Standard icon
    try {
      const iconLinks = Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]')
      );
      if (iconLinks.length > 0) {
        let bestIcon: HTMLLinkElement | undefined;
        let maxSize = 0;

        for (const icon of iconLinks) {
          if (icon.href) {
            const type = icon.getAttribute('type') || '';
            const sizes = icon.getAttribute('sizes');
            const href = icon.href.toLowerCase();

            if (type.includes('svg') || href.endsWith('.svg')) {
              bestIcon = icon;
              break;
            }

            if (type.includes('png') || href.endsWith('.png')) {
              if (sizes) {
                const size = parseInt(sizes.split('x')[0]);
                if (!isNaN(size) && size > maxSize) {
                  maxSize = size;
                  bestIcon = icon;
                }
              } else if (!bestIcon || maxSize === 0) {
                bestIcon = icon;
              }
            }

            if (!bestIcon) {
              bestIcon = icon;
            }
          }
        }

        if (bestIcon && bestIcon.href) {
          const url = safeParseUrl(bestIcon.href);
          if (url) return url;
        }
      }
    } catch (e) {
      // Silently handle error
    }

    // 3. Chrome favicon API
    try {
      const domain = window.location.origin;
      return `chrome://favicon/size/64@2x/${domain}`;
    } catch (e) {
      // Silently handle error
    }

    // 4. Fallback to favicon.ico
    try {
      return new URL('/favicon.ico', window.location.origin).href;
    } catch (e) {
      // Silently handle error
    }

    return '';
  }

  /**
   * Get all possible page thumbnails/cover images
   */
  private getAllThumbnails(): string[] {
    const thumbnails: string[] = [];

    // 1. Open Graph image
    try {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage instanceof HTMLMetaElement && ogImage.content) {
        const url = safeParseUrl(ogImage.content);
        if (url && !thumbnails.includes(url)) {
          thumbnails.push(url);
        }
      }
    } catch (e) {
      // Silently handle error
    }

    // 2. Twitter image
    try {
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage instanceof HTMLMetaElement && twitterImage.content) {
        const url = safeParseUrl(twitterImage.content);
        if (url && !thumbnails.includes(url)) {
          thumbnails.push(url);
        }
      }
    } catch (e) {
      // Silently handle error
    }

    // 3. Large images in page
    try {
      const searchAreas = [
        document.querySelector('main'),
        document.querySelector('[role="main"]'),
        document.querySelector('article'),
        document.body,
      ].filter(Boolean) as HTMLElement[];

      const foundImages: Array<{ url: string; area: number }> = [];

      for (const area of searchAreas) {
        if (!area) continue;
        const images = area.querySelectorAll('img');

        for (const img of images) {
          try {
            if (!img.src) continue;
            if (img.src.startsWith('data:') || img.src.startsWith('blob:')) continue;

            let width = img.naturalWidth;
            let height = img.naturalHeight;

            if (width === 0 || height === 0) {
              const attrWidth = img.getAttribute('width');
              const attrHeight = img.getAttribute('height');

              if (attrWidth && attrHeight) {
                const parsedWidth = parseInt(attrWidth);
                const parsedHeight = parseInt(attrHeight);
                if (!isNaN(parsedWidth) && !isNaN(parsedHeight)) {
                  width = parsedWidth;
                  height = parsedHeight;
                }
              }

              if (width === 0 || height === 0) {
                width = img.width || img.offsetWidth || img.clientWidth;
                height = img.height || img.offsetHeight || img.clientHeight;
              }
            }

            if (width > 200 && height > 200 && width < 5000 && height < 5000) {
              const url = safeParseUrl(img.src);
              if (url && !foundImages.some((item) => item.url === url)) {
                foundImages.push({ url, area: width * height });
              }
            }
          } catch (imgError) {
            continue;
          }
        }
      }

      foundImages.sort((a, b) => b.area - a.area);
      const topImages = foundImages.slice(0, 5);

      for (const { url } of topImages) {
        if (!thumbnails.includes(url)) {
          thumbnails.push(url);
        }
      }
    } catch (e) {
      // Silently handle error
    }

    return thumbnails;
  }

  /**
   * Get meta tag content
   */
  private getMeta(name: string): string {
    const meta =
      document.querySelector(`meta[name="${name}"]`) ||
      document.querySelector(`meta[property="${name}"]`);
    return meta?.getAttribute('content') || '';
  }
}
