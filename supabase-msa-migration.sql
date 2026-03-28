-- ============================================
-- Migration: ELITE5 Likert → MSA Scenario-Based Assessment
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================

-- 1. Add screening/qualifying columns to manager_sessions
ALTER TABLE manager_sessions ADD COLUMN IF NOT EXISTS direct_reports integer;
ALTER TABLE manager_sessions ADD COLUMN IF NOT EXISTS team_type text;
ALTER TABLE manager_sessions ADD COLUMN IF NOT EXISTS one_on_one_frequency text;

-- 2. Add scenario-based columns to manager_responses
-- (keeping old columns temporarily for backward compat)
ALTER TABLE manager_responses ALTER COLUMN rating DROP NOT NULL;
ALTER TABLE manager_responses ALTER COLUMN axis DROP NOT NULL;
ALTER TABLE manager_responses ADD COLUMN IF NOT EXISTS quadrant_tag text;
ALTER TABLE manager_responses ADD COLUMN IF NOT EXISTS a_score integer;
ALTER TABLE manager_responses ADD COLUMN IF NOT EXISTS c_score integer;
ALTER TABLE manager_responses ADD COLUMN IF NOT EXISTS display_order jsonb;

-- 3. Update default assessment name
ALTER TABLE manager_assessments ALTER COLUMN name SET DEFAULT 'Manager Skills Assessment';

-- 4. Delete old demo data (will be re-seeded with scenario-based responses)
-- Delete responses, reports, sessions for all existing assessments
DELETE FROM manager_reports;
DELETE FROM manager_responses;
DELETE FROM manager_sessions;
DELETE FROM manager_assessments;
-- Delete orphaned companies that only had manager assessments
-- (Keep companies that also have CEO surveys)
DELETE FROM companies WHERE id NOT IN (
  SELECT DISTINCT company_id FROM surveys
) AND id NOT IN (
  SELECT DISTINCT company_id FROM manager_assessments
);
