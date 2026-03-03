/**
 * TMarks 单个 URL Prompt 构建
 */

import type { OrganizeOptions } from '../types'

export function buildTMarksPrompt(url: string, options: OrganizeOptions): string {
  const existingTags = options.existingTags || []
  const tagStyle = options.tagStyle
  
  // 标题长度
  const titleLengthMap = {
    short: '5-15字',
    medium: '10-30字',
    long: '20-50字'
  }
  const titleLength = titleLengthMap[options.titleLength || 'medium']
  
  // 描述详细度
  const descriptionDetailMap = {
    minimal: '10-20字的简要说明',
    short: '20-50字的概括性描述',
    detailed: '50-100字的详细说明，包含关键特点'
  }
  const descriptionLength = descriptionDetailMap[options.descriptionDetail || 'short']
  
  // 标签数量
  const tagCountMin = options.tagCountMin || 2
  const tagCountMax = options.tagCountMax || 5
  
  // 语言偏好
  const language = options.language || 'zh'
  const languageMap = {
    zh: '使用中文',
    en: '使用英文',
    mixed: '中英文混合使用'
  }
  const languagePreference = languageMap[language]
  
  // 根据语言偏好调整规则
  const tagLengthRule = language === 'en' 
    ? '标签要简洁明了，一般为 1-3 个单词'
    : language === 'mixed'
    ? '标签要简洁明了，中文 2-4 个汉字，英文 1-3 个单词'
    : '标签要简洁明了，一般为 2-4 个汉字'
  
  const translationRule = language === 'zh'
    ? '如果网页内容为外文，请将标题、描述和标签翻译成中文'
    : language === 'en'
    ? '如果网页内容为中文，请将标题、描述和标签翻译成英文'
    : '标题、描述和标签可以根据内容使用中文或英文，优先保持原语言'
  
  // 构建风格指南
  const styleGuide = tagStyle 
    ? `\n\n用户风格偏好：\n${tagStyle}` 
    : ''

  return `你是一个专业的书签管理助手。请根据网址为用户生成书签信息并推荐最合适的标签。

网址：${url}

用户已有的标签库（${existingTags.length} 个）：
${existingTags.length > 0 ? existingTags.slice(0, 100).join(', ') : '无'}
${styleGuide}

任务要求：
1. 生成一个简洁的标题（${titleLength}，${languagePreference}）
2. 生成一个描述（${descriptionLength}，${languagePreference}）
3. 推荐标签（${languagePreference}）

⚠️ 严格约束：
- **标签数量必须严格在 ${tagCountMin} 到 ${tagCountMax} 个之间**
- 少于 ${tagCountMin} 个或多于 ${tagCountMax} 个都是错误的
- 根据网页内容丰富程度在此范围内灵活选择，不要总是使用最少或最多数量

标签推荐规则：
1. **优先匹配已有的标签库**，避免生成重复或近义标签
2. **层级化标签策略**：
   - 至少包含 1-2 个通用大分类标签（如：邮箱、GitHub）
   - 再包含具体的细分标签（如：Gmail、谷歌邮箱、企业邮箱）
   - 示例：Gmail → 推荐 ["邮箱", "Gmail", "谷歌服务"]
   - 示例：GitHub 仓库链接 → 推荐 ["GitHub", "开源", "代码托管"]
3. ${tagLengthRule}
4. 覆盖网页的核心主题、内容类型与关键信息
5. 结合用户的收藏目的和使用场景，避免过于冷僻的标签
6. 确保标签具有通用性和可检索性，便于分类与查找
7. ${translationRule}

返回格式（严格遵循）：
{
  "title": "标题",
  "description": "描述",
  "tags": ["标签1", "标签2", "标签3"]
}

JSON 输出要求：
* 必须输出且仅输出一个合法 JSON 对象
* 不允许附加任何解释、reasoning 内容或额外键
* 禁止输出 Markdown、换行提示、警告或其他文本
* 如无法生成有效结果，请返回 {"title": "", "description": "", "tags": []}
* 只返回 JSON，不要任何其他内容`
}
