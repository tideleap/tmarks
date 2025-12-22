/**
 * AI 连接管理工具函数
 */

import type { AIProvider, AIConnectionInfo } from '@/types';
import { MAX_SAVED_CONNECTIONS, generateConnectionId } from './types';

export function upsertSavedConnection(
  existing: Partial<Record<AIProvider, AIConnectionInfo[]>>,
  provider: AIProvider,
  connection: AIConnectionInfo
): Partial<Record<AIProvider, AIConnectionInfo[]>> {
  const list = existing[provider] || [];
  const normalizedUrl = (connection.apiUrl || '').trim();
  const normalizedKey = (connection.apiKey || '').trim();
  const normalizedModel = (connection.model || '').trim();

  const newEntry: AIConnectionInfo = {
    ...connection,
    apiUrl: normalizedUrl || undefined,
    apiKey: normalizedKey || undefined,
    model: normalizedModel || undefined,
    provider,
    label: connection.label?.trim() || connection.label,
    lastUsedAt: Date.now(),
    id: connection.id || generateConnectionId(),
  };

  const hasId = Boolean(connection.id);
  const existingIndex = hasId ? list.findIndex((item) => item.id && item.id === connection.id) : -1;
  let updatedList: AIConnectionInfo[];

  if (hasId && existingIndex >= 0) {
    updatedList = [...list];
    updatedList[existingIndex] = newEntry;
  } else {
    updatedList = [newEntry, ...list].slice(0, MAX_SAVED_CONNECTIONS);
  }

  return {
    ...existing,
    [provider]: updatedList,
  };
}

export function removeSavedConnection(
  existing: Partial<Record<AIProvider, AIConnectionInfo[]>>,
  provider: AIProvider,
  target: AIConnectionInfo
): Partial<Record<AIProvider, AIConnectionInfo[]>> {
  const list = existing[provider] || [];
  const normalizedUrl = (target.apiUrl || '').trim();
  const normalizedKey = (target.apiKey || '').trim();
  const normalizedModel = (target.model || '').trim();

  const filtered = list.filter((item) => {
    if (target.id && item.id) {
      return item.id !== target.id;
    }

    return (
      (item.apiUrl || '').trim() !== normalizedUrl ||
      (item.apiKey || '').trim() !== normalizedKey ||
      (item.model || '').trim() !== normalizedModel
    );
  });

  const updated: Partial<Record<AIProvider, AIConnectionInfo[]>> = {
    ...existing,
  };

  if (filtered.length > 0) {
    updated[provider] = filtered;
  } else {
    delete updated[provider];
  }

  return updated;
}
