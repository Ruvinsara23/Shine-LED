import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const name = searchParams.get('name');
    const resultStatus = searchParams.get('resultStatus'); // "Succeed" vs ""
    
    // Page constraints
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const startOffset = (page - 1) * limit;
    const endOffset = startOffset + limit - 1;

    let query = supabase
      .from("play_log_details")
      .select("*", { count: "exact" });

    // Date Filters
    if (startDate) {
      query = query.gte('start_time', `${startDate}T00:00:00.000Z`);
    }
    
    if (endDate) {
      query = query.lte('start_time', `${endDate}T23:59:59.999Z`);
    }

    // Name Filter
    if (name && name !== 'All') {
      query = query.eq('media_name', name);
    }

    // Result Filter
    if (resultStatus && resultStatus !== 'All') {
      query = query.eq('play_result', resultStatus);
    }

    // Export or pagination
    const isExport = searchParams.get('exportAll') === 'true';

    // Finalize query
    query = query.order('start_time', { ascending: false });
    
    if (!isExport) {
      query = query.range(startOffset, endOffset);
    } else {
      query = query.limit(50000); // Safety cap for export
    }

    const { data, count, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      data,
      totalCount: count,
      page,
      limit
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch reports" }, { status: 500 });
  }
}
