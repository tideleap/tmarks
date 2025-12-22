/**
 * 浏览器书签同步工具函数
 */

import type { GridItem, GridItemSize } from '../../types';

export const ROOT_TITLE = 'TMarks';
export const STORAGE_KEY_ROOT_ID = 'tmarks_root_bookmark_id';

export function hasBookmarksApi(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.bookmarks;
}

export function isFolder(node: chrome.bookmarks.BookmarkTreeNode) {
  return !node.url;
}

export function defaultSizeFor(node: chrome.bookmarks.BookmarkTreeNode): GridItemSize {
  return node.url ? '1x1' : '1x1';
}

export async function getBookmarksBarRootId(): Promise<string | null> {
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
export async function getSavedRootFolderId(): Promise<string | null> {
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
export async function saveRootFolderId(id: string): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY_ROOT_ID]: id });
  } catch {
    // ignore
  }
}

/**
 * 检查书签文件夹是否存在（通过 ID）
 */
export async function checkFolderExists(folderId: string): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
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

export interface EnsureRootFolderResult {
  id: string;
  wasRecreated: boolean;
  previousTitle?: string;
}

/**
 * 确保 TMarks 根文件夹存在
 */
export async function ensureRootFolder(): Promise<EnsureRootFolderResult | null> {
  if (!hasBookmarksApi()) return null;

  const barId = await getBookmarksBarRootId();
  if (!barId) return null;

  // 1. 尝试通过已保存的 ID 查找
  const savedId = await getSavedRootFolderId();
  if (savedId) {
    const existingNode = await checkFolderExists(savedId);
    if (existingNode) {
      return { id: savedId, wasRecreated: false };
    }
    console.log('[TMarks] 根文件夹被删除，正在重新创建...');
  }

  // 2. 按名称查找（兼容旧版本）
  const children = await chrome.bookmarks.getChildren(barId);
  const existingByName = children.find((c) => !c.url && c.title === ROOT_TITLE);
  if (existingByName) {
    await saveRootFolderId(existingByName.id);
    return { id: existingByName.id, wasRecreated: false };
  }

  // 3. 创建新的根文件夹
  const created = await chrome.bookmarks.create({
    parentId: barId,
    title: ROOT_TITLE,
  });
  await saveRootFolderId(created.id);

  const wasRecreated = savedId !== null;
  if (wasRecreated) {
    console.log('[TMarks] 根文件夹已重新创建，ID:', created.id);
  } else {
    console.log('[TMarks] 根文件夹已创建，ID:', created.id);
  }

  return { id: created.id, wasRecreated };
}

/**
 * 将书签节点转换为 GridItem
 */
export function toGridItems(
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
