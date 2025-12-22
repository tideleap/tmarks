/**
 * 页面信息提取处理器
 */

import type { Message, MessageResponse } from '@/types';

/**
 * 获取基本页面信息作为 fallback
 */
async function getBasicPageInfo(tabId: number, fallbackUrl: string): Promise<MessageResponse> {
  try {
    const currentTab = await chrome.tabs.get(tabId);
    return {
      success: true,
      data: {
        title: currentTab.title || 'Untitled',
        url: currentTab.url || '',
        description: '',
        content: '',
        thumbnail: '',
      },
    };
  } catch {
    return {
      success: true,
      data: {
        title: 'Untitled',
        url: fallbackUrl,
        description: '',
        content: '',
        thumbnail: '',
      },
    };
  }
}

/**
 * 带超时的消息发送
 */
async function sendMessageWithTimeout(
  tabId: number,
  msg: Message,
  timeoutMs: number = 3000
): Promise<MessageResponse> {
  return Promise.race([
    chrome.tabs.sendMessage(tabId, msg),
    new Promise<MessageResponse>((_, reject) =>
      setTimeout(() => reject(new Error('Message timeout')), timeoutMs)
    ),
  ]);
}

/**
 * 处理页面信息提取
 */
export async function handleExtractPageInfo(message: Message): Promise<MessageResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    throw new Error('No active tab found');
  }

  const url = tab.url || '';
  if (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    !url
  ) {
    return {
      success: true,
      data: {
        title: tab.title || 'Untitled',
        url: url,
        description: '',
        content: '',
        thumbnail: '',
      },
    };
  }

  // 步骤1: 检测 content script 是否存活
  let isContentScriptAlive = false;
  try {
    await sendMessageWithTimeout(tab.id, { type: 'PING' }, 1000);
    isContentScriptAlive = true;
  } catch {
    // Content script not responding, will try to inject
  }

  // 步骤2: 如果 content script 不存在，尝试注入
  if (!isContentScriptAlive) {
    try {
      const manifest = chrome.runtime.getManifest();
      const contentScripts = manifest.content_scripts?.[0];

      if (!contentScripts || !contentScripts.js || contentScripts.js.length === 0) {
        return await getBasicPageInfo(tab.id, url);
      }

      const scriptPath = contentScripts.js[0];

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [scriptPath],
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        await sendMessageWithTimeout(tab.id, { type: 'PING' }, 1000);
        isContentScriptAlive = true;
      } catch {
        return await getBasicPageInfo(tab.id, url);
      }
    } catch {
      return await getBasicPageInfo(tab.id, url);
    }
  }

  // 步骤3: 发送实际的提取请求
  if (isContentScriptAlive) {
    try {
      const response = await sendMessageWithTimeout(tab.id, message, 5000);

      if (response.success && response.data) {
        return response;
      } else {
        return await getBasicPageInfo(tab.id, url);
      }
    } catch {
      return await getBasicPageInfo(tab.id, url);
    }
  }

  return await getBasicPageInfo(tab.id, url);
}
