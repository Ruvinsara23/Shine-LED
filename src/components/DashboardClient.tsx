'use client'

import { useState, useEffect } from "react"
import Papa from "papaparse"
import { UploadCloud, Download, FileText, ChevronLeft, ChevronRight, Activity, CalendarDays, MonitorPlay, Search, BarChart3, Settings2, Trash2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MultiSelect } from "@/components/MultiSelect"

export default function DashboardClient() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [uploadResults, setUploadResults] = useState<{name: string, status: string}[]>([])

  const [machineId, setMachineId] = useState("")

  // Filters & Pagination
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filterMediaNames, setFilterMediaNames] = useState<string[]>([])
  const [resultStatus, setResultStatus] = useState("All")
  const [page, setPage] = useState(1)
  const [limit] = useState(50)

  const [availableNames, setAvailableNames] = useState<string[]>([])
  const [availableMachineIds, setAvailableMachineIds] = useState<string[]>([])
  const [availableOutcomes, setAvailableOutcomes] = useState<string[]>([]) // NEW
  const [filterMachineIds, setFilterMachineIds] = useState<string[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  
  // Export tracking
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<{done: number, total: number} | null>(null) // NEW
  
  const [totalCount, setTotalCount] = useState(0)
  
  const [activeTab, setActiveTab] = useState("analytics")

  // Fetch Initial Dropdown Metadata
  useEffect(() => {
    fetch("/api/machine-ids")
      .then(res => res.json())
      .then(d => { if (d.success) setAvailableMachineIds(d.data) })
      .catch(() => {})
      
    fetch("/api/play-results")
      .then(res => res.json())
      .then(d => { if (d.success) setAvailableOutcomes(d.data) })
      .catch(() => {})
  }, [])

  // Cascading update: Fetch Media Names when selected Machine IDs change
  useEffect(() => {
    const machineIdsParam = filterMachineIds.length > 0 ? filterMachineIds.join(',') : 'All';
    fetch(`/api/media-names?machineId=${machineIdsParam}`)
      .then(res => res.json())
      .then(d => { if (d.success) setAvailableNames(d.data) })
      .catch(() => {})
  }, [filterMachineIds])

  // Helper to ensure XML Date perfectly mirrors original source 
  // without browser timezone shifts or messy milliseconds
  const formatExactDate = (isoString: string) => {
    if (!isoString) return "";
    // e.g. "2026-02-25T07:04:21.613+00:00" -> "2026-02-25 07:04:21"
    const cleaned = isoString.split('.')[0].split('+')[0].split('Z')[0];
    return cleaned.replace('T', ' ').replace(/-/g, '/');
  }

  // Automatically fetch reports when page changes
  useEffect(() => {
    if (activeTab === "analytics") {
        handlePreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeTab]) 

  // Upload Logic
  const handleBulkUpload = async () => {
    if (files.length === 0) return alert("Select files first!")
    setUploading(true)
    setProgress({ done: 0, total: files.length })
    const results = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append("file", file)
      formData.append("machineId", machineId)
      
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData
        })
        const data = await res.json()
        if (data.success) {
          results.push({ name: file.name, status: `Success (${data.count} items)` })
        } else {
          results.push({ name: file.name, status: `Failed: ${data.error}` })
        }
      } catch (err: any) {
        results.push({ name: file.name, status: `Error: ${err.message}` })
      }
      setProgress({ done: i + 1, total: files.length })
      setUploadResults([...results])
    }
    setUploading(false)
    setFiles([])
    
    // Re-fetch media names and machine ids just in case new ones appeared
    fetch("/api/media-names")
      .then(res => res.json())
      .then(d => { if (d.success) setAvailableNames(d.data) })
      
    fetch("/api/machine-ids")
      .then(res => res.json())
      .then(d => { if (d.success) setAvailableMachineIds(d.data) })
      
    setPage(1)
  }

  // Clear DB
  const handleClearDB = async () => {
    if (!confirm("Are you absolutely sure you want to completely erase the database? This cannot be undone!")) return;
    try {
      const res = await fetch("/api/clear-db", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        alert("Database cleared successfully!");
        setReports([]);
        setTotalCount(0);
        setAvailableNames([]);
      } else {
        alert(json.error || "Failed to clear DB");
      }
    } catch {
      alert("Failed to clear DB due to a network error.");
    }
  }

  // Fetch Logic
  const handlePreview = async () => {
    setLoadingReports(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (filterMediaNames.length > 0 && filterMediaNames.length < availableNames.length) params.append("name", filterMediaNames.join(','))
      if (filterMachineIds.length > 0 && filterMachineIds.length < availableMachineIds.length) params.append("machineId", filterMachineIds.join(','))
      if (resultStatus && resultStatus !== "All") params.append("resultStatus", resultStatus)
      params.append("page", page.toString())
      params.append("limit", limit.toString())

      const res = await fetch(`/api/reports?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setReports(json.data || [])
        setTotalCount(json.totalCount || 0)
      } else {
        alert(json.error)
      }
    } catch (e: any) {
      alert("Failed to fetch reports")
    }
    setLoadingReports(false)
  }

  // Export Full CSV Logic (Client-Side Streamer)
  const exportCSV = async () => {
    if (totalCount === 0) return alert("NO DATA TO EXPORT.")
    setExporting(true)
    setExportProgress({ done: 0, total: totalCount })
    
    try {
      let currentPage = 1;
      const CHUNK_SIZE = 900;
      let allCsvData: any[] = [];
      
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (filterMediaNames.length > 0 && filterMediaNames.length < availableNames.length) params.append("name", filterMediaNames.join(','))
      if (filterMachineIds.length > 0 && filterMachineIds.length < availableMachineIds.length) params.append("machineId", filterMachineIds.join(','))
      if (resultStatus && resultStatus !== "All") params.append("resultStatus", resultStatus)
      params.append("limit", CHUNK_SIZE.toString())

      while (true) {
        params.set("page", currentPage.toString())
        const res = await fetch(`/api/reports?${params.toString()}`)
        const json = await res.json()
        
        if (!res.ok) throw new Error(json.error)
        
        const chunk = json.data || []
        if (chunk.length === 0) break;
        
        const formattedChunk = chunk.map((r: any) => ({
          "Media Name": r.media_name,
          // Prepend tab or space to prevent Excel from auto-formatting into local short-date
          "Start Time": "\t" + formatExactDate(r.start_time),
          "End Time": "\t" + formatExactDate(r.end_time),
          "Duration": r.duration_text,
          "Result": r.play_result === 'Succeed' ? 'SUCCESS' : 'FAILED',
          "Machine ID": r.machine_id
        }))
        
        allCsvData = allCsvData.concat(formattedChunk)
        setExportProgress({ done: allCsvData.length, total: totalCount })
        
        if (chunk.length < CHUNK_SIZE) break;
        currentPage++;
      }
      
      const headerLines = [
        ["Play Log Report", "", "", "", "", ""],
        ["Media Name", "Start Time", "End Time", "Duration", "Result", "Machine ID"]
      ]
      
      const parsedCsvData = Papa.unparse(allCsvData, { header: false })
      const headerCsv = Papa.unparse(headerLines)
      const finalCsv = headerCsv + "\n" + parsedCsvData

      // Generate secure client-side download Blob
      const blob = new Blob([finalCsv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `PlayLog_${new Date().getTime()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (err: any) {
      alert("Failed to export: " + err.message)
    }
    setExporting(false)
    setExportProgress(null)
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="flex-1 space-y-4 pt-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-black uppercase">Shine LED</h2>
          <p className="text-black font-semibold text-lg mt-1 border-b-2 border-dashed border-black inline-block">
            Data Analytics Dashboard
          </p>
        </div>
        
        {/* Top Actions */}
        <div className="flex items-center space-x-4">
          <Button 
            onClick={handleClearDB} 
            className="h-12 border-2 border-black bg-[#ff90e8] hover:bg-[#ff90e8]/80 text-black font-black uppercase tracking-wider shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all rounded-none" 
            variant="default"
          >
            <Trash2 className="mr-2 h-5 w-5" />
            CLEAR DATA
          </Button>

          {activeTab === "analytics" && (
            <Button 
              onClick={exportCSV} 
              disabled={totalCount === 0 || exporting} 
              className="h-12 border-2 border-black bg-[#ffc900] hover:bg-[#ffc900]/80 text-black font-black uppercase tracking-wider shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all rounded-none" 
              variant="default"
            >
              <Download className="mr-2 h-5 w-5" />
              {exporting && exportProgress 
                ? `Exporting: ${(exportProgress.done).toLocaleString()} / ${(exportProgress.total).toLocaleString()}` 
                : "Download Full CSV"}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b-4 border-black pb-0 mb-8 h-auto flex space-x-2 w-full md:w-[600px]">
          <TabsTrigger value="analytics" className="flex-1 rounded-t-lg rounded-b-none border-2 border-b-0 border-black bg-[#fffdf7] text-black text-lg uppercase font-black data-[state=active]:bg-[#ff90e8] data-[state=active]:shadow-none py-3 px-6 -mb-[4px] relative z-10">
            <BarChart3 className="w-5 h-5 mr-3" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 rounded-t-lg rounded-b-none border-2 border-b-0 border-black bg-[#fffdf7] text-black text-lg uppercase font-black data-[state=active]:bg-[#ffc900] data-[state=active]:shadow-none py-3 px-6 -mb-[4px] relative z-10">
            <UploadCloud className="w-5 h-5 mr-3" />
            Upload
          </TabsTrigger>
        </TabsList>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-8 outline-none z-0">
          
          {/* Filter Bar */}
          <Card className="shadow-[8px_8px_0_0_#000] rounded-none border-4 border-black bg-white">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-end gap-6 bg-white">
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="space-y-2 relative z-50">
                  <Label className="text-sm font-black text-black uppercase tracking-widest pl-1">Media Identity</Label>
                  <MultiSelect
                    placeholder="Target Media"
                    icon={<Search className="h-5 w-5" />}
                    options={availableNames}
                    selected={filterMediaNames}
                    onChange={setFilterMediaNames}
                  />
                </div>

                <div className="space-y-2 relative z-40">
                  <Label className="text-sm font-black text-black uppercase tracking-widest pl-1">Machine ID</Label>
                  <MultiSelect
                    placeholder="Machine ID"
                    icon={<MonitorPlay className="h-5 w-5" />}
                    options={availableMachineIds}
                    selected={filterMachineIds}
                    onChange={setFilterMachineIds}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-1 pl-1">
                    <CalendarDays className="h-4 w-4" /> Start Date
                  </Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-12 border-2 border-black bg-[#fffdf7] rounded-none font-bold text-black focus-visible:ring-0 shadow-[2px_2px_0_0_#000]" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-1 pl-1">
                    <CalendarDays className="h-4 w-4" /> End Date
                  </Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-12 border-2 border-black bg-[#fffdf7] rounded-none font-bold text-black focus-visible:ring-0 shadow-[2px_2px_0_0_#000]" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-1 pl-1">
                    <Activity className="h-4 w-4" /> Outcome
                  </Label>
                  <Select value={resultStatus} onValueChange={(val) => setResultStatus(val || "All")}>
                    <SelectTrigger className="h-12 border-2 border-black bg-[#fffdf7] rounded-none font-bold text-black focus:ring-0 shadow-[2px_2px_0_0_#000]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-black rounded-none shadow-[4px_4px_0_0_#000]">
                      <SelectItem value="All" className="font-bold text-black uppercase">** ANY OUTCOME **</SelectItem>
                      {availableOutcomes.map(outcome => (
                        <SelectItem key={outcome} value={outcome} className="font-semibold text-black uppercase">{outcome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between gap-4 h-full">
                <Button onClick={() => { setPage(1); handlePreview(); }} disabled={loadingReports} className="h-12 px-8 w-full md:w-auto font-black uppercase text-white bg-black hover:bg-black/90 rounded-none border-2 border-black shadow-[4px_4px_0_0_#ff90e8] active:translate-y-1 active:shadow-none transition-all">
                  {loadingReports ? "SYNCING..." : "APPLY FILTERS"}
                </Button>
                <div className="inline-flex items-center px-4 py-2 border-2 border-black font-black uppercase text-sm bg-[#ffc900] shadow-[2px_2px_0_0_#000]">
                  Matches: {totalCount}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Table Card */}
          <Card className="shadow-[8px_8px_0_0_#000] rounded-none border-4 border-black bg-white">
            <div className="overflow-x-auto min-h-[500px]">
              <Table className="w-full">
                <TableHeader className="bg-white sticky top-0 border-b-4 border-black z-20">
                  <TableRow className="hover:bg-white">
                    <TableHead className="font-black uppercase text-black h-14 border-r-2 border-black">Media Name</TableHead>
                    <TableHead className="font-black uppercase text-black h-14 border-r-2 border-black">Start Time</TableHead>
                    <TableHead className="font-black uppercase text-black h-14 border-r-2 border-black">End Time</TableHead>
                    <TableHead className="font-black uppercase text-black h-14 border-r-2 border-black text-right">Duration</TableHead>
                    <TableHead className="font-black uppercase text-black h-14 border-r-2 border-black text-center">Result</TableHead>
                    <TableHead className="font-black uppercase text-black h-14 text-right">Machine ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReports ? (
                     <TableRow>
                       <TableCell colSpan={6} className="h-[400px] text-center font-black uppercase text-2xl text-black">
                         <Activity className="h-10 w-10 animate-bounce text-[#ff90e8] mx-auto mb-4 border-2 border-black rounded-full p-1" />
                         Fetching ENGINE...
                       </TableCell>
                     </TableRow>
                  ) : (
                    <>
                      {reports.map((row) => (
                        <TableRow key={row.id} className="transition-colors hover:bg-[#fffdf7] border-b-2 border-black">
                          <TableCell className="font-bold text-black border-r-2 border-black">{row.media_name}</TableCell>
                          <TableCell className="text-black font-mono border-r-2 border-black bg-blue-50/50">{formatExactDate(row.start_time)}</TableCell>
                          <TableCell className="text-black font-mono border-r-2 border-black bg-blue-50/50">{formatExactDate(row.end_time)}</TableCell>
                          <TableCell className="text-right text-black font-mono font-bold border-r-2 border-black">{row.duration_text}</TableCell>
                          <TableCell className="text-center border-r-2 border-black">
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] ${row.play_result === 'Succeed' ? 'bg-[#05df72] text-white' : 'bg-[#ff90e8] text-black'}`}>
                              {row.play_result === 'Succeed' ? 'SUCCESS' : 'FAILED'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-black font-black bg-gray-50/50">{row.machine_id}</TableCell>
                        </TableRow>
                      ))}
                      {reports.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-[400px] text-center text-black">
                            <div className="flex flex-col items-center justify-center">
                              <Search className="h-14 w-14 text-black mb-4 opacity-50" />
                              <p className="text-3xl font-black uppercase">No records found</p>
                              <p className="text-lg mt-2 font-semibold opacity-70">Adjust filters or ingest new logs.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Grid */}
            {reports.length > 0 && (
               <div className="py-4 px-6 border-t-4 border-black bg-[#ff90e8] flex items-center justify-between">
                  <div className="text-sm font-black text-black tracking-wide uppercase">
                    Records <span className="text-white px-2 py-1 bg-black rounded mx-1">{(page - 1) * limit + 1}</span> to <span className="text-white px-2 py-1 bg-black rounded mx-1">{Math.min(page * limit, totalCount)}</span> // Total: {totalCount}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 border-2 border-black bg-white text-black hover:bg-black hover:text-white rounded-none shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-5 w-5 font-black" />
                    </Button>
                    <span className="text-base font-black px-4 bg-white border-2 border-black shadow-[2px_2px_0_0_#000] py-1.5 uppercase tracking-wide">
                      Page {page} <span className="opacity-50">/ {totalPages || 1}</span>
                    </span>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-10 w-10 border-2 border-black bg-white text-black hover:bg-black hover:text-white rounded-none shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all" 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || totalCount === 0}
                    >
                      <ChevronRight className="h-5 w-5 font-black" />
                    </Button>
                  </div>
               </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="outline-none">
          <div className="max-w-4xl mx-auto mt-6">
            <Card className="shadow-[8px_8px_0_0_#000] border-4 border-black rounded-none bg-white">
              <CardHeader className="text-center py-10 border-b-4 border-black bg-[#ffc900]">
                <CardTitle className="text-4xl font-black text-black uppercase tracking-wider">Upload Log Files</CardTitle>
                <CardDescription className="text-xl mt-3 font-semibold text-black/80">
                  Select your `.plylog` files to upload them to the database.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="space-y-4">
                  <Label className="text-lg font-black flex items-center gap-2 text-black uppercase">
                    <MonitorPlay className="h-6 w-6 text-black" />
                    Machine ID (Optional)
                  </Label>
                  <Input 
                    className="h-16 text-xl p-4 bg-[#fffdf7] border-4 border-black focus-visible:ring-0 shadow-[4px_4px_0_0_#000] rounded-none font-bold"
                    placeholder="E.g. TERMINAL-A" 
                    value={machineId}
                    onChange={e => setMachineId(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-4">
                  <Label className="text-lg font-black flex items-center gap-2 text-black uppercase">
                    <Settings2 className="h-6 w-6 text-black" />
                    Select Files
                  </Label>
                  <div className="group relative border-4 border-black bg-white hover:bg-[#ff90e8] shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all rounded-none p-16 flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px]">
                     <input 
                      type="file" 
                      multiple 
                      accept=".plylog,.xml" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        if (e.target.files) setFiles(Array.from(e.target.files))
                      }} 
                    />
                    <div className="bg-[#ffc900] border-4 border-black p-6 rounded-none shadow-[2px_2px_0_0_#000] mb-6 transform -rotate-3 group-hover:rotate-0 transition-transform">
                      <UploadCloud className="h-10 w-10 text-black" />
                    </div>
                    <p className="text-2xl font-black text-black uppercase">
                      {files.length > 0 ? `${files.length} FILES QUEUED` : "DROP LOG FILES HERE"}
                    </p>
                    <p className="text-base font-bold text-black/70 mt-3 max-w-sm">
                      Supports up to 100 XML logs per drop. Strict parsing enforced.
                    </p>
                  </div>
                </div>
                
                <Button 
                  size="lg"
                  onClick={handleBulkUpload} 
                  disabled={uploading || files.length === 0} 
                  className="w-full h-20 text-2xl font-black tracking-widest uppercase shadow-[6px_6px_0_0_#000] bg-black hover:bg-black/90 text-white rounded-none"
                >
                  {uploading ? `Uploading... (${progress.done}/${progress.total})` : "UPLOAD FILES"}
                </Button>

                {uploadResults.length > 0 && (
                  <div className="mt-10 border-4 border-black rounded-none p-6 h-80 overflow-y-auto bg-white text-sm shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)] space-y-3">
                    <p className="text-black font-black text-xl mb-4 border-b-2 border-black pb-2 uppercase tracking-wide">Upload Results</p>
                    {uploadResults.map((r, i) => (
                      <div key={i} className={`flex items-center justify-between p-4 border-2 border-black shadow-[2px_2px_0_0_#000] ${r.status.includes('Failed') || r.status.includes('Error') ? 'bg-red-500 text-white' : 'bg-green-400 text-black'}`}>
                        <span className="font-bold truncate mr-4">{r.name}</span>
                        <span className="font-black uppercase tracking-wider shrink-0 text-white">
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
