import { Trash2, Pin, CheckSquare, Download, X } from 'lucide-react'

interface BatchActionBarProps {
  selectedCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onBatchDelete: () => void
  onBatchPin: () => void
  onBatchTodo: () => void
  onBatchExport: () => void
  onCancel: () => void
}

export function BatchActionBar({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onBatchDelete,
  onBatchPin,
  onBatchTodo,
  onBatchExport,
  onCancel,
}: BatchActionBarProps) {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">
            已选择 {selectedCount} 个标签页
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              全选
            </button>
            <span className="text-border">|</span>
            <button
              onClick={onDeselectAll}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              取消全选
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBatchPin}
            className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded hover:bg-muted transition-colors text-sm"
            disabled={selectedCount === 0}
          >
            <Pin className="w-4 h-4" />
            固定
          </button>
          <button
            onClick={onBatchTodo}
            className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded hover:bg-muted transition-colors text-sm"
            disabled={selectedCount === 0}
          >
            <CheckSquare className="w-4 h-4" />
            待办
          </button>
          <button
            onClick={onBatchExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded hover:bg-muted transition-colors text-sm"
            disabled={selectedCount === 0}
          >
            <Download className="w-4 h-4" />
            导出
          </button>
          <button
            onClick={onBatchDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors text-sm"
            disabled={selectedCount === 0}
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded hover:bg-muted/80 transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

