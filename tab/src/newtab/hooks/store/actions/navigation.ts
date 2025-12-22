/**
 * 导航相关 Actions（文件夹导航、重排序等）
 */

import type { NewTabState } from '../types';
import { MAX_FOLDER_DEPTH, pruneEmptySecondLevelFolders, pruneEmptyFoldersCascade } from '../utils';
import { debouncedSync } from '../sync';

export interface NavigationActions {
  setCurrentFolderId: (folderId: string | null) => void;
  moveGridItemToFolder: (id: string, folderId: string | null) => void;
  reorderGridItemsInCurrentScope: (activeId: string, overId: string) => void;
  reorderGridItemsInFolderScope: (folderId: string, activeId: string, overId: string) => void;
  cleanupEmptySecondLevelFolders: () => void;
  cleanupAllEmptyFolders: () => void;
  migrateToGridItems: () => void;
}

export function createNavigationActions(
  set: (partial: Partial<NewTabState> | ((state: NewTabState) => Partial<NewTabState>)) => void,
  get: () => NewTabState,
  resolveBookmarkParentId: (opts: {
    parentGridId?: string | null;
    inferredGroupId?: string | null;
  }) => Promise<string | null>
): NavigationActions {
  return {
    setCurrentFolderId: (folderId) => {
      set({ currentFolderId: folderId });
    },

    moveGridItemToFolder: (id, folderId) => {
      const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData, browserBookmarksRootId } = get();
      const moving = gridItems.find((i) => i.id === id);
      if (!moving) return;

      const getDepth = (parentId: string | null): number => {
        if (!parentId) return 0;
        const parent = gridItems.find((i) => i.id === parentId);
        if (!parent) return 0;
        return 1 + getDepth(parent.parentId ?? null);
      };

      const targetDepth = getDepth(folderId);

      const getMaxChildDepth = (itemId: string): number => {
        const children = gridItems.filter((i) => i.parentId === itemId);
        if (children.length === 0) return 0;
        return 1 + Math.max(...children.map((c) => getMaxChildDepth(c.id)));
      };

      const movingMaxChildDepth = moving.type === 'bookmarkFolder' ? getMaxChildDepth(moving.id) : 0;
      const totalDepth = targetDepth + 1 + movingMaxChildDepth;

      if (totalDepth > MAX_FOLDER_DEPTH) {
        console.warn(`[NewTab] 文件夹层级超出限制 (${totalDepth} > ${MAX_FOLDER_DEPTH})`);
        return;
      }

      const targetParentId = folderId ?? null;
      const isBrowserSynced = !!moving.browserBookmarkId;
      const inferredGroupId = (() => {
        if (isBrowserSynced) return moving.groupId ?? 'home';
        const activeGroupId = get().activeGroupId ?? 'home';
        const targetFolder = folderId ? gridItems.find((i) => i.id === folderId) : null;
        const sourceFolder = moving.parentId ? gridItems.find((i) => i.id === moving.parentId) : null;
        return (targetFolder?.groupId ?? sourceFolder?.groupId ?? moving.groupId ?? activeGroupId) as string;
      })();

      const targetScope = gridItems
        .filter((item) => {
          if (item.id === id) return false;
          if ((item.parentId ?? null) !== targetParentId) return false;
          if (isBrowserSynced) return !!item.browserBookmarkId;
          return !item.browserBookmarkId && (item.groupId ?? 'home') === inferredGroupId;
        })
        .sort((a, b) => a.position - b.position);

      const nextPosition = targetScope.length;

      const newGridItems = gridItems.map((item) => {
        if (item.id !== id) return item;
        return { ...item, groupId: inferredGroupId, parentId: targetParentId ?? undefined, position: nextPosition };
      });
      const protectedBrowserBookmarkIds = new Set<string>([browserBookmarksRootId].filter(Boolean) as string[]);
      const cleaned = pruneEmptyFoldersCascade(newGridItems, get().currentFolderId, protectedBrowserBookmarkIds);
      set({ gridItems: cleaned.items, currentFolderId: cleaned.currentFolderId });
      saveData();
      debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: cleaned.items });

      const state = get();
      if (!state.isApplyingBrowserBookmarks && cleaned.removedBrowserBookmarkIds.length > 0) {
        (async () => {
          try {
            state.setBrowserBookmarkWriteLockUntil(Date.now() + 1200);
            for (const bid of cleaned.removedBrowserBookmarkIds) {
              try {
                await chrome.bookmarks.removeTree(bid);
              } catch {
                try {
                  await chrome.bookmarks.remove(bid);
                } catch {}
              }
            }
          } catch {}
        })();
      }

      if (!isBrowserSynced && inferredGroupId === 'home' && targetParentId === null) {
        get().mirrorHomeItemsToBrowser([id]);
      }

      const state2 = get();
      if (!state2.isApplyingBrowserBookmarks && moving.browserBookmarkId) {
        (async () => {
          try {
            const targetParentBookmarkId = await resolveBookmarkParentId({
              parentGridId: folderId,
              inferredGroupId,
            });
            if (!targetParentBookmarkId) return;

            state2.setBrowserBookmarkWriteLockUntil(Date.now() + 800);
            await chrome.bookmarks.move(moving.browserBookmarkId!, {
              parentId: targetParentBookmarkId,
              index: nextPosition,
            });
          } catch (e) {
            console.warn('[NewTab] Failed to move browser bookmark:', e);
          }
        })();
      }
    },

    reorderGridItemsInCurrentScope: (activeId, overId) => {
      const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, activeGroupId, currentFolderId, saveData } = get();
      const targetGroupId = activeGroupId ?? 'home';
      const scopeItems = gridItems
        .filter((item) => item.groupId === targetGroupId && (item.parentId ?? null) === (currentFolderId ?? null))
        .sort((a, b) => a.position - b.position);

      const fromIndex = scopeItems.findIndex((i) => i.id === activeId);
      const toIndex = scopeItems.findIndex((i) => i.id === overId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

      const reorderedScope = [...scopeItems];
      const [removed] = reorderedScope.splice(fromIndex, 1);
      reorderedScope.splice(toIndex, 0, removed);

      const positionById = new Map(reorderedScope.map((item, index) => [item.id, index] as const));
      const newGridItems = gridItems.map((item) => {
        const nextPos = positionById.get(item.id);
        return nextPos === undefined ? item : { ...item, position: nextPos };
      });

      set({ gridItems: newGridItems });
      saveData();
      debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: newGridItems });

      const state = get();
      const activeItem = scopeItems[fromIndex];
      if (!state.isApplyingBrowserBookmarks && activeItem?.browserBookmarkId) {
        (async () => {
          try {
            const parentBookmarkId = await resolveBookmarkParentId({
              parentGridId: state.currentFolderId,
              inferredGroupId: targetGroupId,
            });
            if (!parentBookmarkId) return;

            state.setBrowserBookmarkWriteLockUntil(Date.now() + 800);
            await chrome.bookmarks.move(activeItem.browserBookmarkId!, {
              parentId: parentBookmarkId,
              index: toIndex,
            });
          } catch (e) {
            console.warn('[NewTab] Failed to reorder browser bookmark:', e);
          }
        })();
      }
    },

    reorderGridItemsInFolderScope: (folderId, activeId, overId) => {
      const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
      const folder = gridItems.find((i) => i.id === folderId);
      if (!folder) return;

      const targetGroupId = folder.groupId ?? 'home';
      const scopeItems = gridItems
        .filter((item) => item.groupId === targetGroupId && (item.parentId ?? null) === folderId)
        .sort((a, b) => a.position - b.position);

      const fromIndex = scopeItems.findIndex((i) => i.id === activeId);
      const toIndex = scopeItems.findIndex((i) => i.id === overId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

      const reorderedScope = [...scopeItems];
      const [removed] = reorderedScope.splice(fromIndex, 1);
      reorderedScope.splice(toIndex, 0, removed);

      const positionById = new Map(reorderedScope.map((item, index) => [item.id, index] as const));
      const newGridItems = gridItems.map((item) => {
        const nextPos = positionById.get(item.id);
        return nextPos === undefined ? item : { ...item, position: nextPos };
      });

      set({ gridItems: newGridItems });
      saveData();
      debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: newGridItems });

      const state = get();
      const activeItem = scopeItems[fromIndex];
      if (!state.isApplyingBrowserBookmarks && activeItem?.browserBookmarkId) {
        (async () => {
          try {
            const parentBookmarkId = await resolveBookmarkParentId({
              parentGridId: folderId,
              inferredGroupId: state.gridItems.find((i) => i.id === folderId)?.groupId ?? null,
            });
            if (!parentBookmarkId) return;

            state.setBrowserBookmarkWriteLockUntil(Date.now() + 800);
            await chrome.bookmarks.move(activeItem.browserBookmarkId!, {
              parentId: parentBookmarkId,
              index: toIndex,
            });
          } catch (e) {
            console.warn('[NewTab] Failed to reorder browser bookmark:', e);
          }
        })();
      }
    },

    cleanupEmptySecondLevelFolders: () => {
      const { gridItems, currentFolderId, shortcuts, shortcutGroups, shortcutFolders, settings, saveData } = get();
      const { items, currentFolderId: nextFolderId, changed } = pruneEmptySecondLevelFolders(gridItems, currentFolderId);
      if (!changed) return;

      set({ gridItems: items, currentFolderId: nextFolderId });
      saveData();
      debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: items });
    },

    cleanupAllEmptyFolders: () => {
      const { gridItems, currentFolderId, shortcuts, shortcutGroups, shortcutFolders, settings, saveData, browserBookmarksRootId } = get();
      const protectedBrowserBookmarkIds = new Set<string>([browserBookmarksRootId].filter(Boolean) as string[]);
      const cleaned = pruneEmptyFoldersCascade(gridItems, currentFolderId, protectedBrowserBookmarkIds);
      if (!cleaned.changed) return;

      set({ gridItems: cleaned.items, currentFolderId: cleaned.currentFolderId });
      saveData();
      debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: cleaned.items });

      // 删除浏览器书签中的空文件夹
      const state = get();
      if (!state.isApplyingBrowserBookmarks && cleaned.removedBrowserBookmarkIds.length > 0) {
        (async () => {
          try {
            state.setBrowserBookmarkWriteLockUntil(Date.now() + 1200);
            for (const bid of cleaned.removedBrowserBookmarkIds) {
              try {
                await chrome.bookmarks.removeTree(bid);
              } catch {
                try {
                  await chrome.bookmarks.remove(bid);
                } catch {}
              }
            }
          } catch {}
        })();
      }
    },

    migrateToGridItems: () => {
      // Migration logic if needed
    },
  };
}
