import type { TabGroup } from '@/lib/types'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Circle,
  FolderPlus,
  ExternalLink,
  EyeOff,
  Edit2,
  Share2,
  Copy,
  FolderPlus as FolderPlusIcon,
  FilePlus,
  Trash2,
  Move
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { DropdownMenu, type MenuItem } from '@/components/common/DropdownMenu'
import { useTabGroupMenu } from '@/hooks/useTabGroupMenu'

interface TabGroupTreeProps {
  tabGroups: TabGroup[]
  selectedGroupId: string | null
  onSelectGroup: (groupId: string | null) => void
  onCreateFolder?: () => void
  onRenameGroup?: (groupId: string, newTitle: string) => Promise<void>
  onMoveGroup?: (groupId: string, newParentId: string | null, newPosition: number) => Promise<void>
  onRefresh?: () => Promise<void>
}

interface TreeNodeProps {
  group: TabGroup
  level: number
  isLast: boolean
  parentLines: boolean[]
  selectedGroupId: string | null
  onSelectGroup: (groupId: string | null) => void
  expandedGroups: Set<string>
  toggleGroup: (groupId: string, e: React.MouseEvent) => void
  editingGroupId: string | null
  setEditingGroupId: (id: string | null) => void
  editingTitle: string
  setEditingTitle: (title: string) => void
  onRenameGroup?: (groupId: string, newTitle: string) => Promise<void>
  onRefresh?: () => Promise<void>
  activeId: string | null
  overId: string | null
  dropPosition: 'before' | 'inside' | 'after' | null
}

// 构建树形结构
function buildTree(groups: TabGroup[]): TabGroup[] {
  const groupMap = new Map<string, TabGroup>()
  const rootGroups: TabGroup[] = []

  // 第一遍：创建映射并初始化 children
  groups.forEach(group => {
    groupMap.set(group.id, { ...group, children: [] })
  })

  // 第二遍：构建父子关系
  groups.forEach(group => {
    const node = groupMap.get(group.id)!
    if (group.parent_id) {
      const parent = groupMap.get(group.parent_id)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      } else {
        // 父节点不存在，作为根节点
        rootGroups.push(node)
      }
    } else {
      rootGroups.push(node)
    }
  })

  // 按 position 排序所有层级
  const sortByPosition = (nodes: TabGroup[]) => {
    nodes.sort((a, b) => (a.position || 0) - (b.position || 0))
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortByPosition(node.children)
      }
    })
  }

  sortByPosition(rootGroups)
  return rootGroups
}

