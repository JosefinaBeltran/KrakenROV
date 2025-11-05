import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(_req: NextRequest) {
  try {
    const projectRoot = path.join(process.cwd(), '..')
    const pidFile = path.join(projectRoot, '.measurement_pid')

    if (!fs.existsSync(pidFile)) {
      return NextResponse.json({ ok: true })
    }

    const pid = Number(fs.readFileSync(pidFile, 'utf8'))
    if (!Number.isNaN(pid)) {
      try {
        process.kill(pid)
      } catch {}
    }
    fs.rmSync(pidFile, { force: true })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Failed to stop measurement_system.py', err)
    return NextResponse.json({ error: 'No se pudo detener el sistema de medición' }, { status: 500 })
  }
}


