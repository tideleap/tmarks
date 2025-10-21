-- Migration: Add hierarchy support to tab groups
-- Created: 2025-01-20
-- Description: Add parent_id and is_folder fields to support unlimited nesting

-- Add parent_id column to support hierarchy
ALTER TABLE tab_groups ADD COLUMN parent_id TEXT DEFAULT NULL;

-- Add is_folder column to distinguish folders from regular groups
ALTER TABLE tab_groups ADD COLUMN is_folder INTEGER DEFAULT 0;

-- Create index for parent_id to optimize tree queries
CREATE INDEX IF NOT EXISTS idx_tab_groups_parent_id ON tab_groups(parent_id);

-- Create index for folder queries
CREATE INDEX IF NOT EXISTS idx_tab_groups_is_folder ON tab_groups(is_folder);

-- Create composite index for user + parent queries
CREATE INDEX IF NOT EXISTS idx_tab_groups_user_parent ON tab_groups(user_id, parent_id);

