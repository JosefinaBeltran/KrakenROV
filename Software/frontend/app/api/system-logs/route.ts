import { NextRequest, NextResponse } from "next/server"
import { appendFile, mkdir } from "fs/promises"
import path from "path"

export const runtime = "nodejs"

type LogSeverity = "INFO" | "WARN" | "ERROR" | "SECURITY"

interface SystemLogPayload {
  eventType: string
  message: string
  severity?: LogSeverity
  user?: string
  context?: Record<string, unknown>
}

const LOG_DIR = path.join(process.cwd(), "logs")
const LOG_FILE = path.join(LOG_DIR, "system-events.txt")

/** Formato legible en UTC-3 (Argentina, sin DST). */
function formatTimestampUtcMinus3(date: Date): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    fractionalSecondDigits: 3,
  })
  const parts = dtf.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ""

  const y = get("year")
  const mo = get("month")
  const da = get("day")
  const h = get("hour")
  const mi = get("minute")
  const s = get("second")
  const ms = get("fractionalSecond")

  return `${y}-${mo}-${da}T${h}:${mi}:${s}.${ms}-03:00`
}

function buildLogLine(payload: SystemLogPayload): string {
  const timestamp = formatTimestampUtcMinus3(new Date())
  const severity = payload.severity ?? "INFO"
  const user = payload.user ? ` user=${payload.user}` : ""
  const context =
    payload.context && Object.keys(payload.context).length > 0
      ? ` context=${JSON.stringify(payload.context)}`
      : ""

  return `[${timestamp}] [${severity}] [${payload.eventType}]${user} ${payload.message}${context}\n`
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SystemLogPayload

    if (!payload?.eventType || !payload?.message) {
      return NextResponse.json(
        { success: false, error: "eventType y message son requeridos" },
        { status: 400 },
      )
    }

    await mkdir(LOG_DIR, { recursive: true })
    await appendFile(LOG_FILE, buildLogLine(payload), "utf8")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error writing system log:", error)
    return NextResponse.json(
      { success: false, error: "No se pudo escribir el log" },
      { status: 500 },
    )
  }
}
