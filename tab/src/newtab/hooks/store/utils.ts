/**
 * NewTab Store 工具函数
 */

import type { GridItem } from '../../types';

// 文件夹最大嵌套层级限制
export const MAX_FOLDER_DEPTH = 5;

// 生成唯一 ID
export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// 检查是否有书签 API
export const hasBookmarksApi = () => typeof chrome !== 'undefined' && !!chrome.bookmarks;

// 判断是否是首页根级项目
export const isHomeRootItem = (item: GridItem) =>
  (item.groupId ?? 'home') === 'home' && (item.parentId ?? null) === null;

/**
 * 清理空的二级文件夹
 */
export function pruneEmptySecondLevelFolders(
  items: GridItem[],
  currentFolderId: string | null
): { items: GridItem[]; currentFolderId: string | null; changed: boolean } {
  const itemsById = new Map(items.map((i) => [i.id, i] as const));
  const childCount = new Map<string, number>();
  for (const item of items) {
    if (item.parentId) {
      childCount.set(item.parentId, (childCount.get(item.parentId) ?? 0) + 1);
    }
  }

  const toRemove = new Set<string>();
  for (const item of items) {
    if (item.type !== 'bookmarkFolder' || item.browserBookmarkId || !item.parentId) continue;
    const parent = itemsById.get(item.parentId);
    const parentIsRoot = parent && (parent.parentId ?? null) === null;
    if (parentIsRoot && (childCount.get(item.id) ?? 0) === 0) {
      toRemove.add(item.id);
    }
  }

  if (toRemove.size === 0) {
    return { items, currentFolderId, changed: false };
  }

  const filtered = items.filter((item) => !toRemove.has(item.id));

  const scopeMap = new Map<string, GridItem[]>();
  filtered.forEach((item) => {
    const key = `${item.groupId ?? 'home'}|${item.parentId ?? 'root'}`;
    if (!scopeMap.has(key)) scopeMap.set(key, []);
    scopeMap.get(key)!.push(item);
  });

  const posById = new Map<string, number>();
  scopeMap.forEach((scopeItems) => {
    scopeItems.sort((a, b) => a.position - b.position);
    scopeItems.forEach((item, index) => {
      posById.set(item.id, index);
    });
  });

  const reordered = filtered.map((item) => {
    const nextPos = posById.get(item.id);
    return nextPos !== undefined && nextPos !== item.position ? { ...item, position: nextPos } : item;
  });

  const nextCurrentFolderId = currentFolderId && toRemove.has(currentFolderId) ? null : currentFolderId;
  return { items: reordered, currentFolderId: nextCurrentFolderId, changed: true };
}

/**
 * 级联清理空文件夹
 */
export function pruneEmptyFoldersCascade(
  items: GridItem[],
  currentFolderId: string | null,
  protectedBrowserBookmarkIds: Set<string>
): {
  items: GridItem[];
  currentFolderId: string | null;
  changed: boolean;
  removedBrowserBookmarkIds: string[];
} {
  let working = items;
  const removed = new Set<string>();
  const removedBrowserBookmarkIds: string[] = [];
  let changed = false;

  while (true) {
    const childCount = new Map<string, number>();
    for (const item of working) {
      if (item.parentId) {
        childCount.set(item.parentId, (childCount.get(item.parentId) ?? 0) + 1);
      }
    }

    const toRemove = new Set<string>();
    for (const item of working) {
      if (item.type !== 'bookmarkFolder') continue;
      if ((childCount.get(item.id) ?? 0) !== 0) continue;

      // 只保留首页分组的顶层文件夹，其他分组的空文件夹都删除
      const isHomeRootFolder = (item.groupId ?? 'home') === 'home' && (item.parentId ?? null) === null;
      if (isHomeRootFolder) continue;

      if (item.browserBookmarkId) {
        if (protectedBrowserBookmarkIds.has(item.browserBookmarkId)) continue;
        removedBrowserBookmarkIds.push(item.browserBookmarkId);
      }

      toRemove.add(item.id);
    }

    if (toRemove.size === 0) break;

    changed = true;
    toRemove.forEach((id) => removed.add(id));
    working = working.filter((item) => !toRemove.has(item.id));
  }

  if (!changed) {
    return { items, currentFolderId, changed: false, removedBrowserBookmarkIds: [] };
  }

  const scopeMap = new Map<string, GridItem[]>();
  working.forEach((item) => {
    const key = `${item.groupId ?? 'home'}|${item.parentId ?? 'root'}`;
    if (!scopeMap.has(key)) scopeMap.set(key, []);
    scopeMap.get(key)!.push(item);
  });

  const posById = new Map<string, number>();
  scopeMap.forEach((scopeItems) => {
    scopeItems.sort((a, b) => a.position - b.position);
    scopeItems.forEach((item, index) => {
      posById.set(item.id, index);
    });
  });

  const reordered = working.map((item) => {
    const nextPos = posById.get(item.id);
    return nextPos !== undefined && nextPos !== item.position ? { ...item, position: nextPos } : item;
  });

  const nextCurrentFolderId = currentFolderId && removed.has(currentFolderId) ? null : currentFolderId;
  return { items: reordered, currentFolderId: nextCurrentFolderId, changed: true, removedBrowserBookmarkIds };
}
