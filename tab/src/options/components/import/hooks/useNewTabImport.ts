/**
 * NewTab 导入处理 Hook
 */

import { t } from '@/lib/i18n'
import type { EditableBookmark } from '../EditableBookmarkTable'

export function useNewTabImport() {
  const handleFinalImport = async (
    bookmarksToImport: EditableBookmark[],
    options: any,
    setIsImporting: (val: boolean) => void,
    setSuccessMessage: (msg: string) => void,
    setError: (msg: string) => void,
    goToNextStep: () => void,
    completeCurrentStep: (data: any) => void
  ) => {
    setIsImporting(true)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'IMPORT_URLS_TO_NEWTAB',
        payload: {
          bookmarks: bookmarksToImport
            .filter(b => b.isSelected && !b.isSkipped)
            .filter(b => b.url && b.url.trim() && b.title && b.title.trim()), // 过滤掉空 URL 或空标题
          options
        }
      })

      if (response?.success) {
        const result = response.data
        
        let message = t('import_newtab_success', String(result.importedCount || bookmarksToImport.length))
        
        if (result.syncStatus) {
          if (result.syncStatus.synced) {
            message += '\n✅ 已同步到云端'
          } else if (result.syncStatus.error) {
            message += `\n⚠️ 云端同步失败: ${result.syncStatus.error}`
          }
        }
        
        setSuccessMessage(message)
        completeCurrentStep({ bookmarks: bookmarksToImport, result })
        goToNextStep()
      } else {
        throw new Error(response?.error || t('import_newtab_failed'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('import_newtab_failed'))
    } finally {
      setIsImporting(false)
    }
  }

  return { handleFinalImport }
}
