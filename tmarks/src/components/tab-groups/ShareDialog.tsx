import { useState, useEffect } from 'react'
import { X, Copy, Check, Share2, Eye } from 'lucide-react'
import { tabGroupsService } from '@/services/tab-groups'
import type { Share } from '@/lib/types'

interface ShareDialogProps {
  groupId: string
  groupTitle: string
  onClose: () => void
}

export function ShareDialog({ groupId, groupTitle, onClose }: ShareDialogProps) {
  const [share, setShare] = useState<Share | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrCreateShare()
  }, [groupId])

  const loadOrCreateShare = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Try to get existing share
      try {
        const response = await tabGroupsService.getShare(groupId)
        setShare(response.share)
        setShareUrl(response.share_url)
      } catch (err) {
        // If no share exists, create one
        const response = await tabGroupsService.createShare(groupId, { is_public: true })
        setShare(response.share)
        setShareUrl(response.share_url)
      }
    } catch (err) {
      console.error('Failed to load/create share:', err)
      setError('创建分享链接失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('复制失败')
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除分享链接吗？')) {
      return
    }

    try {
      await tabGroupsService.deleteShare(groupId)
      onClose()
    } catch (err) {
      console.error('Failed to delete share:', err)
      alert('删除失败')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded shadow-xl max-w-md w-full" style={{backgroundColor: 'var(--card)'}}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">分享标签页组</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">生成分享链接中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={loadOrCreateShare}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                重试
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">标签页组名称</p>
                <p className="text-foreground font-medium">{groupTitle}</p>
              </div>

              {share && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Eye className="w-4 h-4" />
                    <span>浏览次数: {share.view_count}</span>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">分享链接</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="input flex-1 text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded p-4 mb-4">
                <p className="text-sm text-foreground">
                  💡 任何人都可以通过此链接查看您的标签页组，但无法编辑。
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  删除分享
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
                >
                  关闭
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

