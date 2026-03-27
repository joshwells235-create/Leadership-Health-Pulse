-- ============================================
-- Manager Assessment Tables for LeadShift Platform
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================

-- 1. Manager Assessments (company-level setup)
-- One record per company assessment deployment
CREATE TABLE manager_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'ELITE5 Management Assessment',
  slug TEXT NOT NULL UNIQUE,
  created_by TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Manager Sessions (one per manager per assessment attempt)
CREATE TABLE manager_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES manager_assessments(id) ON DELETE CASCADE,
  respondent_name TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  respondent_title TEXT,
  pi_profile TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  quadrant TEXT CHECK (quadrant IN ('intentional', 'command_control', 'overly_supportive', 'absent')),
  x_score REAL,
  y_score REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 3. Manager Responses (individual question answers)
CREATE TABLE manager_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES manager_sessions(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  axis TEXT NOT NULL CHECK (axis IN ('accountability', 'supportiveness'))
);

-- 4. Manager Reports (individual + organizational)
CREATE TABLE manager_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES manager_sessions(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES manager_assessments(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('individual', 'organizational')),
  generated_content JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Benchmarks (aggregate data, built over time)
CREATE TABLE benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_responses INTEGER NOT NULL DEFAULT 0,
  dimension_averages JSONB DEFAULT '{}',
  quadrant_distribution JSONB DEFAULT '{}',
  percentiles JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_manager_sessions_assessment ON manager_sessions(assessment_id);
CREATE INDEX idx_manager_sessions_email ON manager_sessions(respondent_email);
CREATE INDEX idx_manager_responses_session ON manager_responses(session_id);
CREATE INDEX idx_manager_reports_session ON manager_reports(session_id);
CREATE INDEX idx_manager_reports_assessment ON manager_reports(assessment_id);
CREATE INDEX idx_manager_assessments_slug ON manager_assessments(slug);
CREATE INDEX idx_manager_assessments_company ON manager_assessments(company_id);

-- ============================================
-- Row Level Security (allow service role full access)
-- ============================================
ALTER TABLE manager_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;

-- Allow anon (for managers taking the assessment) to insert and read their own data
CREATE POLICY "Allow anon to read active assessments" ON manager_assessments
  FOR SELECT USING (status = 'active');

CREATE POLICY "Allow anon to insert sessions" ON manager_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to read own session" ON manager_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow anon to update own session" ON manager_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Allow anon to insert responses" ON manager_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to read responses" ON manager_responses
  FOR SELECT USING (true);

CREATE POLICY "Allow anon to read reports" ON manager_reports
  FOR SELECT USING (true);

CREATE POLICY "Allow anon to insert reports" ON manager_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to read benchmarks" ON benchmarks
  FOR SELECT USING (true);

-- Allow authenticated (admin) full access
CREATE POLICY "Allow authenticated full access to assessments" ON manager_assessments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to sessions" ON manager_sessions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to responses" ON manager_responses
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to reports" ON manager_reports
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to benchmarks" ON benchmarks
  FOR ALL USING (auth.role() = 'authenticated');
