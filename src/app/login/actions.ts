'use server'

import { cookies } from 'next/headers'

export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get('username')?.toString()
  const password = formData.get('password')?.toString()

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set('admin_session', 'authenticated', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/' 
    })
    return { success: true, error: null }
  }

  return { success: false, error: 'Invalid credentials. Please try again.' }
}

export async function logoutAction(formData?: FormData) {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  
  // Must import inside or at top level. We can just use next/navigation
  const { redirect } = await import('next/navigation');
  redirect('/login')
}
