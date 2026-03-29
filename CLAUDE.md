# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Leadership Health Pulse is a diagnostic platform built for LeadShift, a leadership development consulting firm. It consists of two products:

1. **CEO Leadership Health Pulse** — A CEO rates leadership capacity across organizational tiers (SLT, Middle Management, Frontline). The system generates an AI-powered Leadership Health Report.
2. **Manager Skills Assessment (MSA)** — Individual managers complete 20 scenario-based questions. The system scores them on two axes (Accountability & Structure vs. Support & Connection) and generates a personalized development report.

Both products share the same admin dashboard, company data model, and branded report design.

**Status:** MVP deployed and functional at `leadership-pulse.vercel.app`.

## Tech Stack

- **Frontend:** Next.js 16 (React, App Router, TypeScript)
- **Database:** Supabase (PostgreSQL with Row-Level Security)
- **Hosting:** Vercel (auto-deploys from GitHub, CLI deploys via `npx vercel --prod`)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514) — report generation with two-pass AI detection sweep
- **Email:** Resend (`onboarding@resend.dev` — domain not yet verified)
- **PDF:** html2canvas-pro + jsPDF (client-side capture of branded report containers)
- **Styling:** Tailwind CSS v4, Raleway font

## Commands

```bash
# Development
npm run dev                    # Start dev server on port 3000

# Build & Deploy
npx next build                 # Production build (check for errors)
npx vercel --prod              # Deploy to Vercel production
git push                       # Triggers auto-deploy via GitHub

# Seed demo data
npx tsx scripts/seed-msa-demo.ts              # BrightPath Financial MSA (8 managers)
npx tsx scripts/seed-demo-brightpath-survey.ts # BrightPath CEO survey

# Database
# Run SQL migrations in Supabase Dashboard > SQL Editor
# Schema files: supabase-schema.sql, supabase-manager-assessment-tables.sql, supabase-msa-migration.sql
```

## Architecture

### Database Model

`companies` is the root entity. Both products link to it:

```
companies
├── surveys (CEO diagnostic)
│   ├── survey_ratings (1-5 Likert per tier/dimension)
│   ├── survey_open_responses (text answers)
│   ├── reports (AI-generated narrative + scores)
│   └── leads (cold-path tracking)
└── manager_assessments (MSA)
    ├── manager_sessions (one per manager per attempt)
    │   └── manager_responses (quadrant_tag + a_score + c_score per scenario)
    └── manager_reports (individual + organizational)
```

### CEO Survey Architecture

Two paths based on "How many management layers?":
- **Three-tier:** SLT → Middle Management → Frontline (51 ratings + 15 open + 2 capstone = 68 inputs)
- **Two-tier:** SLT → Hybrid "Your Managers" (35 ratings + 12 open + 2 capstone = 47 inputs)

Each tier assessed across 5 dimensions: Trust, Dialogue, Ownership, Capability, Alignment.

### MSA Scoring Model

- 20 scenarios, 4 response options each (mapped to quadrants: IL, CC, OS, DA)
- Each response carries binary scores: A (1 or 2) and C (1 or 2)
- Total range: 20-40 per axis. Threshold: >30 = high
- Response options randomized per delivery (order logged)
- Screening questions (team size, remote status) and qualifying question (1:1 frequency) stored as metadata

### Four Quadrants

- **Intentional Leadership** (high A + high C) — the goal
- **Command & Control** (high A + low C) — results without people development
- **Overly Supportive** (low A + high C) — relationships without accountability
- **Disengaged & Absent** (low A + low C) — not actively managing

### Report Generation Pipeline

All three report types follow the same pattern:
1. Build data summary from database (scores, patterns, screening data)
2. Send to Claude with detailed system prompt (voice, rules, banned patterns)
3. Parse JSON response
4. **AI Detection Sweep** (second Claude call) — catches AI language, em-dashes, template phrases, blame language
5. Save cleaned report to database

### Report Voice Rules (apply to all report types)

- Write like a senior consultant, not AI
- Never mention ELITE5, scoring terminology, or axis values in output
- Never use em-dashes (commas, semicolons, periods instead)
- Never use "It's not X, it's Y" constructions
- Never use hollow intensifiers (innovative, leverage, delve, etc.)
- CEO reports: frame problems as organizational dynamics, not personal blame
- Manager reports: developmental tone, never judgmental
- Use the respondent's own language as foundation, not decoration

## Brand

- **Primary:** #101d51 (deep navy)
- **Background:** #f3f3f3 (light gray)
- **Accent 1:** #EA0C67 (magenta — alerts, gaps, CTAs)
- **Accent 2:** #007efa (blue — strengths, positive indicators)
- **Amber:** #F5A623 (mixed/moderate indicators)
- **Font:** Raleway
- **Logo:** `public/leadshift-logo.svg` (navy) and `public/leadshift-logo-white.svg` (white)
- Reports use `BrandedReport` component (`src/components/branded-report.tsx`) with logos embedded as base64 data URIs for html2canvas compatibility

## Key Files

| Area | Files |
|------|-------|
| CEO survey intake | `src/app/survey/page.tsx` |
| CEO survey questions | `src/app/survey/[id]/page.tsx` |
| CEO report generation | `src/app/api/generate-report/route.ts` |
| CEO report display | `src/app/report/[id]/page.tsx` |
| MSA scenarios + scoring map | `src/lib/manager-questions.ts` |
| MSA scoring engine | `src/lib/quadrant-scoring.ts` |
| MSA survey UI | `src/app/assess/[slug]/[id]/page.tsx` |
| MSA report generation | `src/app/api/assess/[id]/generate-report/route.ts` |
| MSA org report | `src/app/api/assess/org-report/route.ts` |
| Scatter plot | `src/components/scatter-plot.tsx` |
| Branded report shell | `src/components/branded-report.tsx` |
| PDF generation | `src/lib/generate-pdf.ts` |
| Admin layout | `src/app/admin/layout.tsx` |
| Admin companies home | `src/app/admin/page.tsx` |
| Admin company detail | `src/app/admin/companies/[id]/page.tsx` |
| Admin session detail | `src/app/admin/assessments/[id]/[sessionId]/page.tsx` |

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anonymous key
ANTHROPIC_API_KEY             — Claude API key
RESEND_API_KEY                — Resend email API key
LEADSHIFT_NOTIFICATION_EMAIL  — josh@leadshift.com
DEBRIEF_BOOKING_URL           — https://mysig.io/9873O1O8
```

@AGENTS.md

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
