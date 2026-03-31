import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Harness the power of the blazing fast RPC PostgreSQL function!
    const { data, error } = await supabase.rpc('get_distinct_media_names');

    if (error) throw new Error(error.message);

    // Extract the strings gracefully
    const uniqueNames = (data || []).map((row: any) => row.media_name);

    return NextResponse.json({ success: true, data: uniqueNames });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch media names" }, { status: 500 });
  }
}
