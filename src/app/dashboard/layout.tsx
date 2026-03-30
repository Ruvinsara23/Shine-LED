import { logoutAction } from "../login/actions"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fffdf7] font-sans text-black">
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b-4 border-black bg-[#ffc900] px-6 shadow-[0_4px_0_0_#000]">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center bg-[#ff90e8] border-2 border-black font-black text-black shadow-[2px_2px_0_0_#000] rotate-3 hover:rotate-0 transition-transform">
            SL
          </div>
          <span className="text-2xl font-black uppercase tracking-widest hidden sm:inline-flex">Shine LED</span>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="px-5 py-2 font-black uppercase border-2 border-black bg-white hover:bg-black hover:text-white shadow-[2px_2px_0_0_#000] transition-colors">
            Exit
          </button>
        </form>
      </header>
      <main className="flex-1 w-full p-4 md:p-8 mx-auto max-w-[1700px] mt-4">{children}</main>
    </div>
  )
}
