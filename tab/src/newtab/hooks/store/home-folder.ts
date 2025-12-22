/**
 * 首页文件夹管理
 */

import { hasBookmarksApi } from './utils';

export const HOME_FOLDER_TITLE = 'NewTab Home';
export const STORAGE_KEY_HOME_FOLDER_ID = 'tmarks_home_bookmark_id';

let writableRootBookmarkIdPromise: Promise<string | null> | null = null;

export async function getSavedHomeFolderId(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_HOME_FOLDER_ID);
    const savedId = result[STORAGE_KEY_HOME_FOLDER_ID];
    return typeof savedId === 'string' ? savedId : null;
  } catch {
    return null;
  }
}

export async function saveHomeFolderId(id: string): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY_HOME_FOLDER_ID]: id });
  } catch {
    // ignore
  }
}

export async function getWritableRootBookmarkId(
  browserBookmarksRootId: string | null
): Promise<string | null> {
  if (!browserBookmarksRootId) return null;
  if (browserBookmarksRootId !== '0') return browserBookmarksRootId;

  if (writableRootBookmarkIdPromise) {
    return writableRootBookmarkIdPromise;
  }

  writableRootBookmarkIdPromise = (async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.bookmarks) return null;

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
  })();

  return writableRootBookmarkIdPromise;
}

export async function ensureHomeFolder(
  rootId: string | null
): Promise<{ id: string; wasRecreated: boolean } | null> {
  if (!hasBookmarksApi() || !rootId) {
    console.log('[TMarks] ensureHomeFolder: 无效的 rootId 或无书签 API');
    return null;
  }

  const savedId = await getSavedHomeFolderId();
  console.log(`[TMarks] ensureHomeFolder: 已保存的首页文件夹ID: ${savedId}`);

  if (savedId) {
    try {
      const nodes = await chrome.bookmarks.get(savedId);
      const node = nodes?.[0];
      if (node && !node.url) {
        const parentId = (node as any).parentId;
        if (parentId !== rootId) {
          console.log(`[TMarks] ensureHomeFolder: 移动首页文件夹到 TMarks 下`);
          await chrome.bookmarks.move(node.id, { parentId: rootId });
        }
        await saveHomeFolderId(node.id);
        console.log(`[TMarks] ensureHomeFolder: 使用已存在的首页文件夹 ID: ${node.id}`);
        return { id: node.id, wasRecreated: false };
      }
    } catch {
      console.log('[TMarks] ensureHomeFolder: 保存的ID无效，继续查找或创建');
    }
  }

  try {
    const children = await chrome.bookmarks.getChildren(rootId);
    const existing = children.find((c) => !c.url && c.title === HOME_FOLDER_TITLE);
    if (existing) {
      await saveHomeFolderId(existing.id);
      console.log(`[TMarks] ensureHomeFolder: 找到已存在的首页文件夹 ID: ${existing.id}`);
      return { id: existing.id, wasRecreated: false };
    }

    console.log('[TMarks] ensureHomeFolder: 创建新的首页文件夹');
    const created = await chrome.bookmarks.create({
      parentId: rootId,
      title: HOME_FOLDER_TITLE,
    });
    await saveHomeFolderId(created.id);
    console.log(`[TMarks] ensureHomeFolder: 已创建首页文件夹 ID: ${created.id}`);
    return { id: created.id, wasRecreated: savedId !== null };
  } catch (e) {
    console.error('[TMarks] ensureHomeFolder: 创建首页文件夹失败:', e);
    return null;
  }
}
