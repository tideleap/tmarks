/**
 * 自动发现并创建分组
 */

import { useNewtabStore } from '../useNewtabStore';

const HOME_FOLDER_TITLE = 'NewTab Home';
const EXCLUDED_FOLDERS = new Set([HOME_FOLDER_TITLE]);

/**
 * 自动发现 TMarks 根文件夹下的一级文件夹，并为其创建对应的分组
 */
export async function autoDiscoverAndCreateGroups(
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
        continue;
      }
      
      // 检查分组是否已存在（按名称匹配）
      const existingGroup = currentGroups.find(g => g.name === folder.title);

      if (!existingGroup) {
        console.log(`[TMarks] 自动创建分组: ${folder.title}`);
        addGroup(folder.title, 'Folder', {
          bookmarkFolderId: folder.id,
          skipBookmarkFolderCreation: true,
        });
      } else if (!existingGroup.bookmarkFolderId) {
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
