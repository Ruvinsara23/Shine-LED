'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const username = formData.get('username')
    const password = formData.get('password')
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        router.push('/dashboard')
      } else {
        setError(data.error)
      }
    } catch {
      setError("Network or local IP error resolving authentication.")
    }
    setIsPending(false)
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#fffdf7] font-sans">
      
      {/* Decorative Neo-brutalist elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-[#ff90e8] rounded-full border-4 border-black shadow-[4px_4px_0_0_#000] hidden md:block" />
      <div className="absolute bottom-10 right-10 w-48 h-12 bg-[#ffc900] border-4 border-black shadow-[4px_4px_0_0_#000] hidden md:block" />
      
      <div className="z-10 w-full max-w-[440px] px-4">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center px-6 py-3 bg-[#ff90e8] border-4 border-black shadow-[4px_4px_0_0_#000] mb-6 rounded-md transform -rotate-2">
            <h1 className="text-3xl font-black tracking-tight text-black uppercase">Shine LED</h1>
          </div>
          <p className="text-lg font-bold text-black border-b-2 border-black border-dashed pb-1">
            Data Analytics Dashboard
          </p>
        </div>

        <Card className="border-4 border-black shadow-[8px_8px_0_0_#000] rounded-none bg-white">
          <form onSubmit={handleLogin}>
            <CardHeader className="bg-[#ffc900] border-b-4 border-black p-6">
              <CardTitle className="text-2xl font-black uppercase tracking-wide">Enter Credentials</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6 px-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-sm font-bold text-black uppercase tracking-widest pl-1">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Insert username..."
                  required
                  disabled={isPending}
                  className="h-12 border-2 border-black bg-white rounded-none shadow-[2px_2px_0_0_#000] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-[#fffdf7] font-medium text-black"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-bold text-black uppercase tracking-widest pl-1">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  className="h-12 border-2 border-black bg-white rounded-none shadow-[2px_2px_0_0_#000] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-[#fffdf7] font-medium text-black"
                />
              </div>

              {error && (
                <div className="p-3 bg-[#ff90e8] border-2 border-black shadow-[2px_2px_0_0_#000] text-sm text-black font-bold uppercase tracking-wide mt-4">
                  {error}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pb-8 px-6 pt-4">
              <button 
                type="submit" 
                className="w-full h-14 text-lg font-black uppercase bg-black hover:bg-black/90 text-white border-2 border-black shadow-[4px_4px_0_0_#ff90e8] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center" 
                disabled={isPending}
              >
                {isPending ? 'Checking...' : 'Login ->'}
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
