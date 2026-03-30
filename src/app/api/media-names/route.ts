import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Fetch a large pool of media names to find the distinct ones.
    // In extremely large datasets, an RPC or Database View is recommended.
    const { data, error } = await supabase
      .from("play_log_details")
      .select("media_name")
      .order("uploaded_at", { ascending: false })
      .limit(15000);

    if (error) {
      throw new Error(error.message);
    }

    // Deduplicate using a Set
    const uniqueNames = Array.from(new Set(data.map(d => d.media_name)));
    
    // Sort alphabetically for the dropdown
    uniqueNames.sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      data: uniqueNames
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch media names" }, { status: 500 });
  }
}
