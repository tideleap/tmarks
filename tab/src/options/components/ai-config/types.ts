/**
 * AI 配置组件类型定义
 */

import type { AIProvider, AIConnectionInfo } from '@/types';

export interface AIConfigFormData {
  aiProvider: AIProvider;
  apiKey: string;
  apiUrl: string;
  aiModel: string;
}

export interface AIConfigSectionProps {
  formData: AIConfigFormData;
  setFormData: (data: any) => void;
  handleProviderChange: (provider: AIProvider) => void;
  handleTestConnection: () => Promise<void>;
  isTesting: boolean;
  availableModels: string[];
  isFetchingModels: boolean;
  modelFetchError: string | null;
  onRefreshModels: () => void;
  modelFetchSupported: boolean;
  allSavedConnections: Array<AIConnectionInfo & { provider: AIProvider }>;
  onApplySavedConnection: (connection: AIConnectionInfo, providerOverride?: AIProvider) => void;
  onDeleteSavedConnection: (connection: AIConnectionInfo, providerOverride?: AIProvider) => void;
  onSaveConnectionPreset: () => void;
}

export const providerNameMap: Record<AIProvider, string> = {
  openai: 'OpenAI',
  claude: 'Claude',
  deepseek: 'DeepSeek',
  zhipu: '智谱AI',
  modelscope: 'ModelScope',
  siliconflow: 'SiliconFlow',
  iflow: '讯飞星火',
  custom: '自定义',
};
