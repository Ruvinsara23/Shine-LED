import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase.rpc('get_distinct_machine_ids');

    if (error) throw new Error(error.message);

    const uniqueIds = (data || []).map((row: any) => row.machine_id);

    return NextResponse.json({ success: true, data: uniqueIds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch machine IDs" }, { status: 500 });
  }
}
