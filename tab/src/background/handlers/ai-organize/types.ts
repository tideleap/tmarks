/**
 * AI 整理工作区类型定义
 */

export interface AiOrganizePayload {
  rules?: string;
  maxBookmarks?: number;
  promptTemplate?: string;
  sessionId?: string;
  enableHistoryHeat?: boolean;
  historyDays?: number;
  historyHeatTopN?: number;
  strictHierarchy?: boolean;
  allowNewFolders?: boolean;
  preferOriginalPaths?: boolean;
  verboseLogs?: boolean;
  topLevelCount?: number;
}

export interface DomainSummary {
  domain: string;
  count: number;
  bookmarkCount: number;
  shortcutCount: number;
  clickCount: number;
  historyCount: number;
  historyLastVisit: number | null;
  historyLastVisitISO: string | null;
  recencyScore: number;
  heatScore: number;
  samples: Array<{ title: string; url: string; path: string }>;
  originalPaths: Array<{ path: string; count: number }>;
}

export interface DomainMove {
  domain: string;
  path: string;
}
