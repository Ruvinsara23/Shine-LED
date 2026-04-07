import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const machineIds = body.machineIds || [];

    // Selective wipe for specific Machine IDs
    if (machineIds.length > 0 && machineIds.length < 999999) { // Using 999999 as a lazy check if it's less than "ALL" effectively
      // We assume if they pass length > 0 it means "specific". But we need to be careful if they pass everything. 
      // Actually, if the frontend passes the matched list of all IDs, it will delete those specifically, leaving uploads alone. This is fine.
      
      const { error } = await supabase
        .from("play_log_details")
        .delete()
        .in("machine_id", machineIds);

      if (error) throw new Error("Failed to clear targeted play logs: " + error.message);
      return NextResponse.json({ success: true, message: `Cleared data for ${machineIds.length} machine(s).` });
    }

    // Total Wipe (Fallback if array is empty or "ALL" equivalent)
    const { error: error1 } = await supabase
      .from("play_log_details")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all

    if (error1) throw new Error("Failed to clear play logs: " + error1.message);

    const { error: error2 } = await supabase
      .from("play_log_uploads")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error2) throw new Error("Failed to clear upload logs: " + error2.message);

    return NextResponse.json({ success: true, message: "Entire Database wiped successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to clear DB" }, { status: 500 });
  }
}
