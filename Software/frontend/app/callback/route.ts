import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('=== CALLBACK DEBUG ===')
  console.log('Full URL:', request.url)
  console.log('Search params:', request.nextUrl.searchParams.toString())
  
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')
  
  console.log('Code:', code)
  console.log('Error:', error)
  console.log('=====================')
  
  if (error) {
    return NextResponse.redirect(`/visor-video?error=${error}`)
  }
  
  if (code) {
    try {
      // Exchange authorization code for access token
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET
      const redirectUri = process.env.GOOGLE_REDIRECT_URI
      
      console.log('Exchanging code for tokens...')
      console.log('Client ID:', clientId)
      console.log('Client Secret:', clientSecret ? 'Present' : 'Missing')
      console.log('Redirect URI:', redirectUri)
      
      if (!clientId || !clientSecret || !redirectUri) {
        console.error('Missing environment variables')
        return NextResponse.redirect('/visor-video?error=missing_config')
      }
      
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
      
      const tokenData = await tokenResponse.json()
      console.log('Token response status:', tokenResponse.status)
      console.log('Token response:', tokenData)
      
      if (tokenData.access_token) {
        // Set cookies with tokens
        const response = NextResponse.redirect('/visor-video?auth=success')
        
        response.cookies.set('google_access_token', tokenData.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
        
        if (tokenData.refresh_token) {
          response.cookies.set('google_refresh_token', tokenData.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
          })
        }
        
        console.log('Tokens set successfully')
        return response
      } else {
        console.error('No access token received:', tokenData)
        return NextResponse.redirect('/visor-video?error=token_exchange_failed')
      }
    } catch (error) {
      console.error('Token exchange error:', error)
      return NextResponse.redirect('/visor-video?error=token_exchange_error')
    }
  }
  
  return NextResponse.redirect('/visor-video?error=no_code')
}
