/**
 * 已保存配置列表组件
 */

import type { AIProvider, AIConnectionInfo } from '@/types';
import { providerNameMap } from './types';

interface SavedConnectionsListProps {
  connections: Array<AIConnectionInfo & { provider: AIProvider }>;
  showAll: boolean;
  onToggleShowAll: () => void;
  onApply: (connection: AIConnectionInfo, provider?: AIProvider) => void;
  onDelete: (connection: AIConnectionInfo, provider?: AIProvider) => void;
  currentProvider: AIProvider;
}

export function SavedConnectionsList({
  connections,
  showAll,
  onToggleShowAll,
  onApply,
  onDelete,
  currentProvider,
}: SavedConnectionsListProps) {
  const displayConnections = showAll ? connections : connections.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--tab-options-title)]">
          已保存的全部配置
        </h3>
        <div className="flex items-center gap-2 text-xs text-[var(--tab-options-text-muted)]">
          <span>共 {connections.length} 个</span>
          {connections.length > 3 && (
            <button
              type="button"
              onClick={onToggleShowAll}
              className="rounded-full border border-[color:var(--tab-options-button-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--tab-options-button-text)] transition-colors hover:bg-[var(--tab-options-button-hover-bg)]"
            >
              {showAll ? '收起' : `展开更多 (${connections.length - 3})`}
            </button>
          )}
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[color:var(--tab-options-button-border)] bg-[color:var(--tab-options-card-bg)] p-6 text-sm text-[var(--tab-options-text-muted)]">
          目前还没有保存过任何配置，填写好 API 信息后点击「保存当前配置」即可创建预设。
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {displayConnections.map((connection, index) => (
            <div
              key={
                connection.id ||
                `${connection.provider || 'unknown'}-${connection.label || connection.apiUrl || 'default'}-${index}`
              }
              className="group flex flex-col justify-between gap-3 rounded-2xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-[color:var(--tab-options-modal-border)] hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className="text-sm font-semibold text-[var(--tab-options-title)] truncate"
                  title={connection.label || connection.apiUrl || '未命名配置'}
                >
                  {connection.label || '未命名配置'}
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--tab-options-pill-bg)] text-[var(--tab-options-pill-text)] px-2 py-0.5 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--tab-options-button-primary-bg)]" />
                  {providerNameMap[connection.provider || currentProvider]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onApply(connection, connection.provider)}
                  className="flex-1 rounded-lg bg-[var(--tab-options-button-primary-bg)] px-3 py-2 text-xs font-medium text-[var(--tab-options-button-primary-text)] transition-colors hover:bg-[var(--tab-options-button-primary-hover)]"
                >
                  使用
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(connection, connection.provider)}
                  className="rounded-lg border border-[color:var(--tab-options-button-border)] px-3 py-2 text-xs font-medium text-[var(--tab-options-button-text)] transition-colors hover:bg-[var(--tab-options-button-hover-bg)]"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
