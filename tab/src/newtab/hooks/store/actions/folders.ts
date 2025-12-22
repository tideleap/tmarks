/**
 * 文件夹相关 Actions
 */

import type { Shortcut, ShortcutGroup, ShortcutFolder, NewTabSettings, GridItem } from '../../../types';
import { generateId } from '../utils';
import { debouncedSync } from '../sync';

export interface FolderActions {
  addFolder: (name: string, groupId?: string) => string;
  updateFolder: (id: string, updates: Partial<ShortcutFolder>) => void;
  removeFolder: (id: string) => void;
  getFolderShortcuts: (folderId: string) => Shortcut[];
  moveShortcutToFolder: (shortcutId: string, folderId: string | undefined) => void;
}

export function createFolderActions(
  get: () => {
    shortcuts: Shortcut[];
    shortcutGroups: ShortcutGroup[];
    shortcutFolders: ShortcutFolder[];
    settings: NewTabSettings;
    gridItems: GridItem[];
    activeGroupId: string | null;
    saveData: () => Promise<void>;
  },
  set: (state: Partial<{ shortcuts: Shortcut[]; shortcutFolders: ShortcutFolder[] }>) => void
): FolderActions {
  return {
    addFolder: (name, groupId) => {
      const { shortcuts, shortcutGroups, shortcutFolders, activeGroupId, settings, gridItems, saveData } =
        get();
      const newFolder: ShortcutFolder = {
        id: generateId(),
        name,
        position: shortcutFolders.length,
        groupId: groupId ?? activeGroupId ?? undefined,
        createdAt: Date.now(),
      };
      const newFolders = [...shortcutFolders, newFolder];
      set({ shortcutFolders: newFolders });
      saveData();
      debouncedSync({
        shortcuts,
        groups: shortcutGroups,
        folders: newFolders,
        settings,
        gridItems,
      });
      return newFolder.id;
    },

    updateFolder: (id, updates) => {
      const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
      const newFolders = shortcutFolders.map((f) => (f.id === id ? { ...f, ...updates } : f));
      set({ shortcutFolders: newFolders });
      saveData();
      debouncedSync({
        shortcuts,
        groups: shortcutGroups,
        folders: newFolders,
        settings,
        gridItems,
      });
    },

    removeFolder: (id) => {
      const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
      const updatedShortcuts = shortcuts.map((s) =>
        s.folderId === id ? { ...s, folderId: undefined } : s
      );
      const filtered = shortcutFolders.filter((f) => f.id !== id);
      set({ shortcutFolders: filtered, shortcuts: updatedShortcuts });
      saveData();
      debouncedSync({
        shortcuts: updatedShortcuts,
        groups: shortcutGroups,
        folders: filtered,
        settings,
        gridItems,
      });
    },

    getFolderShortcuts: (folderId) => {
      const { shortcuts } = get();
      return shortcuts.filter((s) => s.folderId === folderId);
    },

    moveShortcutToFolder: (shortcutId, folderId) => {
      const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
      const newShortcuts = shortcuts.map((s) =>
        s.id === shortcutId ? { ...s, folderId } : s
      );
      set({ shortcuts: newShortcuts });
      saveData();
      debouncedSync({
        shortcuts: newShortcuts,
        groups: shortcutGroups,
        folders: shortcutFolders,
        settings,
        gridItems,
      });
    },
  };
}
