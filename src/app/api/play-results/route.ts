import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase.rpc('get_distinct_play_results');

    if (error) throw new Error(error.message);

    const outcomes = (data || []).map((row: any) => row.play_result);

    return NextResponse.json({ success: true, data: outcomes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch outcomes" }, { status: 500 });
  }
}
