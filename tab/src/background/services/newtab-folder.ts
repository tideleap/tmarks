/**
 * NewTab 文件夹管理服务
 */

import {
  TMARKS_ROOT_TITLE,
  TMARKS_HOME_TITLE,
  TMARKS_STORAGE_KEY_ROOT_ID,
  TMARKS_STORAGE_KEY_HOME_ID,
} from '../constants';

export interface EnsureNewtabRootFolderResult {
  id: string;
  wasRecreated: boolean;
}

export interface EnsureNewtabHomeFolderResult {
  id: string;
  wasRecreated: boolean;
}

/**
 * 获取书签栏根目录 ID
 */
export async function getBookmarksBarRootId(): Promise<string | null> {
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
 * 读取已保存的 TMarks 根文件夹 ID
 */
export async function getSavedNewtabRootFolderId(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(TMARKS_STORAGE_KEY_ROOT_ID);
    const savedId = result[TMARKS_STORAGE_KEY_ROOT_ID];
    return typeof savedId === 'string' ? savedId : null;
  } catch {
    return null;
  }
}

/**
 * 保存 TMarks 根文件夹 ID
 */
export async function saveNewtabRootFolderId(id: string): Promise<void> {
  try {
    await chrome.storage.local.set({ [TMARKS_STORAGE_KEY_ROOT_ID]: id });
  } catch {
    // ignore
  }
}

/**
 * 读取已保存的首页文件夹 ID
 */
export async function getSavedNewtabHomeFolderId(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(TMARKS_STORAGE_KEY_HOME_ID);
    const savedId = result[TMARKS_STORAGE_KEY_HOME_ID];
    return typeof savedId === 'string' ? savedId : null;
  } catch {
    return null;
  }
}

/**
 * 保存首页文件夹 ID
 */
export async function saveNewtabHomeFolderId(id: string): Promise<void> {
  try {
    await chrome.storage.local.set({ [TMARKS_STORAGE_KEY_HOME_ID]: id });
  } catch {
    // ignore
  }
}

/**
 * 检查书签文件夹是否存在（通过 ID）
 */
