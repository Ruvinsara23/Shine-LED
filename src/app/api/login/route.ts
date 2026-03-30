import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const cookieStore = await cookies()
      cookieStore.set('admin_session', 'authenticated', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        path: '/' 
      })
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid credentials. Please try again.' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
