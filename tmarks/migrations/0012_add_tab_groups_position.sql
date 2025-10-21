-- ============================================================================
-- Migration: Add position field to tab_groups for ordering
-- Created: 2025-01-21
-- Description: Add position field to support drag-and-drop reordering within the same parent
-- ============================================================================

-- Step 1: Add position column to tab_groups
-- Default value is 0 for new records
ALTER TABLE tab_groups ADD COLUMN position INTEGER DEFAULT 0;

-- Step 2: Initialize position values based on created_at (older items get lower positions)
-- This ensures existing data has proper position values
-- For each group, count how many siblings were created before it
UPDATE tab_groups
SET position = (
  SELECT COUNT(*)
  FROM tab_groups AS t2
  WHERE t2.user_id = tab_groups.user_id
    AND COALESCE(t2.parent_id, '') = COALESCE(tab_groups.parent_id, '')
    AND t2.created_at < tab_groups.created_at
);

-- Step 3: Create composite index for efficient ordering queries
-- This index is used when querying groups by parent_id and ordering by position
CREATE INDEX IF NOT EXISTS idx_tab_groups_parent_position ON tab_groups(parent_id, position ASC);

-- Step 4: Create composite index for user + parent + position queries
-- This index is used when querying a user's groups within a specific parent
CREATE INDEX IF NOT EXISTS idx_tab_groups_user_parent_position ON tab_groups(user_id, parent_id, position ASC);

-- ============================================================================
-- Verification Queries (for testing, not executed automatically)
-- ============================================================================
-- Check table structure:
--   PRAGMA table_info(tab_groups);
--
-- Check indexes:
--   PRAGMA index_list(tab_groups);
--
-- Check data:
--   SELECT id, title, parent_id, position FROM tab_groups ORDER BY parent_id, position LIMIT 20;
-- ============================================================================