export async function checkNewtabFolderExists(
  folderId: string
): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
  try {
    const nodes = await chrome.bookmarks.get(folderId);
    const node = nodes?.[0];
    if (node && !node.url) {
      return node;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 确保 TMarks 根文件夹存在
 */
export async function ensureNewtabRootFolder(): Promise<EnsureNewtabRootFolderResult | null> {
  try {
    const barId = await getBookmarksBarRootId();
    if (!barId) return null;

    const savedId = await getSavedNewtabRootFolderId();
    if (savedId) {
      const existingNode = await checkNewtabFolderExists(savedId);
      if (existingNode) {
        const parentId = (existingNode as any).parentId;
        if (parentId && parentId !== barId) {
          try {
            await chrome.bookmarks.move(savedId, { parentId: barId });
          } catch (error) {
            console.warn('[TMarks Background] 无法移动根文件夹到书签栏:', error);
          }
        }
        return { id: savedId, wasRecreated: false };
      }
      console.log('[TMarks Background] 根文件夹被删除，正在重新创建...');
    }

    const barChildren = await chrome.bookmarks.getChildren(barId);

    const existingByName = barChildren.find((c) => !c.url && c.title === TMARKS_ROOT_TITLE);
    if (existingByName) {
      await saveNewtabRootFolderId(existingByName.id);
      return { id: existingByName.id, wasRecreated: false };
    }

    const OLD_ROOT_TITLE = 'AI 书签助手 NewTab';
    const existingOld = barChildren.find((c) => !c.url && c.title === OLD_ROOT_TITLE);
    if (existingOld) {
      try {
        await chrome.bookmarks.update(existingOld.id, { title: TMARKS_ROOT_TITLE });
      } catch {
        // ignore
      }
      await saveNewtabRootFolderId(existingOld.id);
      return { id: existingOld.id, wasRecreated: false };
    }

    const createdRoot = await chrome.bookmarks.create({ parentId: barId, title: TMARKS_ROOT_TITLE });
    await saveNewtabRootFolderId(createdRoot.id);

    const wasRecreated = savedId !== null;
    if (wasRecreated) {
      console.log('[TMarks Background] 根文件夹已重新创建，ID:', createdRoot.id);
    } else {
      console.log('[TMarks Background] 根文件夹已创建，ID:', createdRoot.id);
    }

    return { id: createdRoot.id, wasRecreated };
  } catch {
    return null;
  }
}

/**
 * 确保 TMarks 首页文件夹存在
 */
export async function ensureNewtabHomeFolder(
  rootId: string
): Promise<EnsureNewtabHomeFolderResult | null> {
  if (!rootId) return null;

  const savedId = await getSavedNewtabHomeFolderId();
  if (savedId) {
    try {
      const nodes = await chrome.bookmarks.get(savedId);
      const node = nodes?.[0];
      if (node && !node.url) {
        const parentId = (node as any).parentId;
        if (parentId !== rootId) {
          try {
            await chrome.bookmarks.move(savedId, { parentId: rootId });
          } catch (error) {
            console.warn('[TMarks Background] 无法移动首页文件夹到根目录:', error);
          }
        }
        await saveNewtabHomeFolderId(node.id);
        return { id: node.id, wasRecreated: false };
      }
    } catch {
      console.log('[TMarks Background] 保存的首页文件夹 ID 无效，重新查找/创建');
    }
  }

  try {
    const children = await chrome.bookmarks.getChildren(rootId);
    const existing = children.find((c) => !c.url && c.title === TMARKS_HOME_TITLE);
    if (existing) {
      await saveNewtabHomeFolderId(existing.id);
      return { id: existing.id, wasRecreated: false };
    }

    const created = await chrome.bookmarks.create({
      parentId: rootId,
      title: TMARKS_HOME_TITLE,
    });
    await saveNewtabHomeFolderId(created.id);
    return { id: created.id, wasRecreated: savedId !== null };
  } catch (error) {
    console.error('[TMarks Background] 创建首页文件夹失败:', error);
    return null;
  }
}

/**
 * 确保工作区文件夹存在
 */
export async function ensureNewtabWorkspaceFolders(): Promise<{
  rootId: string;
  homeId: string | null;
} | null> {
  const rootResult = await ensureNewtabRootFolder();
  if (!rootResult) return null;
  const homeResult = await ensureNewtabHomeFolder(rootResult.id);
  return {
    rootId: rootResult.id,
    homeId: homeResult?.id ?? null,
  };
}

/**
 * 处理书签节点删除事件
 */
export async function handleBookmarkNodeRemoved(removedId: string) {
  try {
    const [savedRootId, savedHomeId] = await Promise.all([
      getSavedNewtabRootFolderId(),
      getSavedNewtabHomeFolderId(),
    ]);

    if (removedId && savedRootId && removedId === savedRootId) {
      await ensureNewtabWorkspaceFolders();
      return;
    }

    if (removedId && savedHomeId && removedId === savedHomeId) {
      const rootResult = await ensureNewtabRootFolder();
      if (rootResult) {
        await ensureNewtabHomeFolder(rootResult.id);
      }
    }
  } catch (error) {
    console.error('[TMarks Background] 处理书签删除事件失败:', error);
  }
}

/**
 * 处理书签节点移动事件
 */
export async function handleBookmarkNodeMoved(id: string) {
  try {
    const [savedRootId, savedHomeId] = await Promise.all([
      getSavedNewtabRootFolderId(),
      getSavedNewtabHomeFolderId(),
    ]);

    if (savedRootId && id === savedRootId) {
      await ensureNewtabRootFolder();
      return;
    }

    if (savedHomeId && id === savedHomeId) {
      const rootResult = await ensureNewtabRootFolder();
      if (rootResult) {
        await ensureNewtabHomeFolder(rootResult.id);
      }
    }
  } catch (error) {
    console.error('[TMarks Background] 处理书签移动事件失败:', error);
  }
}
