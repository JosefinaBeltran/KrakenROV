import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('Simple OAuth callback received')
  
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    console.log('Code present:', !!code)
    console.log('Error:', error)
    
    if (error) {
      console.log('OAuth error:', error)
      return NextResponse.redirect(`/visor-video?error=${encodeURIComponent(error)}`)
    }
    
    if (!code) {
      console.log('No authorization code received')
      return NextResponse.redirect('/visor-video?error=no_code')
    }
    
    // For now, just redirect with success
    console.log('OAuth callback successful, redirecting...')
    return NextResponse.redirect('/visor-video?auth=success')
    
  } catch (error) {
    console.error('Simple OAuth callback error:', error)
    return NextResponse.redirect('/visor-video?error=callback_error')
  }
}
