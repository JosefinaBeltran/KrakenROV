import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || '791215838075-j0lkah2jij1obmm7tvm4h82rob4qmdr9.apps.googleusercontent.com'
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback-simple'
  
  console.log('=== GOOGLE AUTH DEBUG ===')
  console.log('Client ID:', clientId)
  console.log('Redirect URI:', redirectUri)
  console.log('Full request URL:', request.url)
  
  // Scopes needed for YouTube upload (reduced for testing)
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload'
  ].join(' ')
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  
  console.log('Generated auth URL:', authUrl.toString())
  console.log('========================')
  
  return NextResponse.redirect(authUrl.toString())
}
