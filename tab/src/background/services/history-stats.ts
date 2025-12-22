/**
 * 历史记录统计服务
 */

import { HISTORY_MAX_RESULTS, DAY_MS } from '../constants';
import { getHostname } from '../utils/json-parser';
import type { Shortcut } from '@/newtab/types';

export type DomainHistoryStat = {
  count: number;
  lastVisitTime: number;
};

export type ShortcutDomainStat = {
  clickCount: number;
  shortcutCount: number;
};

/**
 * 收集域名历史统计
 */
export async function collectDomainHistoryStats(days: number): Promise<{
  domains: Map<string, DomainHistoryStat>;
  totalItems: number;
  truncated: boolean;
}> {
  if (!chrome.history || typeof chrome.history.search !== 'function') {
    throw new Error('History API unavailable');
  }
  const startTime = Date.now() - days * DAY_MS;
  const results = await chrome.history.search({
    text: '',
    startTime,
    maxResults: HISTORY_MAX_RESULTS,
  });
  const domains = new Map<string, DomainHistoryStat>();
  for (const item of results) {
    if (!item?.url) continue;
    const domain = getHostname(item.url) || '(no-domain)';
    const stat = domains.get(domain) || { count: 0, lastVisitTime: 0 };
    stat.count += 1;
    if (typeof item.lastVisitTime === 'number' && item.lastVisitTime > stat.lastVisitTime) {
      stat.lastVisitTime = item.lastVisitTime;
    }
    domains.set(domain, stat);
  }
  return {
    domains,
    totalItems: results.length,
    truncated: results.length >= HISTORY_MAX_RESULTS,
  };
}

/**
 * 聚合快捷方式统计
 */
export function aggregateShortcutStats(
  shortcuts: Shortcut[]
): Map<string, ShortcutDomainStat> {
  const map = new Map<string, ShortcutDomainStat>();
  for (const shortcut of shortcuts || []) {
    if (!shortcut?.url) continue;
    const domain = getHostname(shortcut.url) || '(no-domain)';
    const next = map.get(domain) || { clickCount: 0, shortcutCount: 0 };
    next.shortcutCount += 1;
    next.clickCount += typeof shortcut.clickCount === 'number' ? shortcut.clickCount : 0;
    map.set(domain, next);
  }
  return map;
}
