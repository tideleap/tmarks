/**
 * Popup 头部组件
 */

interface PopupHeaderProps {
  viewMode: 'bookmark' | 'newtab';
  isAIEnabled: boolean;
  recommendedTagsCount: number;
  selectedTagsCount: number;
  existingTagsCount: number;
  isSaving: boolean;
  canSave: boolean;
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
  onSaveToNewTab: () => void;
}

export function PopupHeader({
  viewMode,
  isAIEnabled,
  recommendedTagsCount,
  selectedTagsCount,
  existingTagsCount,
  isSaving,
  canSave,
  onBack,
  onCancel,
  onSave,
  onSaveToNewTab,
}: PopupHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 px-3 pt-2 pb-2.5 bg-[var(--tab-popup-surface)] border-b border-[var(--tab-popup-border)] shadow-sm rounded-b-2xl">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[var(--tab-popup-text-muted)] transition-all duration-200 hover:bg-[var(--tab-popup-action-neutral-bg)] active:scale-95"
          title="返回"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {viewMode === 'bookmark' && isAIEnabled ? (
          <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[var(--tab-popup-badge-blue-bg)] px-2 py-1 text-[10px] text-[var(--tab-popup-badge-blue-text)] font-medium">
            推荐 {recommendedTagsCount}
          </span>
        ) : viewMode === 'bookmark' ? (
          <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[var(--tab-popup-badge-amber-bg)] px-2 py-1 text-[10px] text-[var(--tab-popup-badge-amber-text)] font-medium">
            AI 关闭
          </span>
        ) : null}
        {viewMode === 'bookmark' && (
          <>
            <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[var(--tab-popup-badge-indigo-bg)] px-2 py-1 text-[10px] text-[var(--tab-popup-badge-indigo-text)] font-medium">
              已选 {selectedTagsCount}
            </span>
            <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[var(--tab-popup-badge-purple-bg)] px-2 py-1 text-[10px] text-[var(--tab-popup-badge-purple-text)] font-medium">
              库 {existingTagsCount}
            </span>
          </>
        )}
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={onCancel}
            className="rounded-lg border border-[var(--tab-popup-border-strong)] bg-[var(--tab-popup-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--tab-popup-text)] transition-all duration-200 hover:bg-[var(--tab-popup-action-neutral-bg)] active:scale-95"
          >
            取消
          </button>
          {viewMode === 'bookmark' ? (
            <button
              onClick={onSave}
              disabled={isSaving || !canSave}
              className="rounded-lg bg-gradient-to-r from-[var(--tab-popup-primary-from)] to-[var(--tab-popup-primary-via)] px-4 py-1.5 text-[11px] font-semibold text-[var(--tab-popup-primary-text)] shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-1">
                  <svg className="h-3.5 w-3.5 animate-spin text-[var(--tab-popup-primary-text)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  保存中
                </span>
              ) : (
                '保存书签'
              )}
            </button>
          ) : (
            <button
              onClick={onSaveToNewTab}
              disabled={isSaving || !canSave}
              className="rounded-lg bg-gradient-to-r from-[var(--tab-popup-primary-from)] to-[var(--tab-popup-primary-via)] px-4 py-1.5 text-[11px] font-semibold text-[var(--tab-popup-primary-text)] shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            >
              保存到 NewTab
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
