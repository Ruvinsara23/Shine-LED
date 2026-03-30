import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const machineId = formData.get("machineId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const parser = new XMLParser({
      ignoreAttributes: true,
      parseTagValue: true,
    });
    
    // Parse the XML
    const jsonObj = parser.parse(text);
    const playItems = jsonObj?.PlayLog?.PlayItem;
    
    if (!playItems) {
      // Record failure
      await supabase.from("play_log_uploads").insert([{
        original_file_name: file.name,
        status: "Failed",
        error_message: "Invalid plylog format: Missing PlayLog or PlayItem root",
      }]);
      return NextResponse.json({ error: "Invalid plylog format" }, { status: 400 });
    }

    // Ensure it's an array
    const itemsArray = Array.isArray(playItems) ? playItems : [playItems];

    // Map to DB insert objects
    const rows = itemsArray.map((item: any) => {
      // Parse dates safely. Plylog format: "2026/01/05 13:07:29.067" -> Convert to standard ISO Date strings
      const start = item.StartTime ? new Date(item.StartTime.replace(/\//g, "-")).toISOString() : null;
      const end = item.StopTime ? new Date(item.StopTime.replace(/\//g, "-")).toISOString() : null;

      return {
        machine_id: machineId || "UNKNOWN",
        source_file_name: file.name,
        // Direct <Name> mapping, securely removing .mp4 or other extensions
        media_name: String(item.Name || "Unknown").replace(/\.[^/.]+$/, ""),
        play_result: String(item.PlayResult || "Unknown"), // e.g., "Succeed"
        start_time: start,
        end_time: end,
        duration_text: String(item.Duration || ""),
      };
    });

    // Chunk the inserts into chunks of 1000 to avoid 'payload too large' from Supabase
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from("play_log_details").insert(chunk);
      if (error) {
        throw new Error(`Database Insert Error at chunk ${i}: ${error.message}`);
      }
    }

    // Log the successful upload in uploads table
    await supabase.from("play_log_uploads").insert([{
      original_file_name: file.name,
      status: "Success",
    }]);

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error: any) {
    console.error("Upload process error:", error);
    
    // Try recovering the file name from formData to log error, ignore if not possible
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (file) {
        await supabase.from("play_log_uploads").insert([{
          original_file_name: file.name,
          status: "Failed",
          error_message: String(error.message).slice(0, 500)
        }]);
      }
    } catch {}

    return NextResponse.json({ error: error.message || "Failed to process the log file" }, { status: 500 });
  }
}
