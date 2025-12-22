import { useEffect, useRef } from 'react';
import { ensureHomeFolder, useNewtabStore } from './useNewtabStore';
import type { GridItem, GridItemSize } from '../types';

const ROOT_TITLE = 'TMarks';
const STORAGE_KEY_ROOT_ID = 'tmarks_root_bookmark_id';

function hasBookmarksApi(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.bookmarks;
}

function isFolder(node: chrome.bookmarks.BookmarkTreeNode) {
  return !node.url;
}

function defaultSizeFor(node: chrome.bookmarks.BookmarkTreeNode): GridItemSize {
  return node.url ? '1x1' : '1x1';
}

async function getBookmarksBarRootId(): Promise<string | null> {
  if (!hasBookmarksApi()) return null;
  try {
    const tree = await chrome.bookmarks.getTree();
    const root = tree[0];

    const byId = root.children?.find((c) => c.id === '1' && !c.url);
    if (byId) return byId.id;

    const titles = new Set([
      'Bookmarks Bar',
      'Bookmarks bar',
      'Bookmarks Toolbar',
      '书签栏',
      '收藏夹栏',
      'Favorites bar',
      '收藏夹',
    ]);
    const byTitle = root.children?.find((c) => !c.url && titles.has(c.title));
    if (byTitle) return byTitle.id;

    const firstFolder = root.children?.find((c) => !c.url);
    return firstFolder?.id || null;
  } catch {
    return null;
  }
}

/**
 * 获取已保存的 TMarks 根文件夹 ID
 */
async function getSavedRootFolderId(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_ROOT_ID);
    const savedId = result[STORAGE_KEY_ROOT_ID];
    return typeof savedId === 'string' ? savedId : null;
  } catch {
    return null;
  }
}

/**
 * 保存 TMarks 根文件夹 ID
 */
async function saveRootFolderId(id: string): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY_ROOT_ID]: id });
  } catch {
    // ignore
  }
}

/**
 * 检查书签文件夹是否存在（通过 ID）
 */
async function checkFolderExists(folderId: string): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
  try {
    const nodes = await chrome.bookmarks.get(folderId);
    const node = nodes?.[0];
    // 确保是文件夹（没有 url）
    if (node && !node.url) {
      return node;
    }
    return null;
  } catch {
    return null;
  }
}

interface EnsureRootFolderResult {
  id: string;
  wasRecreated: boolean;
  previousTitle?: string;
}

/**
 * 确保 TMarks 根文件夹存在
 * - 优先通过已保存的 ID 查找（即使被改名也能识别）
 * - 如果 ID 对应的文件夹被删除，则重新创建并返回 wasRecreated = true
 * - 如果是首次使用，尝试查找名为 TMarks 的文件夹，否则创建新的
 */
async function ensureRootFolder(): Promise<EnsureRootFolderResult | null> {
  if (!hasBookmarksApi()) return null;

  const barId = await getBookmarksBarRootId();
  if (!barId) return null;

  // 1. 尝试通过已保存的 ID 查找
  const savedId = await getSavedRootFolderId();
  if (savedId) {
    const existingNode = await checkFolderExists(savedId);
    if (existingNode) {
      // 文件夹存在（即使被改名了也能通过 ID 找到）
      return { id: savedId, wasRecreated: false };
    }
    // 文件夹被删除了，需要重新创建
    console.log('[TMarks] 根文件夹被删除，正在重新创建...');
  }

  // 2. 如果没有保存的 ID 或文件夹被删除，尝试按名称查找（兼容旧版本）
  const children = await chrome.bookmarks.getChildren(barId);
  const existingByName = children.find((c) => !c.url && c.title === ROOT_TITLE);
  if (existingByName) {
    // 找到了名为 TMarks 的文件夹，保存其 ID
    await saveRootFolderId(existingByName.id);
    return { id: existingByName.id, wasRecreated: false };
  }

  // 3. 创建新的根文件夹
  const created = await chrome.bookmarks.create({
    parentId: barId,
    title: ROOT_TITLE,
  });
  await saveRootFolderId(created.id);

  // 判断是首次创建还是重建
  const wasRecreated = savedId !== null;
  if (wasRecreated) {
    console.log('[TMarks] 根文件夹已重新创建，ID:', created.id);
  } else {
    console.log('[TMarks] 根文件夹已创建，ID:', created.id);
  }

  return { id: created.id, wasRecreated };
}

