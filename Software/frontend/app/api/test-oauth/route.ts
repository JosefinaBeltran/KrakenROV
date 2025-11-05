import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('Test OAuth endpoint called')
  console.log('Full URL:', request.url)
  console.log('Search params:', request.nextUrl.searchParams.toString())
  
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')
  
  console.log('Code:', code)
  console.log('Error:', error)
  
  if (error) {
    return NextResponse.json({ 
      success: false, 
      error: error,
      message: 'OAuth error received'
    })
  }
  
  if (code) {
    return NextResponse.json({ 
      success: true, 
      code: code,
      message: 'OAuth code received successfully'
    })
  }
  
  return NextResponse.json({ 
    success: false, 
    message: 'No code or error received'
  })
}
