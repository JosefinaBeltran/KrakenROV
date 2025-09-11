"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Square, Camera, Trash2, CheckCircle, Circle, ChevronDown } from "lucide-react"

interface InspeccionData {
  nombreInspeccion: string
  lugarInspeccion: string
  fechaInspeccion: string
  descripcion: string
  nombreApellido: string
  matricula: string
}

interface SensorData {
  temperatura: number
  presion: number
  profundidad: number
  orientacion: string
  distancia: number
}

export default function VideoEnCursoPage() {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [angle, setAngle] = useState(0)
  const [capturedFrames, setCapturedFrames] = useState<string[]>([])
  const [inspeccionData, setInspeccionData] = useState<InspeccionData | null>(null)
  const [sensorData, setSensorData] = useState<SensorData>({
    temperatura: 22.5,
    presion: 1013.25,
    profundidad: 15.3,
    orientacion: "Norte",
    distancia: 2.8,
  })
  const [showSensorDropdown, setShowSensorDropdown] = useState(false)
  const [recordings, setRecordings] = useState<string[]>([])

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
      // Update sensor data with realistic variations
      setSensorData((prev) => ({
        temperatura: prev.temperatura + (Math.random() - 0.5) * 0.2,
        presion: prev.presion + (Math.random() - 0.5) * 2,
        profundidad: prev.profundidad + (Math.random() - 0.5) * 0.5,
        orientacion: ["Norte", "Noreste", "Este", "Sureste", "Sur", "Suroeste", "Oeste", "Noroeste"][
          Math.floor(Math.random() * 8)
        ],
        distancia: prev.distancia + (Math.random() - 0.5) * 0.3,
      }))
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
      const recordingId = `recording_${Date.now()}`
      setRecordings((prev) => [...prev, recordingId])
      console.log(`[v0] Auto-saved recording: ${recordingId}`)
    } else {
      setIsRecording(true)
      setRecordingTime(0)
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

  const handleFinalizar = () => {
    // Save inspection data with captured frames and recordings
    if (inspeccionData) {
      const inspectionWithFrames = {
        ...inspeccionData,
        capturedFrames,
        recordings, // Include all recordings
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
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowSensorDropdown(!showSensorDropdown)}
              className="border-border hover:bg-secondary bg-transparent"
            >
              Sensores
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>

            {showSensorDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-10">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Temperatura:</span>
                    <span className="text-sm font-medium">{sensorData.temperatura.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Presión:</span>
                    <span className="text-sm font-medium">{sensorData.presion.toFixed(2)} hPa</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Profundidad:</span>
                    <span className="text-sm font-medium">{sensorData.profundidad.toFixed(1)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Orientación:</span>
                    <span className="text-sm font-medium flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-accent flex items-center justify-center">
                        <div className="w-1 h-1 bg-accent rounded-full"></div>
                      </div>
                      {sensorData.orientacion}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Distancia:</span>
                    <span className="text-sm font-medium">{sensorData.distancia.toFixed(1)} m</span>
                  </div>
                </div>
              </div>
            )}
          </div>
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

        {/* Control buttons */}
        <div className="flex justify-center gap-4 mb-6">
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

          <Button onClick={handleFinalizar} className="bg-accent hover:bg-accent/90 text-accent-foreground px-8">
            <CheckCircle className="w-4 h-4 mr-2" />
            Finalizar
          </Button>
        </div>

        {/* Recordings and captures sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Captured frames section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">Capturas Realizadas ({capturedFrames.length})</h3>
              {capturedFrames.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {capturedFrames.map((frame, index) => (
                    <img
                      key={index}
                      src={frame || "/placeholder.svg"}
                      alt={`Captura ${index + 1}`}
                      className="w-full h-20 object-cover rounded border border-border"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No hay capturas realizadas</p>
              )}
            </CardContent>
          </Card>

          {/* Recordings section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">Grabaciones Guardadas ({recordings.length})</h3>
              {recordings.length > 0 ? (
                <div className="space-y-2">
                  {recordings.map((recording, index) => (
                    <div
                      key={index}
                      className="bg-accent text-accent-foreground px-3 py-2 rounded text-sm flex items-center justify-between"
                    >
                      <span>Grabación {index + 1}</span>
                      <span className="text-xs text-muted-foreground">Auto-guardado</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No hay grabaciones guardadas</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
