import { useState } from 'react';

interface ExistingBookmark {
  id: string;
  title: string;
  url: string;
  tags: Array<{ id: string; name: string; color: string | null }>;
  has_snapshot?: boolean;
  snapshot_count?: number;
  created_at: string;
}

interface BookmarkExistsDialogProps {
  bookmark: ExistingBookmark;
  newTags: string[];
  onUpdateTags: (tags: string[]) => void;
  onCreateSnapshot: () => void;
  onCancel: () => void;
}

export function BookmarkExistsDialog({
  bookmark,
  newTags,
  onUpdateTags,
  onCreateSnapshot,
  onCancel,
}: BookmarkExistsDialogProps) {
  const [selectedAction, setSelectedAction] = useState<'snapshot' | 'update-tags' | null>(null);

  const existingTagNames = bookmark.tags.map(t => t.name);
  const newTagsToAdd = newTags.filter(tag => !existingTagNames.includes(tag));
  const hasNewTags = newTagsToAdd.length > 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleConfirm = () => {
    if (selectedAction === 'snapshot') {
      onCreateSnapshot();
    } else if (selectedAction === 'update-tags') {
      onUpdateTags(newTags);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-xl">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-2 flex-shrink-0">
              <svg
                className="w-6 h-6 text-amber-600 dark:text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                书签已存在
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                该网址已经保存过了，您可以选择以下操作
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* 现有书签信息 */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">标题</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {bookmark.title}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">创建时间</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {formatDate(bookmark.created_at)}
              </div>
            </div>

            {/* 现有标签 */}
            {bookmark.tags.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">现有标签</div>
                <div className="flex flex-wrap gap-2">
                  {bookmark.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                      style={
                        tag.color
                          ? {
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }
                          : undefined
                      }
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 快照信息 */}
            <div className="flex items-center gap-2 text-sm">
              <svg
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">
                {bookmark.has_snapshot
                  ? `已有 ${bookmark.snapshot_count || 0} 个快照`
                  : '暂无快照'}
              </span>
            </div>
          </div>

          {/* 新标签提示 */}
          {hasNewTags && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="text-xs text-green-700 dark:text-green-400 mb-2">
                检测到新标签
              </div>
              <div className="flex flex-wrap gap-2">
                {newTagsToAdd.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 操作选项 */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              请选择操作：
            </div>

            {/* 创建快照 */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedAction === 'snapshot'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="action"
                value="snapshot"
                checked={selectedAction === 'snapshot'}
                onChange={() => setSelectedAction('snapshot')}
                className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  创建新快照
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  为这个书签保存当前页面的快照
                </div>
              </div>
            </label>

            {/* 更新标签 */}
            {hasNewTags && (
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedAction === 'update-tags'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="update-tags"
                  checked={selectedAction === 'update-tags'}
                  onChange={() => setSelectedAction('update-tags')}
                  className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    添加新标签
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    将新标签添加到现有书签
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-xl flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAction}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