// 树形节点组件
function TreeNode({
  group,
  level,
  isLast,
  parentLines,
  selectedGroupId,
  onSelectGroup,
  expandedGroups,
  toggleGroup,
  editingGroupId,
  setEditingGroupId,
  editingTitle,
  setEditingTitle,
  onRenameGroup,
  onRefresh,
  activeId,
  overId,
  dropPosition,
}: TreeNodeProps) {
  const isSelected = selectedGroupId === group.id
  const isExpanded = expandedGroups.has(group.id)
  const hasChildren = (group.children?.length || 0) > 0
  const isFolder = group.is_folder === 1
  const isEditing = editingGroupId === group.id
  const isBeingDragged = activeId === group.id
  const isDropTarget = overId === group.id && !isBeingDragged

  // Sortable hook for drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({
    id: group.id,
    data: {
      type: isFolder ? 'folder' : 'group',
      parentId: group.parent_id,
    }
  })

  // 不使用 transform，元素保持原位
  const style = {
    opacity: isDragging ? 0.3 : 1, // 拖拽时更透明，表示正在拖拽
  }

  const handleDoubleClick = () => {
    if (onRenameGroup) {
      setEditingGroupId(group.id)
      setEditingTitle(group.title)
    }
  }

  const handleRenameSubmit = async () => {
    if (editingTitle.trim() && editingTitle !== group.title && onRenameGroup) {
      await onRenameGroup(group.id, editingTitle.trim())
    }
    setEditingGroupId(null)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setEditingGroupId(null)
    }
  }

  // 使用菜单 hook
  const menuActions = useTabGroupMenu({
    onRefresh: onRefresh || (async () => {}),
    onStartRename: (groupId, title) => {
      setEditingGroupId(groupId)
      setEditingTitle(title)
    }
  })

  // 构建菜单项
  const menuItems: MenuItem[] = [
    // 打开功能
    {
      label: '在新窗口中打开',
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: () => menuActions.onOpenInNewWindow(group),
      disabled: isFolder
    },
    {
      label: '在此窗口中打开',
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: () => menuActions.onOpenInCurrentWindow(group),
      disabled: isFolder
    },
    {
      label: '在新的隐身窗口中打开',
      icon: <EyeOff className="w-4 h-4" />,
      onClick: () => menuActions.onOpenInIncognito(group),
      disabled: isFolder
    },
    // 编辑功能
    {
      label: '重命名',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: () => menuActions.onRename(group),
      divider: true
    },
    {
      label: '共享为网页',
      icon: <Share2 className="w-4 h-4" />,
      onClick: () => menuActions.onShare(group),
      disabled: isFolder
    },
    {
      label: '复制到剪贴板',
      icon: <Copy className="w-4 h-4" />,
      onClick: () => menuActions.onCopyToClipboard(group)
    },
    // 创建功能
    {
      label: '在上方创建文件夹',
      icon: <FolderPlusIcon className="w-4 h-4" />,
      onClick: () => menuActions.onCreateFolderAbove(group),
      divider: true
    },
    {
      label: '在内部创建文件夹',
      icon: <FolderPlusIcon className="w-4 h-4" />,
      onClick: () => menuActions.onCreateFolderInside(group),
      disabled: !isFolder
    },
    {
      label: '在下方创建文件夹',
      icon: <FolderPlusIcon className="w-4 h-4" />,
      onClick: () => menuActions.onCreateFolderBelow(group)
    },
    {
      label: '在上方创建分组',
      icon: <FilePlus className="w-4 h-4" />,
      onClick: () => menuActions.onCreateGroupAbove(group)
    },
    {
      label: '在内部创建分组',
      icon: <FilePlus className="w-4 h-4" />,
      onClick: () => menuActions.onCreateGroupInside(group),
      disabled: !isFolder
    },
    {
      label: '在下方创建分组',
      icon: <FilePlus className="w-4 h-4" />,
      onClick: () => menuActions.onCreateGroupBelow(group)
    },
    // 管理功能
    {
      label: '移除重复项',
      icon: <Copy className="w-4 h-4" />,
      onClick: () => menuActions.onRemoveDuplicates(group),
      disabled: isFolder,
      divider: true
    },
    {
      label: '移动',
      icon: <Move className="w-4 h-4" />,
      onClick: () => menuActions.onMove(group)
    },
    // 删除功能
    {
      label: '移至回收站',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => menuActions.onMoveToTrash(group),
      danger: true,
      divider: true
    }
  ]

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* 拖动目标指示器 - 插入到上方 */}
      {isDropTarget && dropPosition === 'before' && (
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: '-2px',
            height: '4px',
            backgroundColor: '#3b82f6',
            zIndex: 999,
            transition: 'opacity 150ms ease-in-out'
          }}
        />
      )}

      {/* 拖动目标指示器 - 放入文件夹内部 */}
      {isDropTarget && dropPosition === 'inside' && isFolder && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px dashed #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '4px',
            zIndex: 999,
            transition: 'opacity 150ms ease-in-out'
          }}
        />
      )}

      {/* 拖动目标指示器 - 插入到下方 */}
      {isDropTarget && dropPosition === 'after' && (
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            bottom: '-2px',
            height: '4px',
            backgroundColor: '#3b82f6',
            zIndex: 999,
            transition: 'opacity 150ms ease-in-out'
          }}
        />
      )}

      {/* 节点行 */}
      <div
        className={`group flex items-center gap-1 px-3 py-1.5 hover:bg-muted relative ${
          isSelected ? 'bg-primary/10' : ''
        } ${isBeingDragged ? 'opacity-50' : ''}`}
        style={{ paddingLeft: `${12 + level * 20}px` }}
      >
        {/* 树形连接线 - 使用伪元素和 border */}
        {level > 0 && (
          <div
            className="absolute left-0 top-0 h-full pointer-events-none"
            style={{
              width: `${12 + level * 20}px`
            }}
          >
            {/* 渲染每一层的垂直线和水平线 */}
            {Array.from({ length: level }).map((_, idx) => {
              const isCurrentLevel = idx === level - 1
              const shouldDrawVertical = idx < level - 1 ? parentLines[idx] : !isLast
              const lineLeft = 12 + idx * 20

              return (
                <div key={idx} className="absolute" style={{ left: `${lineLeft}px`, top: 0, height: '100%' }}>
                  {/* 垂直线 */}
                  {shouldDrawVertical && (
                    <div
                      className="absolute left-0 top-0 w-px h-full bg-border/50"
                    />
                  )}
                  {/* 当前层级的连接线 */}
                  {isCurrentLevel && (
                    <>
                      {/* 垂直线（上半部分） */}
                      <div
                        className="absolute left-0 top-0 w-px h-1/2 bg-border/50"
                      />
                      {/* 水平线 */}
                      <div
                        className="absolute left-0 top-1/2 w-2 h-px bg-border/50"
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {/* 内容区域 */}
        <div className="flex items-center gap-2 flex-1">

          {/* 展开/折叠按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleGroup(group.id, e)
            }}
            className="w-4 h-4 flex items-center justify-center hover:bg-muted rounded flex-shrink-0"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )
            ) : (
              <div className="w-3 h-3" />
            )}
          </button>

          {/* 图标和标题区域 - 整行可拖拽 */}
          <div
            {...attributes}
            {...listeners}
            className="flex items-center gap-2 flex-1 cursor-grab active:cursor-grabbing"
          >
            {/* 图标 */}
            {isFolder ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-primary flex-shrink-0" />
              )
            ) : (
              <Circle
                className={`w-2 h-2 flex-shrink-0 text-primary ${isSelected ? 'fill-current' : ''}`}
              />
            )}

            {/* 标题 */}
            {isEditing ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleRenameKeyDown}
                className="text-sm flex-1 px-1 py-0.5 border border-primary rounded bg-card text-foreground focus:outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectGroup(group.id)
                }}
                onDoubleClick={handleDoubleClick}
                className={`text-sm flex-1 truncate ${
                  isSelected ? 'text-primary font-medium' : 'text-foreground'
                }`}
              >
                {group.title}
              </span>
            )}
          </div>

          {/* 数量 */}
          {!isFolder && (
            <span className="text-xs text-muted-foreground flex-shrink-0">{group.item_count || 0}</span>
          )}

          {/* 三点菜单 */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <DropdownMenu
              trigger={
                <button className="p-1 hover:bg-muted rounded transition-colors">
                  <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 16 16">
                    <circle cx="8" cy="3" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="8" cy="13" r="1.5" />
                  </svg>
                </button>
              }
              items={menuItems}
              align="right"
            />
          </div>
        </div>
      </div>

      {/* 子节点 */}
      {isExpanded && hasChildren && (
        <div>
          {group.children!.map((child, index) => (
            <TreeNode
              key={child.id}
              group={child}
              level={level + 1}
              isLast={index === group.children!.length - 1}
              parentLines={[...parentLines, !isLast]}
              selectedGroupId={selectedGroupId}
              onSelectGroup={onSelectGroup}
              expandedGroups={expandedGroups}
              toggleGroup={toggleGroup}
              editingGroupId={editingGroupId}
              setEditingGroupId={setEditingGroupId}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              onRenameGroup={onRenameGroup}
              onRefresh={onRefresh}
              activeId={activeId}
              overId={overId}
              dropPosition={dropPosition}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 拖放位置类型
type DropPosition = 'before' | 'inside' | 'after'

export function TabGroupTree({
  tabGroups,
  selectedGroupId,
  onSelectGroup,
  onCreateFolder,
  onRenameGroup,
  onMoveGroup,
  onRefresh,
}: TabGroupTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移动 8px 后才开始拖拽
      },
    }),
    useSensor(KeyboardSensor)
  )

  const totalCount = tabGroups.reduce((sum, group) => {
    if (group.is_folder === 1) return sum
    return sum + (group.item_count || 0)
  }, 0)

  const toggleGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    const draggedId = event.active.id as string
    const draggedGroup = tabGroups.find(g => g.id === draggedId)
    console.log('🚀🚀🚀 Drag Start:', {
      id: draggedId,
      title: draggedGroup?.title,
      isFolder: draggedGroup?.is_folder
    })
    setActiveId(draggedId)
  }

  // 使用 ref 来跟踪鼠标位置
  const mouseYRef = useRef<number>(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseYRef.current = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string | null
    setOverId(overId)

    if (!overId || !event.over) {
      setDropPosition(null)
      return
    }

    // 获取目标元素
    const overGroup = tabGroups.find(g => g.id === overId)
    if (!overGroup) {
      setDropPosition(null)
      return
    }

    // 获取目标元素的 DOM 节点
    const overElement = event.over.rect
    if (!overElement) {
      setDropPosition(null)
      return
    }

    // 使用实时鼠标位置计算相对位置
    const mouseY = mouseYRef.current
    const relativeY = (mouseY - overElement.top) / overElement.height

    console.log('🎯 DragOver:', {
      overId,
      overTitle: overGroup.title,
      isFolder: overGroup.is_folder,
      relativeY: relativeY.toFixed(2),
      mouseY,
      overTop: overElement.top,
      overHeight: overElement.height
    })

    // 如果是文件夹，使用三区域逻辑
    if (overGroup.is_folder === 1) {
      if (relativeY < 0.2) {
        console.log('  → before')
        setDropPosition('before') // 上边缘 20%
      } else if (relativeY > 0.8) {
        console.log('  → after')
        setDropPosition('after') // 下边缘 20%
      } else {
        console.log('  → inside')
        setDropPosition('inside') // 中间 60%
      }
    } else {
      // 如果是分组，使用两区域逻辑
      if (relativeY < 0.5) {
        console.log('  → before')
        setDropPosition('before')
      } else {
        console.log('  → after')
        setDropPosition('after')
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    const currentDropPosition = dropPosition

    setActiveId(null)
    setOverId(null)
    setDropPosition(null)

    if (!over || active.id === over.id || !onMoveGroup) return

    // 获取拖拽的项和目标项
    const draggedGroup = tabGroups.find(g => g.id === active.id)
    const targetGroup = tabGroups.find(g => g.id === over.id)

    if (!draggedGroup || !targetGroup) return

    console.log('🎯 DragEnd:', {
      draggedId: draggedGroup.id,
      draggedTitle: draggedGroup.title,
      targetId: targetGroup.id,
      targetTitle: targetGroup.title,
      dropPosition: currentDropPosition
    })

    // 根据拖放位置决定操作
    if (currentDropPosition === 'inside' && targetGroup.is_folder === 1) {
      // 放入文件夹内部
      // 防止将文件夹移动到自己或自己的子文件夹中
      if (draggedGroup.is_folder === 1) {
        const isDescendant = (parentId: string, childId: string): boolean => {
          const child = tabGroups.find(g => g.id === childId)
          if (!child || !child.parent_id) return false
          if (child.parent_id === parentId) return true
          return isDescendant(parentId, child.parent_id)
        }

        if (isDescendant(draggedGroup.id, targetGroup.id)) {
          console.log('  ❌ Cannot move folder into its descendant')
          return
        }
      }

      // 移动到文件夹内部，position 设为最大值 + 1
      const siblingsInTarget = tabGroups.filter(g => g.parent_id === targetGroup.id)
      const maxPosition = siblingsInTarget.length > 0
        ? Math.max(...siblingsInTarget.map(g => g.position || 0))
        : -1
      const newPosition = maxPosition + 1

      console.log('  → Moving inside folder, new position:', newPosition)
      await onMoveGroup(draggedGroup.id, targetGroup.id, newPosition)
    } else if (currentDropPosition === 'before' || currentDropPosition === 'after') {
      // 插入到目标的上方或下方（与目标同级）
      const newParentId = targetGroup.parent_id || null
      const siblings = tabGroups.filter(g =>
        (g.parent_id || null) === newParentId && g.id !== draggedGroup.id
      )

      // 按当前 position 排序
      siblings.sort((a, b) => (a.position || 0) - (b.position || 0))

      // 计算新位置
      let newPosition: number
      if (currentDropPosition === 'before') {
        newPosition = targetGroup.position || 0
        console.log('  → Moving before target, new position:', newPosition)
      } else {
        newPosition = (targetGroup.position || 0) + 1
        console.log('  → Moving after target, new position:', newPosition)
      }

      await onMoveGroup(draggedGroup.id, newParentId, newPosition)
    } else {
      // 默认行为：移动到与目标相同的父级，position 设为最大值 + 1
      const newParentId = targetGroup.parent_id || null
      const siblings = tabGroups.filter(g => (g.parent_id || null) === newParentId)
      const maxPosition = siblings.length > 0
        ? Math.max(...siblings.map(g => g.position || 0))
        : -1
      const newPosition = maxPosition + 1

      console.log('  → Moving to same parent, new position:', newPosition)
      await onMoveGroup(draggedGroup.id, newParentId, newPosition)
    }
  }

  // 构建树形结构
  const treeData = buildTree(tabGroups)

  // 获取所有可拖拽项的ID
  const allIds = tabGroups.map(g => g.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full h-full bg-card border-r border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            标签页组
          </div>
          {onCreateFolder && (
            <button
              onClick={onCreateFolder}
              className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded transition-colors"
              title="创建文件夹"
            >
              <FolderPlus className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* List */}
        <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
          <div className="flex-1 overflow-y-auto">
        {/* 全部 - 作为根节点 */}
        <div className="relative">
          <div
            onClick={() => onSelectGroup(null)}
            className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-muted ${
              selectedGroupId === null ? 'bg-primary/10' : ''
            }`}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <Circle className={`w-2 h-2 ${selectedGroupId === null ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </div>
            <span className={`text-sm flex-1 ${selectedGroupId === null ? 'text-primary font-medium' : 'text-foreground'}`}>
              全部
            </span>
            <span className="text-xs text-muted-foreground">{totalCount}</span>
          </div>

          {/* 树形列表 - 所有节点都是"全部"的子节点 */}
          {treeData.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-muted-foreground/50">暂无分组</p>
            </div>
          ) : (
            <div className="relative">
              {/* 从"全部"延伸下来的垂直线 */}
              {treeData.length > 0 && (
                <div
                  className="absolute pointer-events-none left-3 top-0 bottom-0 w-px bg-border/50"
                />
              )}

              {treeData.map((group, index) => (
                <TreeNode
                  key={group.id}
                  group={group}
                  level={1}
                  isLast={index === treeData.length - 1}
                  parentLines={[true]}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={onSelectGroup}
                  expandedGroups={expandedGroups}
                  toggleGroup={toggleGroup}
                  editingGroupId={editingGroupId}
                  setEditingGroupId={setEditingGroupId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  onRenameGroup={onRenameGroup}
                  onRefresh={onRefresh}
                  activeId={activeId}
                  overId={overId}
                  dropPosition={dropPosition}
                />
              ))}
            </div>
          )}
        </div>
          </div>
        </SortableContext>
      </div>

      {/* DragOverlay - 显示拖拽时的元素 */}
      <DragOverlay>
        {activeId ? (
          <div
            className="opacity-80 bg-card border-2 border-primary rounded shadow-lg cursor-grabbing"
            style={{
              padding: '6px 12px'
            }}
          >
            {(() => {
              const draggedGroup = tabGroups.find(g => g.id === activeId)
              if (!draggedGroup) return null
              const isFolder = draggedGroup.is_folder === 1
              return (
                <div className="flex items-center gap-2">
                  {isFolder ? (
                    <Folder className="w-4 h-4 text-primary" />
                  ) : (
                    <Circle className="w-2 h-2 text-primary fill-current" />
                  )}
                  <span className="text-sm text-foreground">{draggedGroup.title}</span>
                </div>
              )
            })()}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

