/**
 * NewTab 文件夹相关处理器
 */

import type { Message, MessageResponse } from '@/types';
import { ensureNewtabRootFolder } from '../services/newtab-folder';
import { importAllBookmarksToNewtab } from '../services/bookmark-collector';

/**
 * 保存到 NewTab
 */
export async function handleSaveToNewtab(message: Message): Promise<MessageResponse> {
  const payload = message.payload as {
    url: string;
    title?: string;
    parentBookmarkId?: string;
  };
  const url = payload?.url;
  const title = payload?.title || payload?.url || 'Untitled';
  if (!url) {
    throw new Error('Missing url');
  }

  const rootResult = await ensureNewtabRootFolder();
  if (!rootResult) {
    throw new Error('NewTab root folder not found');
  }
  const rootId = rootResult.id;

  const parentId = payload.parentBookmarkId || rootId;

  const created = await chrome.bookmarks.create({ parentId, title, url });
  return {
    success: true,
    data: { id: created.id },
  };
}

/**
 * 导入所有书签到 NewTab
 */
export async function handleImportAllBookmarksToNewtab(): Promise<MessageResponse> {
  const newtabRootResult = await ensureNewtabRootFolder();
  if (!newtabRootResult) {
    throw new Error('NewTab root folder not found');
  }
  const newtabRootId = newtabRootResult.id;

  const importInfo = await importAllBookmarksToNewtab(newtabRootId);

  return {
    success: true,
    data: {
      importFolderId: importInfo.importFolderId,
      folderTitle: importInfo.folderTitle,
      counts: importInfo.counts,
    },
  };
}

/**
 * 获取 NewTab 文件夹列表
 */
export async function handleGetNewtabFolders(): Promise<MessageResponse> {
  const rootResult = await ensureNewtabRootFolder();
  if (!rootResult) {
    throw new Error('NewTab root folder not found');
  }
  const rootId = rootResult.id;

  const rootFolder = (await chrome.bookmarks.get(rootId))?.[0];
  if (!rootFolder) {
    throw new Error('NewTab root folder not found');
  }

  type FolderNode = {
    id: string;
    title: string;
    parentId: string | null;
    path: string;
  };
  const folders: FolderNode[] = [];

  const queue: Array<{
    node: chrome.bookmarks.BookmarkTreeNode;
    parentId: string | null;
    pathPrefix: string;
  }> = [{ node: rootFolder, parentId: null, pathPrefix: '' }];

  while (queue.length > 0 && folders.length < 200) {
    const { node, parentId, pathPrefix } = queue.shift()!;

    const currentPath = pathPrefix ? `${pathPrefix}/${node.title}` : node.title;
    folders.push({ id: node.id, title: node.title, parentId, path: currentPath });

    const children = await chrome.bookmarks.getChildren(node.id);
    const childFolders = children.filter((c) => !c.url);
    for (const child of childFolders) {
      if (folders.length + queue.length >= 200) break;
      queue.push({ node: child, parentId: node.id, pathPrefix: currentPath });
    }
  }

  return {
    success: true,
    data: { rootId: rootFolder.id, folders },
  };
}
