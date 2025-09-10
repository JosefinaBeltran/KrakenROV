"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Square, Camera, Trash2, X, Circle } from "lucide-react"

interface InspeccionData {
  nombreInspeccion: string
  lugarInspeccion: string
  fechaInspeccion: string
  descripcion: string
  nombreApellido: string
  matricula: string
}

export default function VideoEnCursoPage() {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [angle, setAngle] = useState(0)
  const [capturedFrames, setCapturedFrames] = useState<string[]>([])
  const [inspeccionData, setInspeccionData] = useState<InspeccionData | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load inspection data from localStorage
  useEffect(() => {
    const data = localStorage.getItem("inspeccionData")
    if (data) {
      setInspeccionData(JSON.parse(data))
    }
  }, [])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      setAngle((prev) => (prev + 1) % 360) // Simulate angle changes
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Recording timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isRecording])

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          streamRef.current = stream
        }
      } catch (error) {
        console.log("Camera not available, using placeholder")
      }
    }

    initCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleGrabar = () => {
    if (isRecording) {
      setIsRecording(false)
      // In a real app, stop recording here
    } else {
      setIsRecording(true)
      setRecordingTime(0)
      // In a real app, start recording here
    }
  }

  const handleCapturar = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        canvas.width = videoRef.current.videoWidth || 640
        canvas.height = videoRef.current.videoHeight || 480
        ctx.drawImage(videoRef.current, 0, 0)
        const frameData = canvas.toDataURL("image/jpeg")
        setCapturedFrames((prev) => [...prev, frameData])
      }
    } else {
      // Fallback for when camera is not available
      const mockFrame = `data:image/svg+xml;base64,${btoa(`
        <svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#1f2937"/>
          <text x="50%" y="50%" textAnchor="middle" fill="white" fontSize="24">
            Captura ${capturedFrames.length + 1}
          </text>
          <text x="50%" y="60%" textAnchor="middle" fill="#a16207" fontSize="16">
            ${currentTime.toLocaleString("es-ES")}
          </text>
        </svg>
      `)}`
      setCapturedFrames((prev) => [...prev, mockFrame])
    }
  }

  const handleEliminar = () => {
    if (capturedFrames.length > 0) {
      setCapturedFrames((prev) => prev.slice(0, -1))
    }
  }

  const handleCerrar = () => {
    // Save inspection data with captured frames
    if (inspeccionData) {
      const inspectionWithFrames = {
        ...inspeccionData,
        capturedFrames,
        recordingTime,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }

      const existingInspections = JSON.parse(localStorage.getItem("inspecciones") || "[]")
      existingInspections.push(inspectionWithFrames)
      localStorage.setItem("inspecciones", JSON.stringify(existingInspections))
    }

    router.push("/listado-inspecciones")
  }

  // Generate mock chart data
  const generateChartData = () => {
    const data = []
    for (let i = 0; i < 50; i++) {
      data.push(Math.sin(i * 0.1 + Date.now() * 0.001) * 20 + 50)
    }
    return data
  }

  const chartData = generateChartData()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-foreground">Video en Curso</h1>
          <Button variant="outline" onClick={handleCerrar} className="border-border hover:bg-secondary bg-transparent">
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </div>

        {/* Main video area */}
        <div className="relative bg-card rounded-lg overflow-hidden mb-6">
          {/* Video element */}
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-[400px] object-cover bg-muted"
            style={{ display: streamRef.current ? "block" : "none" }}
          />

          {/* Fallback when camera is not available */}
          {!streamRef.current && (
            <div className="w-full h-[400px] bg-muted flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Simulación de Video en Vivo</p>
                <p className="text-sm text-muted-foreground mt-2">{inspeccionData?.nombreInspeccion || "Inspección"}</p>
              </div>
            </div>
          )}

          {/* Video overlays */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top overlay - Date/Time and Recording indicator */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <div className="bg-black/70 text-white px-3 py-2 rounded text-sm">
                {currentTime.toLocaleString("es-ES")}
              </div>
              {isRecording && (
                <div className="bg-red-600 text-white px-3 py-2 rounded flex items-center gap-2 text-sm">
                  <Circle className="w-3 h-3 fill-current animate-pulse" />
                  REC {formatTime(recordingTime)}
                </div>
              )}
            </div>

            {/* Bottom left - Angle indicator */}
            <div className="absolute bottom-4 left-4">
              <div className="bg-black/70 text-white px-3 py-2 rounded text-sm">Ángulo: {angle}°</div>
            </div>

            {/* Bottom right - Real-time chart */}
            <div className="absolute bottom-4 right-4">
              <div className="bg-black/70 text-white p-3 rounded">
                <div className="text-xs mb-2">Gráfico en tiempo real</div>
                <svg width="120" height="60" className="text-primary">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    points={chartData.map((value, index) => `${index * 2.4},${60 - value}`).join(" ")}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Captured frames preview */}
        {capturedFrames.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">Capturas Realizadas ({capturedFrames.length})</h3>
              <div className="flex gap-2 overflow-x-auto">
                {capturedFrames.map((frame, index) => (
                  <img
                    key={index}
                    src={frame || "/placeholder.svg"}
                    alt={`Captura ${index + 1}`}
                    className="w-20 h-15 object-cover rounded border border-border flex-shrink-0"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Control buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleGrabar}
            className={`${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            } px-8`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Detener
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Grabar
              </>
            )}
          </Button>

          <Button onClick={handleCapturar} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
            <Camera className="w-4 h-4 mr-2" />
            Capturar
          </Button>

          <Button
            onClick={handleEliminar}
            variant="destructive"
            disabled={capturedFrames.length === 0}
            className="px-8"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
