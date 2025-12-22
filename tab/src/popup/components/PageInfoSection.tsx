/**
 * 页面信息编辑区域
 */

import { useState } from 'react';
import { PageInfoCard } from '@/components/PageInfoCard';
import type { PageInfo } from '@/types';

interface PageInfoSectionProps {
  currentPage: PageInfo;
  includeThumbnail: boolean;
  isPublic: boolean;
  createSnapshot: boolean;
  onToggleThumbnail: () => void;
  onTogglePublic: () => void;
  onToggleSnapshot: () => void;
  onUpdatePage: (page: PageInfo) => void;
}

export function PageInfoSection({
  currentPage,
  includeThumbnail,
  isPublic,
  createSnapshot,
  onToggleThumbnail,
  onTogglePublic,
  onToggleSnapshot,
  onUpdatePage,
}: PageInfoSectionProps) {
  const [showTitleEdit, setShowTitleEdit] = useState(false);
  const [showDescEdit, setShowDescEdit] = useState(false);
  const [titleOverride, setTitleOverride] = useState(currentPage.title ?? '');
  const [descriptionOverride, setDescriptionOverride] = useState(currentPage.description ?? '');

  const handleApplyTitleOverride = () => {
    const trimmed = titleOverride.trim();
    if (!trimmed) return;
    onUpdatePage({ ...currentPage, title: trimmed });
  };

  const handleApplyDescriptionOverride = () => {
    const trimmed = descriptionOverride.trim();
    onUpdatePage({ ...currentPage, description: trimmed || undefined });
  };

  return (
    <section className="rounded-xl border border-[var(--tab-popup-section-gray-border)] bg-[var(--tab-popup-section-gray-bg)] p-3.5 shadow-lg">
      <div className="mb-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onTogglePublic}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
            isPublic
              ? 'bg-[var(--tab-popup-action-emerald-bg)] text-[var(--tab-popup-action-emerald-text)] hover:bg-[var(--tab-popup-action-emerald-bg-hover)]'
              : 'bg-[var(--tab-popup-action-neutral-bg)] text-[var(--tab-popup-action-neutral-text)] hover:bg-[var(--tab-popup-action-neutral-bg-hover)]'
          }`}
          title={isPublic ? '公开（点击切换为隐私）' : '隐私（点击切换为公开）'}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {isPublic ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            )}
          </svg>
        </button>

        <button
          type="button"
          onClick={onToggleThumbnail}
          disabled={!currentPage.thumbnail}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
            includeThumbnail
              ? 'bg-[var(--tab-popup-action-amber-bg)] text-[var(--tab-popup-action-amber-text)] hover:bg-[var(--tab-popup-action-amber-bg-hover)]'
              : 'bg-[var(--tab-popup-action-neutral-bg)] text-[var(--tab-popup-action-neutral-text)] hover:bg-[var(--tab-popup-action-neutral-bg-hover)]'
          } ${!currentPage.thumbnail ? 'cursor-not-allowed opacity-40' : ''}`}
          title={includeThumbnail ? '包含封面图（点击取消）' : '不包含封面图（点击添加）'}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onToggleSnapshot}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
            createSnapshot
              ? 'bg-[var(--tab-popup-action-purple-bg)] text-[var(--tab-popup-action-purple-text)] hover:bg-[var(--tab-popup-action-purple-bg-hover)]'
              : 'bg-[var(--tab-popup-action-neutral-bg)] text-[var(--tab-popup-action-neutral-text)] hover:bg-[var(--tab-popup-action-neutral-bg-hover)]'
          }`}
          title={createSnapshot ? '创建快照（点击取消）' : '不创建快照（点击创建）'}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setShowTitleEdit(!showTitleEdit)}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
            showTitleEdit
              ? 'bg-[var(--tab-popup-action-blue-bg)] text-[var(--tab-popup-action-blue-text)] hover:bg-[var(--tab-popup-action-blue-bg-hover)]'
              : 'bg-[var(--tab-popup-action-neutral-bg)] text-[var(--tab-popup-action-neutral-text)] hover:bg-[var(--tab-popup-action-neutral-bg-hover)]'
          }`}
          title={showTitleEdit ? '修改标题（点击收起）' : '修改标题（点击展开）'}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setShowDescEdit(!showDescEdit)}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
            showDescEdit
              ? 'bg-[var(--tab-popup-action-blue-bg)] text-[var(--tab-popup-action-blue-text)] hover:bg-[var(--tab-popup-action-blue-bg-hover)]'
              : 'bg-[var(--tab-popup-action-neutral-bg)] text-[var(--tab-popup-action-neutral-text)] hover:bg-[var(--tab-popup-action-neutral-bg-hover)]'
          }`}
          title={showDescEdit ? '修改描述（点击收起）' : '修改描述（点击展开）'}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>

      <div className="mb-2.5 space-y-2">
        {showTitleEdit && (
          <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
            <input
              type="text"
              value={titleOverride}
              onChange={(e) => setTitleOverride(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyTitleOverride();
              }}
              placeholder="输入自定义标题后回车或点击应用"
              className="flex-1 rounded-xl border border-[var(--tab-popup-input-border)] bg-[var(--tab-popup-input-bg)] px-3 py-2 text-sm text-[var(--tab-popup-input-text)] placeholder:text-[var(--tab-popup-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-popup-input-focus-ring)] focus:border-[var(--tab-popup-input-focus-border)]"
              autoFocus
            />
            <button
              onClick={handleApplyTitleOverride}
              disabled={!titleOverride.trim()}
              className="rounded-xl bg-gradient-to-r from-[var(--tab-popup-primary-from)] to-[var(--tab-popup-primary-via)] px-4 py-2 text-sm font-medium text-[var(--tab-popup-primary-text)] shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            >
              应用
            </button>
          </div>
        )}

        {showDescEdit && (
          <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
            <textarea
              value={descriptionOverride}
              onChange={(e) => setDescriptionOverride(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) handleApplyDescriptionOverride();
              }}
              placeholder="输入自定义描述后 Ctrl+Enter 或点击应用"
              rows={2}
              className="flex-1 rounded-xl border border-[var(--tab-popup-input-border)] bg-[var(--tab-popup-input-bg)] px-3 py-2 text-sm text-[var(--tab-popup-input-text)] placeholder:text-[var(--tab-popup-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-popup-input-focus-ring)] focus:border-[var(--tab-popup-input-focus-border)] resize-none"
              autoFocus
            />
            <button
              onClick={handleApplyDescriptionOverride}
              className="rounded-xl bg-gradient-to-r from-[var(--tab-popup-primary-from)] to-[var(--tab-popup-primary-via)] px-4 py-2 text-sm font-medium text-[var(--tab-popup-primary-text)] shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
            >
              应用
            </button>
          </div>
        )}
      </div>

      <PageInfoCard
        title={currentPage.title}
        url={currentPage.url}
        description={currentPage.description}
        thumbnail={includeThumbnail ? currentPage.thumbnail : undefined}
        thumbnails={includeThumbnail ? currentPage.thumbnails : undefined}
        favicon={currentPage.favicon}
        onThumbnailChange={(newThumbnail) => {
          onUpdatePage({ ...currentPage, thumbnail: newThumbnail });
        }}
      />
    </section>
  );
}
