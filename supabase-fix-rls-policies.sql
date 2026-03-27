-- Additional RLS policies needed for admin operations via anon key
-- Run this in Supabase SQL Editor after the initial table creation

-- Allow anon to delete assessments (admin uses anon key server-side)
CREATE POLICY "Allow anon to delete assessments" ON manager_assessments
  FOR DELETE USING (true);

-- Allow anon to update assessments
CREATE POLICY "Allow anon to update assessments" ON manager_assessments
  FOR UPDATE USING (true);

-- Allow anon to delete sessions
CREATE POLICY "Allow anon to delete sessions" ON manager_sessions
  FOR DELETE USING (true);

-- Allow anon to delete responses (cascade from session delete)
CREATE POLICY "Allow anon to delete responses" ON manager_responses
  FOR DELETE USING (true);

-- Allow anon to read, insert, update, delete reports
CREATE POLICY "Allow anon to update reports" ON manager_reports
  FOR UPDATE USING (true);

CREATE POLICY "Allow anon to delete reports" ON manager_reports
  FOR DELETE USING (true);

-- Allow anon to update benchmarks
CREATE POLICY "Allow anon to update benchmarks" ON benchmarks
  FOR UPDATE USING (true);

CREATE POLICY "Allow anon to insert benchmarks" ON benchmarks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to delete benchmarks" ON benchmarks
  FOR DELETE USING (true);
