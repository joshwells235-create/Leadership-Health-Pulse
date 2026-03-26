-- Leadership Health Pulse - Database Schema
-- Run this in your Supabase SQL Editor (see instructions below)

-- ============================================
-- 1. COMPANIES TABLE
-- Stores company information from the intake form
-- ============================================
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  employee_count_range TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. SURVEYS TABLE
-- One row per survey session (one CEO taking the diagnostic)
-- ============================================
CREATE TABLE surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  respondent_name TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  survey_path TEXT NOT NULL DEFAULT 'three_tier' CHECK (survey_path IN ('two_tier', 'three_tier')),
  capstone_one_response TEXT,
  capstone_two_response TEXT,
  source TEXT NOT NULL DEFAULT 'cold' CHECK (source IN ('warm', 'cold')),
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 3. SURVEY RATINGS TABLE
-- Stores every 1-5 rating answer (51 ratings for a full 3-tier survey)
-- ============================================
CREATE TABLE survey_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('slt', 'middle', 'frontline', 'hybrid')),
  dimension TEXT NOT NULL CHECK (dimension IN ('trust', 'dialogue', 'ownership', 'capability', 'alignment')),
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. SURVEY OPEN RESPONSES TABLE
-- Stores open-ended text answers (one per dimension per tier)
-- ============================================
CREATE TABLE survey_open_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('slt', 'middle', 'frontline', 'hybrid')),
  dimension TEXT NOT NULL CHECK (dimension IN ('trust', 'dialogue', 'ownership', 'capability', 'alignment')),
  prompt_text TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. REPORTS TABLE
-- Stores the generated report content and scores
-- ============================================
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  overall_score DECIMAL(3,2),
  tier_scores JSONB,
  dimension_scores JSONB,
  generated_content JSONB,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. LEADS TABLE
-- Tracks cold-path leads for LeadShift follow-up
-- ============================================
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_surveys_company_id ON surveys(company_id);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_survey_ratings_survey_id ON survey_ratings(survey_id);
CREATE INDEX idx_survey_open_responses_survey_id ON survey_open_responses(survey_id);
CREATE INDEX idx_reports_survey_id ON reports(survey_id);
CREATE INDEX idx_leads_status ON leads(status);

-- ============================================
-- ROW LEVEL SECURITY
-- For MVP, allow all operations from the app.
-- We'll tighten this in Phase 2 when auth is added.
-- ============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_open_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies: allow all operations using the anon key (MVP)
CREATE POLICY "Allow all access" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON surveys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON survey_ratings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON survey_open_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON leads FOR ALL USING (true) WITH CHECK (true);
