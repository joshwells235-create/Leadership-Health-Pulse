-- Phase 2 Migration: Admin Dashboard Support
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. ASSESSMENT TYPES TABLE
-- Supports multiple assessment types in the future
-- ============================================
CREATE TABLE assessment_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the Leadership Health Pulse as the first assessment type
INSERT INTO assessment_types (slug, name, description)
VALUES (
  'leadership-pulse',
  'Leadership Health Pulse',
  'A diagnostic survey tool that assesses leadership capacity across organizational tiers.'
);

-- Enable RLS
ALTER TABLE assessment_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON assessment_types FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 2. ADD assessment_type_id TO SURVEYS
-- Links each survey to its assessment type
-- ============================================
ALTER TABLE surveys ADD COLUMN assessment_type_id UUID REFERENCES assessment_types(id);

-- Backfill existing surveys with the Leadership Health Pulse type
UPDATE surveys
SET assessment_type_id = (SELECT id FROM assessment_types WHERE slug = 'leadership-pulse');

-- ============================================
-- 3. ADD REPORT FORMAT AND VERSIONING TO REPORTS
-- Supports multiple report formats and regeneration
-- ============================================
ALTER TABLE reports ADD COLUMN report_format TEXT NOT NULL DEFAULT 'full'
  CHECK (report_format IN ('full', 'summary', 'team'));
ALTER TABLE reports ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE reports ADD COLUMN generated_by TEXT DEFAULT 'system';

-- ============================================
-- 4. ADD NOTES TO LEADS TABLE
-- Already has notes column from initial schema, just verify
-- ============================================

-- ============================================
-- 5. INDEX for performance
-- ============================================
CREATE INDEX idx_surveys_assessment_type ON surveys(assessment_type_id);
CREATE INDEX idx_reports_format ON reports(report_format);
CREATE INDEX idx_reports_version ON reports(version);
