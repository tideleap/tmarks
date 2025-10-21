# Database Migrations

D1 数据库迁移脚本目录。

## 迁移文件命名规范

`XXXX_description.sql`

- `XXXX`: 4位数字序号，从 0001 开始
- `description`: 迁移描述，使用下划线分隔

## 运行迁移

### 本地开发环境

```bash
# 应用所有待迁移
npm run db:migrate:local

# 或使用 wrangler 命令
wrangler d1 migrations apply tmarks-db --local
```

### 生产环境

```bash
# 应用所有待迁移
npm run db:migrate

# 或使用 wrangler 命令
wrangler d1 migrations apply tmarks-db
```

## 创建 D1 数据库

首次使用需要创建 D1 数据库实例：

```bash
# 创建数据库
wrangler d1 create tmarks-db

# 将返回的 database_id 填入 wrangler.toml
```

## 注意事项

1. 迁移文件一旦应用到生产环境，不应再修改
2. 新的数据库变更应创建新的迁移文件
3. SQLite 不支持某些 ALTER TABLE 操作，需要通过创建新表、复制数据、删除旧表的方式进行
4. 使用 `deleted_at` 实现软删除，避免物理删除数据
5. 所有时间字段使用 ISO 8601 格式的 TEXT 类型

## Cloudflare 控制台手动执行 SQL

若需在 Cloudflare D1 控制台手动执行迁移，可逐条运行以下语句：

```sql
-- 0004_add_tag_layout_to_preferences.sql
ALTER TABLE user_preferences
ADD COLUMN tag_layout TEXT NOT NULL DEFAULT 'grid';

-- 0005_enable_public_sharing.sql
ALTER TABLE bookmarks ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users ADD COLUMN public_share_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN public_slug TEXT;
ALTER TABLE users ADD COLUMN public_page_title TEXT;
ALTER TABLE users ADD COLUMN public_page_description TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_slug
  ON users(public_slug)
  WHERE public_slug IS NOT NULL;

-- 0011_add_tab_groups_hierarchy.sql (2025-01-20)
-- 添加无限层级文件夹支持
ALTER TABLE tab_groups ADD COLUMN parent_id TEXT DEFAULT NULL;
ALTER TABLE tab_groups ADD COLUMN is_folder INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_tab_groups_parent_id ON tab_groups(parent_id);
CREATE INDEX IF NOT EXISTS idx_tab_groups_is_folder ON tab_groups(is_folder);
CREATE INDEX IF NOT EXISTS idx_tab_groups_user_parent ON tab_groups(user_id, parent_id);

-- 0012_add_tab_groups_position.sql (2025-01-21)
-- 添加 position 字段支持拖拽排序
ALTER TABLE tab_groups ADD COLUMN position INTEGER DEFAULT 0;
UPDATE tab_groups
SET position = (
  SELECT COUNT(*)
  FROM tab_groups AS t2
  WHERE t2.user_id = tab_groups.user_id
    AND COALESCE(t2.parent_id, '') = COALESCE(tab_groups.parent_id, '')
    AND t2.created_at < tab_groups.created_at
);
CREATE INDEX IF NOT EXISTS idx_tab_groups_parent_position ON tab_groups(parent_id, position ASC);
CREATE INDEX IF NOT EXISTS idx_tab_groups_user_parent_position ON tab_groups(user_id, parent_id, position ASC);
```

> 提示：控制台不支持一次性粘贴多条语句，可按顺序逐条执行。

## 使用 wrangler CLI 执行单个迁移文件

如果需要单独执行某个迁移文件（而不是通过 migrations apply）：

```bash
# 本地数据库
wrangler d1 execute tmarks-prod-db --file=./migrations/0011_add_tab_groups_hierarchy.sql
wrangler d1 execute tmarks-prod-db --file=./migrations/0012_add_tab_groups_position.sql

# 远程生产数据库
wrangler d1 execute tmarks-prod-db --remote --file=./migrations/0011_add_tab_groups_hierarchy.sql
wrangler d1 execute tmarks-prod-db --remote --file=./migrations/0012_add_tab_groups_position.sql
```

> 注意：`tmarks-prod-db` 是 wrangler.toml 中配置的数据库名称。
