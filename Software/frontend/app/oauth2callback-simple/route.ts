import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('=== SIMPLE OAUTH2 CALLBACK ===')
  console.log('Full URL:', request.url)
  console.log('Search params:', request.nextUrl.searchParams.toString())
  
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')
  
  console.log('Code:', code)
  console.log('Error:', error)
  console.log('==============================')
  
  if (error) {
    return NextResponse.json({ success: false, error: error })
  }
  
  if (code) {
    return NextResponse.json({ 
      success: true, 
      code: code,
      message: 'OAuth2 code received successfully' 
    })
  }
  
  return NextResponse.json({ 
    success: false, 
    message: 'No code or error received' 
  })
}