function toGridItems(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  opts: { groupId: string; parentGridId: string | null }
): GridItem[] {
  const items: GridItem[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (isFolder(node)) {
      const folderItem: GridItem = {
        id: `bb-${node.id}`,
        type: 'bookmarkFolder',
        size: defaultSizeFor(node),
        position: i,
        groupId: opts.groupId,
        parentId: opts.parentGridId === null ? null : opts.parentGridId ?? undefined,
        browserBookmarkId: node.id,
        bookmarkFolder: { title: node.title },
        createdAt: Date.now(),
      };

      items.push(folderItem);

      const children = node.children || [];
      items.push(
        ...toGridItems(children, {
          groupId: opts.groupId,
          parentGridId: folderItem.id,
        })
      );

      continue;
    }

    const urlItem: GridItem = {
      id: `bb-${node.id}`,
      type: 'shortcut',
      size: '1x1',
      position: i,
      groupId: opts.groupId,
      parentId: opts.parentGridId === null ? null : opts.parentGridId ?? undefined,
      browserBookmarkId: node.id,
      shortcut: {
        url: node.url || '',
        title: node.title || node.url || '',
      },
      createdAt: Date.now(),
    };

    items.push(urlItem);
  }

  return items;
}

/**
 * 自动发现 TMarks 根文件夹下的一级文件夹，并为其创建对应的分组
 * 这样 AI 整理后的书签文件夹可以自动显示在 NewTab 中
 * 
 * 改进点：
 * 1. 创建分组后立即关联书签文件夹ID
 * 2. 为已存在但未关联的分组补充关联
 * 3. 移除防抖机制，确保每次刷新都能发现新分组
 * 4. 每次循环都重新获取最新的分组状态
 */
async function autoDiscoverAndCreateGroups(
  rootId: string,
  addGroup: (
    name: string,
    icon: string,
    options?: { bookmarkFolderId?: string | null; skipBookmarkFolderCreation?: boolean }
  ) => void,
  setGroupBookmarkFolderId: (groupId: string, folderId: string | null) => void
): Promise<void> {
  try {
    const rootChildren = await chrome.bookmarks.getChildren(rootId);
    const folders = rootChildren.filter(c => !c.url);
    
    console.log(`[TMarks] 发现 ${folders.length} 个一级文件夹`);
    
    const HOME_FOLDER_TITLE = 'NewTab Home';
    const EXCLUDED_FOLDERS = new Set([HOME_FOLDER_TITLE]);
    
    for (const folder of folders) {
      // 跳过特殊文件夹
      if (EXCLUDED_FOLDERS.has(folder.title)) {
        console.log(`[TMarks] 跳过特殊文件夹: ${folder.title}`);
        continue;
      }
      
      // 每次都获取最新的分组状态
      const currentGroups = useNewtabStore.getState().shortcutGroups;

      const matchedById = currentGroups.find((g) => g.bookmarkFolderId === folder.id);
      if (matchedById) {
        // 已存在绑定该文件夹的分组
        continue;
      }
      
      // 检查分组是否已存在（按名称匹配）
      const existingGroup = currentGroups.find(g => g.name === folder.title);

      if (!existingGroup) {
        // 分组不存在，创建新分组
        console.log(`[TMarks] 自动创建分组: ${folder.title}`);
        addGroup(folder.title, 'Folder', {
          bookmarkFolderId: folder.id,
          skipBookmarkFolderCreation: true,
        });
      } else if (!existingGroup.bookmarkFolderId) {
        // 分组存在但未关联文件夹ID，补充关联
        console.log(`[TMarks] 补充关联分组 "${folder.title}" 到文件夹ID: ${folder.id}`);
        setGroupBookmarkFolderId(existingGroup.id, folder.id);
      } else {
        console.log(`[TMarks] 分组已存在且已关联: ${folder.title}`);
      }
    }
    
    const finalGroups = useNewtabStore.getState().shortcutGroups;
    console.log(`[TMarks] 分组发现完成，当前共 ${finalGroups.length} 个分组:`, finalGroups.map(g => g.name));
  } catch (error) {
    console.error('[TMarks] 自动发现分组失败:', error);
  }
}

