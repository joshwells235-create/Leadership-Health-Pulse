import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase } = auth;
  const { searchParams } = new URL(request.url);

  // Filters
  const search = searchParams.get("search") || "";
  const source = searchParams.get("source") || "";
  const status = searchParams.get("status") || "";
  const employeeRange = searchParams.get("employeeRange") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 20;

  // Build query
  let query = supabase
    .from("surveys")
    .select("*, companies(*), reports(id, overall_score, report_format, version)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status) {
    query = query.eq("status", status);
  }
  if (source) {
    query = query.eq("source", source);
  }
  if (search) {
    query = query.or(`respondent_name.ilike.%${search}%,respondent_email.ilike.%${search}%`);
  }

  const { data: surveys, error, count } = await query;

  if (error) {
    console.error("Surveys fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch surveys" }, { status: 500 });
  }

  // Filter by employee range (company field, needs post-filter since it's a join)
  let filtered = surveys || [];
  if (employeeRange) {
    filtered = filtered.filter(
      (s: Record<string, unknown>) => {
        const company = s.companies as Record<string, unknown> | null;
        return company?.employee_count_range === employeeRange;
      }
    );
  }

  return NextResponse.json({
    surveys: filtered,
    total: count || 0,
    page,
    pageSize,
  });
}
