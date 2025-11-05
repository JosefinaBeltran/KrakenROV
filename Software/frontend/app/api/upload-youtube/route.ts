import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    console.log('Starting YouTube upload for:', title)
    console.log('Video file size:', videoFile.size, 'bytes')

    // Check for OAuth2 access token
    const accessToken = request.cookies.get('google_access_token')?.value
    
    if (!accessToken) {
      // No OAuth2 token, use demo mode
      console.log('No OAuth2 token found, using demo mode')
      const uploadTime = Math.min(5000, Math.max(2000, videoFile.size / 10000))
      await new Promise(resolve => setTimeout(resolve, uploadTime))
      const mockVideoId = generateMockVideoId()
      
      return NextResponse.json({
        success: true,
        videoId: mockVideoId,
        message: 'Video procesado (modo demo - autentica con Google para subida real)'
      })
    }

    // Check if it's a demo token
    if (accessToken.startsWith('demo_token_')) {
      console.log('Demo token detected, using demo mode')
      const uploadTime = Math.min(5000, Math.max(2000, videoFile.size / 10000))
      await new Promise(resolve => setTimeout(resolve, uploadTime))
      const mockVideoId = generateMockVideoId()
      
      return NextResponse.json({
        success: true,
        videoId: mockVideoId,
        message: 'Video procesado (modo demo - autentica con Google para subida real)'
      })
    }

    // Real YouTube upload with OAuth2
    const buffer = await videoFile.arrayBuffer()
    
    // Create video metadata
    const metadata = {
      snippet: {
        title: title,
        description: description || 'Video de inspección submarina',
        tags: ['inspeccion', 'rov', 'submarino', 'inspeccion-marina']
      },
      status: {
        privacyStatus: 'unlisted'
      }
    }

    // Upload to YouTube
    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/related; boundary="boundary"'
        },
        body: createMultipartBody(metadata, Buffer.from(buffer))
      }
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('YouTube upload error:', errorText)
      
      // If token expired, try to refresh
      if (uploadResponse.status === 401) {
        return NextResponse.json({
          error: 'Token expirado. Por favor, auténtica nuevamente con Google.',
          needsAuth: true
        }, { status: 401 })
      }
      
      throw new Error(`YouTube API error: ${uploadResponse.status}`)
    }

    const result = await uploadResponse.json()
    console.log('Upload completed successfully, video ID:', result.id)

    return NextResponse.json({
      success: true,
      videoId: result.id,
      message: 'Video subido exitosamente a YouTube'
    })

  } catch (error) {
    console.error('Error uploading to YouTube:', error)
    return NextResponse.json(
      { error: 'Error al subir el video a YouTube' },
      { status: 500 }
    )
  }
}

function generateMockVideoId(): string {
  // Generate a realistic YouTube video ID (11 characters)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let result = ''
  for (let i = 0; i < 11; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function createMultipartBody(metadata: any, videoBuffer: Buffer): string {
  const boundary = 'boundary'
  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
  const videoPart = `--${boundary}\r\nContent-Type: video/webm\r\n\r\n`
  const endBoundary = `\r\n--${boundary}--\r\n`
  
  return metadataPart + videoPart + videoBuffer.toString('binary') + endBoundary
}

// Real YouTube API implementation requires OAuth2:
/*
// You need to:
// 1. Set up OAuth2 credentials in Google Cloud Console
// 2. Implement OAuth2 flow to get access token
// 3. Use the access token for uploads

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

oauth2Client.setCredentials({
  access_token: userAccessToken, // From OAuth2 flow
  refresh_token: userRefreshToken
})

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client
})

const response = await youtube.videos.insert({
  part: ['snippet', 'status'],
  requestBody: {
    snippet: {
      title: title,
      description: description,
      tags: ['inspeccion', 'rov', 'submarino']
    },
    status: {
      privacyStatus: 'unlisted'
    }
  },
  media: {
    body: videoFile.stream()
  }
})
*/

// Real YouTube API implementation would look like this:
/*
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string

    // Initialize YouTube API client
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY // or OAuth2 client
    })

    // Upload video
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title,
          description: description,
          tags: tags.split(','),
        },
        status: {
          privacyStatus: 'unlisted', // or 'public', 'private'
        },
      },
      media: {
        body: videoFile.stream(),
      },
    })

    return NextResponse.json({
      success: true,
      videoId: response.data.id,
      message: 'Video uploaded successfully to YouTube'
    })

  } catch (error) {
    console.error('Error uploading to YouTube:', error)
    return NextResponse.json(
      { error: 'Failed to upload video to YouTube' },
      { status: 500 }
    )
  }
}
*/
