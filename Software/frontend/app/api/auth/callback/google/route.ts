import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('OAuth callback received')
    
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    console.log('Code:', code ? 'Present' : 'Missing')
    console.log('Error:', error)
    console.log('Full URL:', request.url)
    
    if (error) {
      console.log('OAuth error:', error)
      return NextResponse.redirect(`/visor-video?error=${encodeURIComponent(error)}`)
    }
    
    if (!code) {
      console.log('No authorization code received')
      return NextResponse.redirect('/visor-video?error=no_code')
    }
    const clientId = process.env.GOOGLE_CLIENT_ID || '791215838075-j0lkah2jij1obmm7tvm4h82rob4qmdr9.apps.googleusercontent.com'
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
    
    console.log('Client ID:', clientId)
    console.log('Client Secret:', clientSecret ? 'Present' : 'Missing')
    console.log('Redirect URI:', redirectUri)
    
    if (!clientSecret) {
      console.log('Client secret not configured, using demo mode')
      // For demo purposes, create a mock token
      const mockToken = 'demo_token_' + Date.now()
      
      const response = NextResponse.redirect('/visor-video?auth=demo')
      
      response.cookies.set('google_access_token', mockToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600, // 1 hour
      })
      
      return response
    }
    
    // Exchange code for tokens
    console.log('Exchanging code for tokens...')
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })
    
    console.log('Token response status:', tokenResponse.status)
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status}`)
    }
    
    const tokens = await tokenResponse.json()
    console.log('Tokens received successfully')
    
    // Store tokens in session/cookie (in production, use secure session storage)
    const response = NextResponse.redirect('/visor-video?auth=success')
    
    // Set secure HTTP-only cookies
    response.cookies.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    })
    
    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })
    }
    
    return response
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.redirect(`/visor-video?error=${encodeURIComponent('auth_failed')}`)
  }
}
