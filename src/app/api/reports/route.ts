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
    const isExport = searchParams.get('exportAll') === 'true';

    // Base query builder
    const buildQuery = (q: any) => {
      if (startDate) q = q.gte('start_time', `${startDate}T00:00:00.000Z`);
      if (endDate) q = q.lte('start_time', `${endDate}T23:59:59.999Z`);
      if (name && name !== 'All') q = q.eq('media_name', name);
      if (machineId && machineId !== 'All') q = q.eq('machine_id', machineId);
      if (resultStatus && resultStatus !== 'All') q = q.eq('play_result', resultStatus);
      return q.order('start_time', { ascending: true }); // ASCENDING ORDER ADDED
    };

    if (isExport) {
      // FULL DATABASE EXPORT LOOP (Bypasses Supabase 1000 clamp)
      let allData: any[] = [];
      let currentPage = 0;
      const CHUNK_SIZE = 1000;
      
      while (true) {
        let exportQuery = buildQuery(supabase.from("play_log_details").select("*"));
        exportQuery = exportQuery.range(currentPage * CHUNK_SIZE, (currentPage + 1) * CHUNK_SIZE - 1);
        
        const { data: chunk, error } = await exportQuery;
        if (error) throw new Error(error.message);
        
        if (!chunk || chunk.length === 0) break;
        allData = allData.concat(chunk);
        
        if (chunk.length < CHUNK_SIZE) break;
        currentPage++;
      }
      return NextResponse.json({ data: allData, totalCount: allData.length });
    } else {
      // PAGINATION VIEW
      let query = buildQuery(supabase.from("play_log_details").select("*", { count: "exact" }));
      query = query.range(startOffset, endOffset);
      
      const { data, count, error } = await query;
      if (error) throw new Error(error.message);

      return NextResponse.json({
        data,
        totalCount: count,
        page,
        limit: limitParams
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch reports" }, { status: 500 });
  }
}
