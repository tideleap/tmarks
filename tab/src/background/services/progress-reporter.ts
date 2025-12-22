/**
 * AI 整理进度报告服务
 */

export interface AiOrganizeProgressPayload {
  sessionId: string;
  level: 'info' | 'success' | 'warn' | 'error';
  step: string;
  message: string;
  detail?: any;
}

/**
 * 报告 AI 整理进度
 */
export async function reportAiOrganizeProgress(
  payload: AiOrganizeProgressPayload
): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      type: 'AI_ORGANIZE_PROGRESS',
      payload: {
        ...payload,
        ts: Date.now(),
      },
    });
  } catch {
    // ignore
  }
}
