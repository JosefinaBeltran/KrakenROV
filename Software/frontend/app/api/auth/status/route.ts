import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('google_access_token')?.value
    
    if (!accessToken) {
      return NextResponse.json({ authenticated: false })
    }
    
    // Verify token with Google
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`)
    
    if (!response.ok) {
      return NextResponse.json({ authenticated: false })
    }
    
    const tokenInfo = await response.json()
    
    return NextResponse.json({ 
      authenticated: true,
      user: {
        email: tokenInfo.email,
        name: tokenInfo.verified_email ? tokenInfo.email : 'Usuario'
      }
    })
    
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
