/**
 * 消息处理器
 */

import type { Message, MessageResponse } from '@/types';
import { PageContentExtractor } from '../extractors';

const extractor = new PageContentExtractor();

export function setupMessageHandler() {
  // 防止重复注入
  if ((window as any).__AITMARKS_CONTENT_SCRIPT_LOADED__) {
    return;
  }
  (window as any).__AITMARKS_CONTENT_SCRIPT_LOADED__ = true;

  chrome.runtime.onMessage.addListener(
    (
      message: Message,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: MessageResponse) => void
    ) => {
      // 心跳响应
      if (message.type === 'PING') {
        try {
          sendResponse({ success: true, data: 'pong' });
        } catch (error) {
          // Silently handle error
        }
        return true;
      }

      // 提取页面信息
      if (message.type === 'EXTRACT_PAGE_INFO') {
        handleExtractPageInfo(sendResponse);
        return true;
      }

      // SingleFile 页面捕获
      if (message.type === 'CAPTURE_PAGE') {
        handleCapturePage(message, sendResponse);
        return true;
      }

      // SingleFile V2 页面捕获
      if (message.type === 'CAPTURE_PAGE_V2') {
        handleCapturePageV2(message, sendResponse);
        return true;
      }

      return false;
    }
  );
}

async function handleExtractPageInfo(
  sendResponse: (response: MessageResponse) => void
) {
  try {
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        } else {
          resolve(null);
        }
      });
    }

    const pageInfo = extractor.extract();

    if (!pageInfo.url) {
      pageInfo.url = window.location.href;
    }
    if (!pageInfo.title) {
      pageInfo.title = document.title || 'Untitled';
    }

    sendResponse({ success: true, data: pageInfo });
  } catch (error) {
    sendResponse({
      success: true,
      data: {
        title: document.title || 'Untitled',
        url: window.location.href,
        description: '',
        content: '',
        thumbnail: '',
      },
    });
  }
}

async function handleCapturePage(
  message: Message,
  sendResponse: (response: MessageResponse) => void
) {
  try {
    const { capturePage } = await import('../singlefile-capture');
    const html = await capturePage(message.options || {});
    const size = new Blob([html]).size;

    sendResponse({ success: true, html, size });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleCapturePageV2(
  message: Message,
  sendResponse: (response: MessageResponse) => void
) {
  try {
    const { capturePageV2 } = await import('../singlefile-capture-v2');
    const result = await capturePageV2(message.options || {});

    const images = await Promise.all(
      result.images.map(async (img) => {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(img.blob);
        });

        return {
          hash: img.hash,
          data: base64,
          type: img.blob.type,
          size: img.blob.size,
        };
      })
    );

    sendResponse({
      success: true,
      data: { html: result.html, images },
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
