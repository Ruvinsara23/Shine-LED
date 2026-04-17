import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const machineIdParam = searchParams.get('machineId');
    
    let machineIds: string[] = [];
    if (machineIdParam && machineIdParam !== 'All') {
      machineIds = machineIdParam.split(',').filter(Boolean);
    }

    // Use the new RPC function which accepts an array of text (empty array means "no filter")
    const { data, error } = await supabase.rpc('get_distinct_media_names_by_machine', {
      machine_ids: machineIds
    });

    if (error) throw new Error(error.message);

    // Extract the strings gracefully
    const uniqueNames = (data || []).map((row: any) => row.media_name);

    return NextResponse.json({ success: true, data: uniqueNames });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch media names" }, { status: 500 });
  }
}
