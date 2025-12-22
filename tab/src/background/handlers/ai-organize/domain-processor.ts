/**
 * 域名处理与汇总
 */

import type { Shortcut } from '@/newtab/types';
import { DAY_MS, ROOT_PATH_PLACEHOLDER } from '../../constants';
import { aggregateShortcutStats, type DomainHistoryStat } from '../../services/history-stats';
import type { DomainSummary } from './types';

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  path: string;
  domain: string;
}

export function buildDomainToItemsMap(
  sourceBookmarks: BookmarkItem[]
): Map<string, { id: string; title: string; url: string; path: string }[]> {
  const domainToItems = new Map<
    string,
    { id: string; title: string; url: string; path: string }[]
  >();

  for (const b of sourceBookmarks) {
    const domainKey = b.domain || '(no-domain)';
    const list = domainToItems.get(domainKey) || [];
    list.push({ id: b.id, title: b.title, url: b.url, path: b.path });
    domainToItems.set(domainKey, list);
  }

  return domainToItems;
}

export function buildFolderPathCounts(
  sourceBookmarks: BookmarkItem[]
): Array<{ path: string; count: number }> {
  const folderPathCounts = new Map<string, number>();

  for (const bookmark of sourceBookmarks) {
    const folderPath = bookmark.path || ROOT_PATH_PLACEHOLDER;
    if (!folderPath) continue;
    folderPathCounts.set(folderPath, (folderPathCounts.get(folderPath) ?? 0) + 1);
  }

  return Array.from(folderPathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 500)
    .map(([path, count]) => ({ path, count }));
}

export function buildDomainSummaries(
  domainToItems: Map<string, { id: string; title: string; url: string; path: string }[]>,
  shortcuts: Shortcut[],
  historyStats: Map<string, DomainHistoryStat> | null,
  historyDays: number
): { summaries: DomainSummary[]; domainPreferredPathMap: Map<string, string> } {
  const shortcutStats = aggregateShortcutStats(shortcuts);
  const domainPreferredPathMap = new Map<string, string>();

  const allDomainSummaries = Array.from(domainToItems.entries()).map(([domain, list]) => {
    const domainKey = domain || '(no-domain)';
    const shortcutStat = shortcutStats.get(domainKey) || { clickCount: 0, shortcutCount: 0 };
    const historyStat = historyStats?.get(domainKey);
    const historyCount = historyStat?.count ?? 0;
    const historyLastVisit = historyStat?.lastVisitTime ?? null;
    const recencyScore = historyLastVisit
      ? Math.max(
          0,
          Math.min(
            1,
            1 - Math.min((Date.now() - historyLastVisit) / DAY_MS, historyDays) / historyDays
          )
        )
      : 0;
    const bookmarkCount = list.length;
    const clickCount = shortcutStat.clickCount;
    const heatScoreRaw =
      bookmarkCount * 1 + clickCount * 0.5 + historyCount * 0.3 + recencyScore * 2;
    const heatScore = Number(heatScoreRaw.toFixed(3));

    const pathCountMap = new Map<string, number>();
    for (const item of list) {
      const normalizedPath = item.path || ROOT_PATH_PLACEHOLDER;
      pathCountMap.set(normalizedPath, (pathCountMap.get(normalizedPath) ?? 0) + 1);
    }
    const sortedPathCounts = Array.from(pathCountMap.entries()).sort((a, b) => b[1] - a[1]);
    const topPathCounts = sortedPathCounts.slice(0, 5).map(([path, count]) => ({ path, count }));

    if (topPathCounts.length > 0) {
      domainPreferredPathMap.set(domainKey, topPathCounts[0].path);
    }

    return {
      domain: domainKey,
      count: bookmarkCount,
      bookmarkCount,
      shortcutCount: shortcutStat.shortcutCount,
      clickCount,
      historyCount,
      historyLastVisit,
      historyLastVisitISO: historyLastVisit ? new Date(historyLastVisit).toISOString() : null,
      recencyScore: Number(recencyScore.toFixed(3)),
      heatScore,
      samples: list.slice(0, 3).map((x) => ({ title: x.title, url: x.url, path: x.path })),
      originalPaths: topPathCounts,
    };
  });

  // 按热度排序
  const sortedDomainSummaries = allDomainSummaries.sort((a, b) => {
    if ((b.heatScore ?? 0) !== (a.heatScore ?? 0)) {
      return (b.heatScore ?? 0) - (a.heatScore ?? 0);
    }
    return (b.bookmarkCount ?? b.count ?? 0) - (a.bookmarkCount ?? a.count ?? 0);
  });

  return { summaries: sortedDomainSummaries, domainPreferredPathMap };
}
