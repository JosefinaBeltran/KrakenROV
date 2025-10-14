import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64 } = body as { imageBase64?: string }
    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 requerido' }, { status: 400 })
    }

    // Try multiple python commands for cross-platform support
    const candidates = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python']
    let child: ReturnType<typeof spawn> | null = null
    let lastErr: any
    for (const cmd of candidates) {
      try {
        child = spawn(cmd, ['../measurement_system.py', '--analyze', 'stdin', '--stdin-base64'], {
          cwd: process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe'],
        })
        // if spawn succeeded, break
        break
      } catch (e) {
        lastErr = e
        child = null
      }
    }
    if (!child) {
      return NextResponse.json({ error: 'python_not_found', detail: String(lastErr ?? '') }, { status: 500 })
    }
    

    const dataUrl = imageBase64
    child.stdin.write(dataUrl)
    child.stdin.end()

    let out = ''
    let err = ''
    child.stdout.on('data', (d) => (out += d.toString()))
    child.stderr.on('data', (d) => (err += d.toString()))

    const result = await new Promise<{ code: number; out: string; err: string }>((resolve) => {
      child.on('close', (code) => resolve({ code: code ?? 0, out, err }))
    })

    if (result.code !== 0) {
      return NextResponse.json({ error: 'analyze_failed', detail: (result.err || result.out || '').toString() }, { status: 500 })
    }

    let parsed: any
    try {
      parsed = JSON.parse(result.out.trim())
    } catch {
      return NextResponse.json({ error: 'invalid_json', raw: result.out }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}


