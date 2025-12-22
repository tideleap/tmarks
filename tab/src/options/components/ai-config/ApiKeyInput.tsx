/**
 * API Key 输入组件
 */

import type { AIProvider } from '@/types';
import { AI_SERVICE_DOCS } from '@/lib/constants/urls';

interface ApiKeyInputProps {
  provider: AIProvider;
  apiKey: string;
  onChange: (apiKey: string) => void;
}

const apiKeyPlaceholders: Record<AIProvider, string> = {
  openai: '请输入 OpenAI API Key',
  claude: '请输入 Claude API Key',
  deepseek: '请输入 DeepSeek API Key',
  zhipu: '请输入智谱 API Key',
  modelscope: '请输入 ModelScope API Key',
  siliconflow: '请输入 SiliconFlow API Key',
  iflow: '请输入讯飞星火 API Key',
  custom: '请输入 API Key',
};

const providerDocs: Partial<Record<AIProvider, { name: string; url: string }>> = {
  openai: { name: 'OpenAI Platform', url: AI_SERVICE_DOCS.OPENAI },
  claude: { name: 'Anthropic Console', url: AI_SERVICE_DOCS.CLAUDE },
  deepseek: { name: 'DeepSeek Platform', url: AI_SERVICE_DOCS.DEEPSEEK },
  zhipu: { name: '智谱AI开放平台', url: AI_SERVICE_DOCS.ZHIPU },
  modelscope: { name: 'ModelScope', url: AI_SERVICE_DOCS.MODELSCOPE },
  siliconflow: { name: 'SiliconFlow', url: AI_SERVICE_DOCS.SILICONFLOW },
  iflow: { name: '讯飞开放平台', url: AI_SERVICE_DOCS.IFLOW },
};

export function ApiKeyInput({ provider, apiKey, onChange }: ApiKeyInputProps) {
  const doc = providerDocs[provider];

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-3">
        API Key
      </label>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => onChange(e.target.value)}
        placeholder={apiKeyPlaceholders[provider]}
        className="w-full px-3 py-2 border border-[color:var(--tab-options-button-border)] rounded-lg bg-[color:var(--tab-options-card-bg)] text-[var(--tab-options-title)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)]"
      />
      {doc && (
        <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">
          获取 API Key：
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--tab-options-pill-text)] hover:underline"
          >
            {doc.name}
          </a>
        </p>
      )}
    </div>
  );
}
