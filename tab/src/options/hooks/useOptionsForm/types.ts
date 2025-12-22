/**
 * Options Form 类型定义
 */

import type { AIProvider, AIConnectionInfo } from '@/types';

export interface OptionsFormData {
  theme: 'light' | 'dark' | 'auto';
  themeStyle: 'default' | 'bw' | 'tmarks';
  aiProvider: AIProvider;
  apiKey: string;
  apiUrl: string;
  aiModel: string;
  bookmarkApiUrl: string;
  bookmarkApiKey: string;
  enableCustomPrompt: boolean;
  customPrompt: string;
  maxSuggestedTags: number;
  defaultVisibility: 'public' | 'private';
  enableAI: boolean;
  aiBookmarkClassifyScope: 'newtab_root' | 'bookmarks_bar' | 'all';
  defaultIncludeThumbnail: boolean;
  defaultCreateSnapshot: boolean;
  tagTheme: 'classic' | 'mono' | 'bw';
  newtabFolderRecommendCount: number;
  enableNewtabAI: boolean;
  enableNewtabFolderPrompt: boolean;
  newtabFolderPrompt: string;
}

export interface OptionsFormStats {
  tags: number;
  bookmarks: number;
  lastSync: number;
}

export const DEFAULT_FORM_DATA: OptionsFormData = {
  theme: 'auto',
  themeStyle: 'default',
  aiProvider: 'openai',
  apiKey: '',
  apiUrl: '',
  aiModel: '',
  bookmarkApiUrl: '',
  bookmarkApiKey: '',
  enableCustomPrompt: false,
  customPrompt: '',
  maxSuggestedTags: 5,
  defaultVisibility: 'public',
  enableAI: true,
  aiBookmarkClassifyScope: 'newtab_root',
  defaultIncludeThumbnail: true,
  defaultCreateSnapshot: false,
  tagTheme: 'classic',
  newtabFolderRecommendCount: 10,
  enableNewtabAI: true,
  enableNewtabFolderPrompt: false,
  newtabFolderPrompt: '',
};

export const MAX_SAVED_CONNECTIONS = 10;

export const generateConnectionId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

export function normalizeSavedConnections(input?: Partial<Record<AIProvider, AIConnectionInfo[]>>) {
  const normalized: Partial<Record<AIProvider, AIConnectionInfo[]>> = {};

  if (!input) {
    return normalized;
  }

  (Object.keys(input) as AIProvider[]).forEach((provider) => {
    const list = input[provider] || [];
    normalized[provider] = Array.isArray(list)
      ? list.slice(0, MAX_SAVED_CONNECTIONS).map((item) => ({
          ...item,
          provider: item.provider || provider,
          id: item.id || generateConnectionId(),
        }))
      : [];
  });

  return normalized;
}
