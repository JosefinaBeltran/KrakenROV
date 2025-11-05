import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export async function POST(_req: NextRequest) {
  try {
    const projectRoot = path.join(process.cwd(), '..')
    const scriptPath = path.join(projectRoot, 'measurement_system.py')
    const pidFile = path.join(projectRoot, '.measurement_pid')

    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ error: 'measurement_system.py no encontrado' }, { status: 404 })
    }

    // If already running, return OK
    if (fs.existsSync(pidFile)) {
      const existing = Number(fs.readFileSync(pidFile, 'utf8'))
      if (!Number.isNaN(existing)) {
        return NextResponse.json({ ok: true, pid: existing })
      }
    }

    // Try python commands
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    const child = spawn(pythonCmd, [scriptPath], {
      cwd: projectRoot,
      stdio: 'ignore',
      detached: false,
    })

    // Save PID
    fs.writeFileSync(pidFile, String(child.pid))

    return NextResponse.json({ ok: true, pid: child.pid })
  } catch (err) {
    console.error('Failed to start measurement_system.py', err)
    return NextResponse.json({ error: 'No se pudo iniciar el sistema de medición' }, { status: 500 })
  }
}


