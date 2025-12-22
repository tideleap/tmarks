/**
 * 模型选择器组件
 */

import { useEffect, useRef, useState } from 'react';
import type { AIProvider } from '@/types';

interface ModelSelectorProps {
  model: string;
  provider: AIProvider;
  availableModels: string[];
  isFetchingModels: boolean;
  modelFetchError: string | null;
  modelFetchSupported: boolean;
  apiKey: string;
  onModelChange: (model: string) => void;
  onRefreshModels: () => void;
}

const modelPlaceholders: Record<AIProvider, string> = {
  openai: 'gpt-4o-mini (推荐) 或 gpt-4o',
  claude: 'claude-3-5-sonnet-20241022 (推荐)',
  deepseek: 'deepseek-chat',
  zhipu: 'glm-4-flash (推荐) 或 glm-4-plus',
  modelscope: 'qwen-plus 或 qwen-turbo',
  siliconflow: 'Qwen/Qwen2.5-7B-Instruct',
  iflow: 'spark-lite 或 spark-pro',
  custom: '请输入模型名称',
};

export function ModelSelector({
  model,
  provider,
  availableModels,
  isFetchingModels,
  modelFetchError,
  modelFetchSupported,
  apiKey,
  onModelChange,
  onRefreshModels,
}: ModelSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const hasModelOptions = availableModels.length > 0;

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!hasModelOptions) {
      setDropdownOpen(false);
    }
  }, [hasModelOptions]);

  const handleSelectModel = (selectedModel: string) => {
    onModelChange(selectedModel);
    setDropdownOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-[var(--tab-options-text)]">模型</label>
        <button
          type="button"
          onClick={onRefreshModels}
          disabled={!modelFetchSupported || isFetchingModels || !apiKey.trim()}
          className={`text-xs px-3 py-1 rounded-lg transition-colors ${
            !modelFetchSupported || isFetchingModels || !apiKey.trim()
              ? 'bg-[var(--tab-options-button-hover-bg)] text-[var(--tab-options-text-muted)] cursor-not-allowed'
              : 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] hover:bg-[var(--tab-options-button-primary-hover)]'
          }`}
        >
          {isFetchingModels ? '获取中...' : '刷新模型'}
        </button>
      </div>

      <div className="relative w-full" ref={dropdownRef}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder={modelPlaceholders[provider]}
            className="flex-1 px-3 py-2 border border-[color:var(--tab-options-button-border)] rounded-lg bg-[color:var(--tab-options-card-bg)] text-[var(--tab-options-title)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)]"
          />
          {hasModelOptions && (
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="px-3 py-2 rounded-lg bg-[var(--tab-options-button-hover-bg)] text-[var(--tab-options-button-text)] hover:bg-[color:var(--tab-options-button-border)] transition-colors flex items-center gap-1"
            >
              <span className="text-sm font-medium">选择模型</span>
              <span className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
          )}
        </div>

        {hasModelOptions && dropdownOpen && (
          <div className="absolute z-10 mt-2 right-0 w-full max-h-[33vh] overflow-y-auto rounded-lg border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-modal-bg)] shadow-2xl">
            {availableModels.map((m) => {
              const isActive = model === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectModel(m)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-[color:var(--tab-options-pill-bg)] text-[var(--tab-options-pill-text)]'
                      : 'text-[var(--tab-options-button-text)] hover:bg-[var(--tab-options-button-hover-bg)]'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {hasModelOptions && (
        <p className="mt-2 text-xs text-[var(--tab-options-pill-text)]">
          已获取 {availableModels.length} 个模型，可直接选择或手动输入。
        </p>
      )}
      {modelFetchError && (
        <p className="mt-2 text-xs text-[var(--tab-options-danger-text)]">
          模型列表加载失败：{modelFetchError}
        </p>
      )}
      {!hasModelOptions && modelFetchSupported && !modelFetchError && !isFetchingModels && (
        <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">
          输入 API 地址与 Key 后可刷新获取可用模型列表。
        </p>
      )}
    </div>
  );
}
