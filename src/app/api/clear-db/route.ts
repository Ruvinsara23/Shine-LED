import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    // Delete all rows in play_log_details using a condition that matches everything
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

    return NextResponse.json({ success: true, message: "Database wiped successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to clear DB" }, { status: 500 });
  }
}
