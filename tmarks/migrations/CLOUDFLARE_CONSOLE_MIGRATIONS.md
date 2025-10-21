# Cloudflare D1 控制台迁移 SQL

本文档包含所有需要在 Cloudflare D1 控制台手动执行的 SQL 语句。

## 如何使用

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **D1**
3. 选择你的数据库（例如：`tmarks-prod-db`）
4. 点击 **Console** 标签
5. 逐条复制粘贴下面的 SQL 语句并执行

> ⚠️ **注意**：Cloudflare D1 控制台不支持一次性执行多条语句，请逐条执行。

---

## 迁移 0011：添加层级支持（2025-01-20）

### 添加 parent_id 字段
```sql
ALTER TABLE tab_groups ADD COLUMN parent_id TEXT DEFAULT NULL;
```

### 添加 is_folder 字段
```sql
ALTER TABLE tab_groups ADD COLUMN is_folder INTEGER DEFAULT 0;
```

### 创建 parent_id 索引
```sql
CREATE INDEX IF NOT EXISTS idx_tab_groups_parent_id ON tab_groups(parent_id);
```

### 创建 is_folder 索引
```sql
CREATE INDEX IF NOT EXISTS idx_tab_groups_is_folder ON tab_groups(is_folder);
```

### 创建复合索引
```sql
CREATE INDEX IF NOT EXISTS idx_tab_groups_user_parent ON tab_groups(user_id, parent_id);
```

---

## 迁移 0012：添加 position 字段支持拖拽排序（2025-01-21）

### 添加 position 字段
```sql
ALTER TABLE tab_groups ADD COLUMN position INTEGER DEFAULT 0;
```

### 初始化现有数据的 position 值
```sql
UPDATE tab_groups
SET position = (
  SELECT COUNT(*)
  FROM tab_groups AS t2
  WHERE t2.user_id = tab_groups.user_id
    AND COALESCE(t2.parent_id, '') = COALESCE(tab_groups.parent_id, '')
    AND t2.created_at < tab_groups.created_at
);
```

### 创建 parent_position 索引
```sql
CREATE INDEX IF NOT EXISTS idx_tab_groups_parent_position ON tab_groups(parent_id, position ASC);
```

### 创建 user_parent_position 索引
```sql
CREATE INDEX IF NOT EXISTS idx_tab_groups_user_parent_position ON tab_groups(user_id, parent_id, position ASC);
```

---

## 验证迁移

执行完所有 SQL 后，可以运行以下查询验证：

### 检查表结构
```sql
PRAGMA table_info(tab_groups);
```

应该看到以下字段：
- `parent_id` (TEXT)
- `is_folder` (INTEGER)
- `position` (INTEGER)

### 检查索引
```sql
PRAGMA index_list(tab_groups);
```

应该看到以下索引：
- `idx_tab_groups_parent_id`
- `idx_tab_groups_is_folder`
- `idx_tab_groups_user_parent`
- `idx_tab_groups_parent_position`
- `idx_tab_groups_user_parent_position`

### 检查数据
```sql
SELECT id, title, parent_id, is_folder, position FROM tab_groups LIMIT 10;
```

应该看到所有记录都有 `position` 值。

---

## 常见问题

### Q: 执行 UPDATE 语句时超时怎么办？
A: 如果数据量很大，可以分批更新：
```sql
-- 先更新前 100 条
UPDATE tab_groups
SET position = (
  SELECT COUNT(*)
  FROM tab_groups AS t2
  WHERE t2.user_id = tab_groups.user_id
    AND COALESCE(t2.parent_id, '') = COALESCE(tab_groups.parent_id, '')
    AND t2.created_at < tab_groups.created_at
)
WHERE id IN (SELECT id FROM tab_groups LIMIT 100);
```

### Q: 如何回滚迁移？
A: SQLite 不支持 DROP COLUMN，如需回滚需要：
1. 创建新表（不包含新字段）
2. 复制数据
3. 删除旧表
4. 重命名新表

不建议在生产环境回滚，请在测试环境充分测试后再执行。

---

## 迁移历史

| 迁移编号 | 日期 | 描述 | 状态 |
|---------|------|------|------|
| 0011 | 2025-01-20 | 添加层级支持 | ✅ 已执行 |
| 0012 | 2025-01-21 | 添加 position 字段 | ⏳ 待执行 |

