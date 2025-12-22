/**
 * 书签操作
 */

import { ensureFolderPath } from '../../services/bookmark-collector';
import { reportAiOrganizeProgress } from '../../services/progress-reporter';

const HOME_FOLDER_TITLE = 'NewTab Home';

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  path: string;
  domain: string;
}

export async function cleanupWorkspace(
  newtabRootId: string,
  sessionId: string
): Promise<number> {
  const rootChildren = await chrome.bookmarks.getChildren(newtabRootId);
  let removedNodes = 0;

  for (const child of rootChildren) {
    if (!child.url && child.title === HOME_FOLDER_TITLE) {
      console.log('[TMarks AI Organize] 保留 NewTab Home 文件夹');
      continue;
    }
    await chrome.bookmarks.removeTree(child.id);
    removedNodes += 1;
  }

  await reportAiOrganizeProgress({
    sessionId,
    level: 'info',
    step: 'cleanup',
    message: `已清空工作区：移除旧目录/书签 ${removedNodes} 个`,
  });

  return removedNodes;
}

export async function createFolderStructure(
  newtabRootId: string,
  domainToItems: Map<string, any[]>,
  domainToPath: Map<string, string>,
  fallbackPath: string,
  sessionId: string
): Promise<{ folderCache: Map<string, string>; createdFolders: number }> {
  const folderCache = new Map<string, string>();
  let createdFolders = 0;
  const folderSet = new Set<string>();

  for (const [domainKey] of domainToItems.entries()) {
    const key = domainKey ? domainKey : '(no-domain)';
    const path = domainToPath.get(key) || fallbackPath;
    if (path) folderSet.add(path);
    if (key === '(no-domain)' && !domainToPath.has(key)) {
      folderSet.add(fallbackPath);
    }
  }

  for (const folderPath of folderSet) {
    const before = folderCache.size;
    await ensureFolderPath(newtabRootId, folderPath, folderCache);
    const after = folderCache.size;
    if (after > before) {
      createdFolders += after - before;
    }
  }

  await reportAiOrganizeProgress({
    sessionId,
    level: 'info',
    step: 'folders',
    message: `目录准备完成：新建目录 ${createdFolders} 个`,
  });

  return { folderCache, createdFolders };
}

export async function copyBookmarks(
  sourceBookmarks: BookmarkItem[],
  newtabRootId: string,
  domainToPath: Map<string, string>,
  fallbackPath: string,
  folderCache: Map<string, string>,
  sessionId: string
): Promise<number> {
  let createdBookmarks = 0;

  for (const b of sourceBookmarks) {
    const domainKey = b.domain || '(no-domain)';
    const folderPath = domainToPath.get(domainKey) || fallbackPath;
    const targetParentId = await ensureFolderPath(newtabRootId, folderPath, folderCache);

    await chrome.bookmarks.create({
      parentId: targetParentId,
      title: b.title || b.url,
      url: b.url,
    });
    createdBookmarks += 1;

    if (createdBookmarks % 100 === 0) {
      await reportAiOrganizeProgress({
        sessionId,
        level: 'info',
        step: 'copy',
        message: `复制书签进度：${createdBookmarks}/${sourceBookmarks.length}`,
      });
    }
  }

  return createdBookmarks;
}
