import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    let currentPage = 0;
    const CHUNK_SIZE = 1000;
    const uniqueIds = new Set<string>();

    while (true) {
      const { data, error } = await supabase
        .from("play_log_details")
        .select("machine_id")
        .range(currentPage * CHUNK_SIZE, (currentPage + 1) * CHUNK_SIZE - 1);

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;

      // Deduplicate into the active set
      data.forEach(d => {
        if (d.machine_id && d.machine_id.trim() !== '') uniqueIds.add(d.machine_id);
      });

      if (data.length < CHUNK_SIZE) break;
      currentPage++;
    }

    const sortedIds = Array.from(uniqueIds).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ success: true, data: sortedIds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch machine IDs" }, { status: 500 });
  }
}