export function useBrowserBookmarksSync() {
  const {
    isLoading,
    ensureGroupBookmarkFolderId,
    removeGroup,
    setBrowserBookmarksRootId,
    setHomeBrowserFolderId,
    setIsApplyingBrowserBookmarks,
    replaceBrowserBookmarkGridItems,
    upsertBrowserBookmarkNode,
    removeBrowserBookmarkById,
    applyBrowserBookmarkChildrenOrder,
  } = useNewtabStore();

  const refreshInFlight = useRef(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!hasBookmarksApi() || !chrome.bookmarks?.onCreated) {
      return;
    }

    let disposed = false;

    const isInScopeParent = (parentId?: string) => {
      const state = useNewtabStore.getState();
      const rootId = state.browserBookmarksRootId;
      const homeId = state.homeBrowserFolderId;
      if (!rootId || !parentId) return false;
      if (parentId === rootId) return true;
      if (homeId && parentId === homeId) return true;
      const byGroup = state.shortcutGroups.find((g) => g.bookmarkFolderId === parentId);
      if (byGroup) return true;
      return state.gridItems.some((i) => i.browserBookmarkId === parentId && i.type === 'bookmarkFolder');
    };

    const refreshChildrenOrder = async (parentBookmarkId: string) => {
      try {
        const children = await chrome.bookmarks.getChildren(parentBookmarkId);
        const ordered = children.map((c) => c.id);
        setIsApplyingBrowserBookmarks(true);
        applyBrowserBookmarkChildrenOrder(parentBookmarkId, ordered);
      } catch {
        // ignore
      } finally {
        setIsApplyingBrowserBookmarks(false);
      }
    };

    const cleanupGroupsWithoutExistingFolders = async (rootId: string) => {
      try {
        const state = useNewtabStore.getState();
        const latestGroups = state.shortcutGroups.filter(
          (group) => group.id !== 'home' && !!group.bookmarkFolderId
        );
        if (!latestGroups.length) {
          return;
        }

        const children = await chrome.bookmarks.getChildren(rootId);
        const folderTitles = new Set(children.filter((c) => !c.url).map((c) => c.title));

        const staleGroupIds: string[] = [];
        for (const group of latestGroups) {
          const ensuredId = await ensureGroupBookmarkFolderId(group.id);
          if (ensuredId) continue;
          if (!folderTitles.has(group.name)) {
            staleGroupIds.push(group.id);
          }
        }

        if (staleGroupIds.length) {
          console.log('[TMarks] 移除失效分组:', staleGroupIds);
          staleGroupIds.forEach((id) =>
            removeGroup(id, { skipBrowserBookmarkDeletion: true })
          );
        }
      } catch (error) {
        console.warn('[TMarks] 清理失效分组失败:', error);
      }
    };

    const purgeBrowserLinkedGridItems = () => {
      const snapshot = useNewtabStore.getState();
      const filtered = snapshot.gridItems.filter((item) => !item.browserBookmarkId);
      const nextCurrentFolderId =
        snapshot.currentFolderId && filtered.some((item) => item.id === snapshot.currentFolderId)
          ? snapshot.currentFolderId
          : null;

      useNewtabStore.setState({
        gridItems: filtered,
        currentFolderId: nextCurrentFolderId,
      });
      snapshot.saveData();
    };

    const resetBrowserLinkedState = () => {
      const snapshot = useNewtabStore.getState();
      const removableGroupIds = snapshot.shortcutGroups
        .filter((group) => group.id !== 'home')
        .map((group) => group.id);
      removableGroupIds.forEach((groupId) => {
        removeGroup(groupId, { skipBrowserBookmarkDeletion: true });
      });

      purgeBrowserLinkedGridItems();
      setBrowserBookmarksRootId(null);
      setHomeBrowserFolderId(null);
    };

    const handleRootFolderRemoved = async () => {
      resetBrowserLinkedState();
      await refreshFromBrowser();
    };

    const refreshFromBrowser = async () => {
      if (refreshInFlight.current) return;
      refreshInFlight.current = true;

      try {
        const result = await ensureRootFolder();
        if (!result) return;
        if (disposed) return;

        const { id: rootId, wasRecreated } = result;

        if (wasRecreated) {
          resetBrowserLinkedState();
        }

        setBrowserBookmarksRootId(rootId);

        const homeFolder = await ensureHomeFolder(rootId);
        if (homeFolder) {
          setHomeBrowserFolderId(homeFolder.id);
        }

        // 自动发现并创建分组（在同步之前）
        const currentState = useNewtabStore.getState();
        await autoDiscoverAndCreateGroups(
          rootId,
          currentState.addGroup,
          currentState.setGroupBookmarkFolderId
        );
        await cleanupGroupsWithoutExistingFolders(rootId);

        // 如果文件夹是重建的，发送通知给 UI
        if (wasRecreated) {
          try {
            // 发送消息通知 UI 显示提示
            window.dispatchEvent(new CustomEvent('tmarks-folder-recreated', {
              detail: { message: 'TMarks 书签文件夹已被删除，已为您重新创建。之前保存的书签数据可能已丢失。' }
            }));
          } catch {
            // ignore
          }
        }

        const state = useNewtabStore.getState();
        const configuredGroups = [
          'home',
          ...state.shortcutGroups.filter((g) => g.id !== 'home').map((g) => g.id),
        ];

        const collected: GridItem[] = [];
        const refreshedGroups: string[] = [];

        for (const groupId of configuredGroups) {
          let folderId: string | null = null;

          if (groupId === 'home') {
            folderId = homeFolder?.id ?? state.homeBrowserFolderId ?? null;
            if (!folderId) {
              folderId = await ensureGroupBookmarkFolderId(groupId);
            }
          } else {
            folderId = await ensureGroupBookmarkFolderId(groupId);
          }

          if (!folderId) continue;

          refreshedGroups.push(groupId);

          try {
            const subTree = await chrome.bookmarks.getSubTree(folderId);
            const node = subTree?.[0];
            if (!node) continue;
            const children = node.children || [];
            collected.push(
              ...toGridItems(children, {
                groupId,
                parentGridId: null,
              })
            );
          } catch {
            // ignore missing folders
          }
        }

        setIsApplyingBrowserBookmarks(true);
        replaceBrowserBookmarkGridItems(collected, {
          groupIds: refreshedGroups,
        });
      } catch (e) {
        // silent
      } finally {
        setIsApplyingBrowserBookmarks(false);
        refreshInFlight.current = false;
      }
    };

    refreshFromBrowser();

    const handleCreated = (id: string, node: chrome.bookmarks.BookmarkTreeNode) => {
      const now = Date.now();
      if (now < useNewtabStore.getState().browserBookmarkWriteLockUntil) return;

      if (!isInScopeParent((node as any).parentId)) return;

      setIsApplyingBrowserBookmarks(true);
      try {
        upsertBrowserBookmarkNode({
          id,
          parentId: (node as any).parentId,
          title: node.title,
          url: node.url,
          index: (node as any).index,
        });
      } finally {
        setIsApplyingBrowserBookmarks(false);
      }

      const parentId = (node as any).parentId as string | undefined;
      if (parentId) {
        refreshChildrenOrder(parentId);
      }
    };

    const handleChanged = async (id: string, changeInfo: { title?: string; url?: string }) => {
      const now = Date.now();
      if (now < useNewtabStore.getState().browserBookmarkWriteLockUntil) return;

      try {
        const nodes = await chrome.bookmarks.get(id);
        const node = nodes?.[0];
        if (!node) return;
        if (!isInScopeParent((node as any).parentId)) return;

        setIsApplyingBrowserBookmarks(true);
        upsertBrowserBookmarkNode({
          id,
          parentId: (node as any).parentId,
          title: changeInfo.title ?? node.title,
          url: changeInfo.url ?? node.url,
          index: (node as any).index,
        });
      } catch {
        // ignore
      } finally {
        setIsApplyingBrowserBookmarks(false);
      }
    };

    const handleRemoved = (
      id: string,
      removeInfo: { parentId: string; index: number; node?: chrome.bookmarks.BookmarkTreeNode }
    ) => {
      const now = Date.now();
      if (now < useNewtabStore.getState().browserBookmarkWriteLockUntil) return;

      const stateBeforeRemoval = useNewtabStore.getState();
      const browserRootId = stateBeforeRemoval.browserBookmarksRootId;
      if (browserRootId && id === browserRootId) {
        void handleRootFolderRemoved();
        return;
      }

      if (!isInScopeParent(removeInfo?.parentId)) return;

      if (!isInScopeParent(removeInfo?.parentId)) return;

      const matchingGroup = stateBeforeRemoval.shortcutGroups.find((g) => g.bookmarkFolderId === id);
      if (
        matchingGroup &&
        matchingGroup.id !== 'home' &&
        browserRootId &&
        removeInfo?.parentId === browserRootId
      ) {
        removeGroup(matchingGroup.id, { skipBrowserBookmarkDeletion: true });
      }

      setIsApplyingBrowserBookmarks(true);
      try {
        removeBrowserBookmarkById(id);
      } finally {
        setIsApplyingBrowserBookmarks(false);
      }

      if (removeInfo?.parentId) {
        refreshChildrenOrder(removeInfo.parentId);
      }
    };

    const handleMoved = (id: string, moveInfo: { parentId: string; oldParentId: string; index: number; oldIndex: number }) => {
      const now = Date.now();
      if (now < useNewtabStore.getState().browserBookmarkWriteLockUntil) return;

      const inNew = isInScopeParent(moveInfo?.parentId);
      const inOld = isInScopeParent(moveInfo?.oldParentId);
      if (!inNew && !inOld) return;

      (async () => {
        if (inOld && !inNew) {
          setIsApplyingBrowserBookmarks(true);
          try {
            removeBrowserBookmarkById(id);
          } finally {
            setIsApplyingBrowserBookmarks(false);
          }

          if (moveInfo.oldParentId) {
            await refreshChildrenOrder(moveInfo.oldParentId);
          }
          return;
        }

        try {
          const nodes = await chrome.bookmarks.get(id);
          const node = nodes?.[0];
          if (node && inNew) {
            setIsApplyingBrowserBookmarks(true);
            try {
              upsertBrowserBookmarkNode({
                id,
                parentId: moveInfo.parentId,
                title: node.title,
                url: node.url,
                index: moveInfo.index,
              });
            } finally {
              setIsApplyingBrowserBookmarks(false);
            }
          }
        } catch {
          // ignore
        }

        if (inOld && moveInfo.oldParentId) {
          await refreshChildrenOrder(moveInfo.oldParentId);
        }
        if (inNew && moveInfo.parentId) {
          await refreshChildrenOrder(moveInfo.parentId);
        }
      })();
    };

    const handleChildrenReordered = (id: string) => {
      const now = Date.now();
      if (now < useNewtabStore.getState().browserBookmarkWriteLockUntil) return;

      if (!isInScopeParent(id)) return;
      refreshChildrenOrder(id);
    };

    chrome.bookmarks.onCreated.addListener(handleCreated);
    chrome.bookmarks.onRemoved.addListener(handleRemoved);
    chrome.bookmarks.onChanged.addListener(handleChanged);
    chrome.bookmarks.onMoved.addListener(handleMoved);
    chrome.bookmarks.onChildrenReordered.addListener(handleChildrenReordered);

    return () => {
      disposed = true;
      chrome.bookmarks.onCreated.removeListener(handleCreated);
      chrome.bookmarks.onRemoved.removeListener(handleRemoved);
      chrome.bookmarks.onChanged.removeListener(handleChanged);
      chrome.bookmarks.onMoved.removeListener(handleMoved);
      chrome.bookmarks.onChildrenReordered.removeListener(handleChildrenReordered);
    };
  }, [isLoading]);
}
