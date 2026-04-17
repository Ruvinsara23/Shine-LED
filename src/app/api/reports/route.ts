import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const name = searchParams.get('name');
    const machineId = searchParams.get('machineId');
    const resultStatus = searchParams.get('resultStatus'); 
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limitParams = parseInt(searchParams.get('limit') || '50', 10);
    const startOffset = (page - 1) * limitParams;
    const endOffset = startOffset + limitParams - 1;

    let query = supabase.from("play_log_details").select("*", { count: "exact" });
    
    if (startDate) query = query.gte('start_time', `${startDate}T00:00:00.000Z`);
    if (endDate) query = query.lte('start_time', `${endDate}T23:59:59.999Z`);
    
    // Convert comma-separated string to array and use .in() filter
    if (name && name !== 'All') {
      const nameArr = name.split(',').filter(Boolean);
      if (nameArr.length > 0) query = query.in('media_name', nameArr);
    }
    
    if (machineId && machineId !== 'All') {
      const machineArr = machineId.split(',').filter(Boolean);
      if (machineArr.length > 0) query = query.in('machine_id', machineArr);
    }
    
    if (resultStatus && resultStatus !== 'All') query = query.eq('play_result', resultStatus);    
    query = query.order('start_time', { ascending: true }); // ASCENDING ORDER
    query = query.range(startOffset, endOffset);
      
    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({
      data,
      totalCount: count,
      page,
      limit: limitParams
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch reports" }, { status: 500 });
  }
}
