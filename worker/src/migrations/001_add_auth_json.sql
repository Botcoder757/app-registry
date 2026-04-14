-- Migration: Add auth_json column to apps table
-- Applied: 2026-04-15

ALTER TABLE apps ADD COLUMN auth_json TEXT;
