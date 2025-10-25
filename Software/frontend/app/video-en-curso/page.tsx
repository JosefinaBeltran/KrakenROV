"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Square, Camera, Trash2, CheckCircle, Circle, ChevronDown } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useDatabase } from "@/hooks/useDatabase"
import ChartCapture from "@/components/ChartCapture"

interface InspeccionData {
  nombreInspeccion: string
  lugarInspeccion: string
  fechaInspeccion: string
  descripcion: string
  nombreApellido: string
  matricula: string
}

interface SensorData {
  // Datos básicos (mantener compatibilidad)
  temperatura: number
  distancia: number
  humedad: number
  motor: string
  
  // Nuevos datos del Arduino
  sound_level?: number
  altitude?: number
  acceleration_x?: number
  acceleration_y?: number
  acceleration_z?: number
  rotation_x?: number
  rotation_y?: number
  rotation_z?: number
  obstacles?: boolean
  pressure?: number
}

export default function VideoEnCursoPage() {
  const router = useRouter()
  const { getTempInspeccionData, saveInspeccion, clearTempInspeccionData, isInitialized, isLoading } = useDatabase()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [capturedFrames, setCapturedFrames] = useState<string[]>([])
  const [inspeccionData, setInspeccionData] = useState<InspeccionData | null>(null)
  const [sensorData, setSensorData] = useState<SensorData>({
    temperatura: 22.5,
    distancia: 2.8,
    humedad: 50,
    motor: "OFF",
    sound_level: 0,
    altitude: 0,
    acceleration_x: 0,
    acceleration_y: 0,
    acceleration_z: 0,
    rotation_x: 0,
    rotation_y: 0,
    rotation_z: 0,
    obstacles: false,
    pressure: 0,
  })
  const [showSensorDropdown, setShowSensorDropdown] = useState(false)
  const [recordings, setRecordings] = useState<string[]>([])
  const [measurementOn, setMeasurementOn] = useState(false)
  const [measurementText, setMeasurementText] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Estado para el gráfico de altitud (perfil de inmersión)
  const [altitudeHistory, setAltitudeHistory] = useState<number[]>([])
  const [chartUpdateTrigger, setChartUpdateTrigger] = useState(0)
  const [inspectionStartTime, setInspectionStartTime] = useState<number | null>(null)
  const [realTimeHistory, setRealTimeHistory] = useState<{time: number, depth: number}[]>([])
  
  // Estado para datos de sensores en tiempo real (para gráficos)
  const [temperatureHistory, setTemperatureHistory] = useState<number[]>([])
  const [sensorCharts, setSensorCharts] = useState<{
    temperature: string
    depth: string
  } | null>(null)

  // Log cuando se actualicen los gráficos
  useEffect(() => {
    if (sensorCharts) {
      console.log('Gráficos de sensores actualizados:', sensorCharts)
    }
  }, [sensorCharts])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const chartCaptureRef = useRef<{ captureCharts: () => void }>(null)

  // Initialize inspection start time
  useEffect(() => {
    if (!inspectionStartTime) {
      setInspectionStartTime(Date.now())
    }
  }, [])

  // Limpiar datos de sensores cuando se inicia una nueva inspección
  useEffect(() => {
    if (inspeccionData && inspeccionData.id) {
      setTemperatureHistory([])
      setSensorCharts(null)
    }
  }, [inspeccionData?.id])

  // Load inspection data from database
  useEffect(() => {
    const loadInspeccionData = async () => {
      console.log('Loading inspeccion data...', { isInitialized, isLoading })
      
      if (!isInitialized) {
        console.log('Database not initialized yet, waiting...')
        return
      }
      
      try {
        console.log('Attempting to get temp inspeccion data from database...')
        const data = await getTempInspeccionData()
        console.log('Got temp data from database:', data)
        
        if (data) {
          // Ensure fechaInspeccion stays as YYYY-MM-DD string
          const inspeccionData = { ...data, fechaInspeccion: data.fechaInspeccion }
          console.log('Setting inspeccion data:', inspeccionData)
          setInspeccionData(inspeccionData)
        } else {
          console.log('No temp data found in database, checking localStorage...')
          // Fallback to localStorage
          const fallbackData = localStorage.getItem("inspeccionData")
          if (fallbackData) {
            const parsed: InspeccionData = JSON.parse(fallbackData)
            console.log('Found data in localStorage:', parsed)
            setInspeccionData({ ...parsed, fechaInspeccion: parsed.fechaInspeccion })
          } else {
            console.log('No data found in localStorage either')
          }
        }
      } catch (error) {
        console.error('Error loading inspeccion data:', error)
        // Fallback to localStorage
        const fallbackData = localStorage.getItem("inspeccionData")
        if (fallbackData) {
          const parsed: InspeccionData = JSON.parse(fallbackData)
          console.log('Fallback to localStorage data:', parsed)
          setInspeccionData({ ...parsed, fechaInspeccion: parsed.fechaInspeccion })
        }
      }
    }
    loadInspeccionData()
  }, [isInitialized, getTempInspeccionData])
  const toggleMeasurement = async () => {
    try {
      if (!measurementOn) {
        setMeasurementOn(true)
        // Start periodic analyze loop
        startAnalyzeLoop()
      } else {
        setMeasurementOn(false)
        setMeasurementText(null)
      }
    } catch {
      // ignore
    }
  }

  // Capture frame and send to analyze API
  const startAnalyzeLoop = () => {
    const sendOnce = async () => {
      if (!measurementOn) return
      try {
        // capture current frame into canvas
        if (videoRef.current && canvasRef.current) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const w = videoRef.current.videoWidth || 640
            const h = videoRef.current.videoHeight || 480
            canvas.width = w
            canvas.height = h
            ctx.drawImage(videoRef.current, 0, 0, w, h)
            const dataUrl = canvas.toDataURL('image/jpeg')
            const res = await fetch('/api/measurement/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageBase64: dataUrl }),
            })
            if (res.ok) {
              const json = await res.json()
              const summary = summarizeMeasurements(json?.measurements)
              setMeasurementText(summary)
            }
          }
        }
      } catch {
        // ignore errors
      } finally {
        if (measurementOn) {
          setTimeout(sendOnce, 2000)
        }
      }
    }
    setTimeout(sendOnce, 300)
  }

  const summarizeMeasurements = (m: any): string | null => {
    if (!m || typeof m !== 'object') return null
    const keys = Object.keys(m)
    if (keys.length === 0) return 'Sin mediciones'
    const first = m[keys[0]]
    const w = first?.width_meters ? `${(first.width_meters * 100).toFixed(1)} cm` : `${(first?.width_pixels ?? 0).toFixed?.(1) ?? first?.width_pixels} px`
    const h = first?.height_meters ? `${(first.height_meters * 100).toFixed(1)} cm` : `${(first?.height_pixels ?? 0).toFixed?.(1) ?? first?.height_pixels} px`
    return `Obj: ${keys[0]}  W: ${w}  H: ${h}`
  }

  // Update current time and poll backend every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())

      fetch("http://localhost:5000/data")
        .then(async (res) => {
          if (!res.ok) throw new Error("Bad response")
          return res.json()
        })
        .then((data: any) => {
          setSensorData(prevData => ({
            ...prevData,
            // Mantener compatibilidad con datos básicos
            temperatura: data.temperature || prevData.temperatura,
            humedad: data.humidity || prevData.humedad,
            distancia: data.distance || prevData.distancia,
            motor: data.motor || prevData.motor,
            // Nuevos datos del Arduino
            sound_level: data.sound_level || prevData.sound_level,
            altitude: data.altitude || prevData.altitude,
            acceleration_x: data.acceleration_x || prevData.acceleration_x,
            acceleration_y: data.acceleration_y || prevData.acceleration_y,
            acceleration_z: data.acceleration_z || prevData.acceleration_z,
            rotation_x: data.rotation_x || prevData.rotation_x,
            rotation_y: data.rotation_y || prevData.rotation_y,
            rotation_z: data.rotation_z || prevData.rotation_z,
            obstacles: data.obstacles !== undefined ? data.obstacles : prevData.obstacles,
            pressure: data.pressure || prevData.pressure,
          }))
          
          // Actualizar historial de altitud para el gráfico
          if (data.altitude !== undefined) {
            setAltitudeHistory(prev => {
              const newHistory = [...prev, data.altitude]
              // Mantener solo los últimos 50 valores (50 segundos)
              return newHistory.slice(-50)
            })
          }
          
          // Actualizar historial de temperatura para el gráfico
          if (data.temperature !== undefined) {
            setTemperatureHistory(prev => {
              const newHistory = [...prev, data.temperature]
              // Mantener solo los últimos 50 valores (50 segundos)
              return newHistory.slice(-50)
            })
          }
          
          // Forzar actualización del gráfico simulado cada segundo si no hay datos reales
          if (altitudeHistory.length === 0) {
            setChartUpdateTrigger(prev => prev + 1)
          }
        })
        .catch(() => {
          // Keep previous values on error
        })
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
    // Stop recording
    if (isRecording) {
      setIsRecording(false)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      return
    }

    // Start recording
    if (!streamRef.current) {
      // No camera stream available
      setIsRecording(false)
      return
    }

    try {
      recordedChunksRef.current = []
      const options: MediaRecorderOptions = {
        mimeType:
          typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
            ? "video/webm;codecs=vp9"
            : "video/webm;codecs=vp8",
      }
      const mediaRecorder = new MediaRecorder(streamRef.current, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" })
        const base64 = await blobToBase64(blob)
        setRecordings((prev) => [...prev, base64])
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (err) {
      console.error("Failed to start recording", err)
      setIsRecording(false)
    }
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
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

  const handleEliminarFrame = (index: number) => {
    setCapturedFrames((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEliminarRecording = (index: number) => {
    setRecordings((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFinalizar = async () => {
    console.log('handleFinalizar called', { 
      inspeccionData, 
      capturedFrames: capturedFrames.length, 
      recordings: recordings.length,
      isInitialized,
      isLoading
    })
    
    if (isSaving) {
      console.log('Already saving, ignoring duplicate click')
      return
    }
    
    if (!isInitialized) {
      console.error('Database not initialized')
      alert('La base de datos no está lista. Por favor, espere un momento e intente nuevamente.')
      return
    }
    
    setIsSaving(true)
    
    // Save inspection data with captured frames and recordings
    if (inspeccionData) {
      try {
        console.log('Attempting to save inspeccion to database...')
        
        // Capturar gráficos antes de guardar
        console.log('Intentando capturar gráficos...')
        if (chartCaptureRef.current) {
          console.log('Ref encontrado, capturando gráficos')
          chartCaptureRef.current.captureCharts()
          
          // Esperar un poco para que se capturen los gráficos
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          console.log('No se encontró la referencia del componente ChartCapture')
        }
        
        const inspectionWithFrames = {
          ...inspeccionData,
          capturedFrames,
          recordings, // base64 webm strings
          recordingTime,
          sensorCharts, // Incluir gráficos de sensores
        }

        console.log('Saving inspeccion:', inspectionWithFrames)
        await saveInspeccion(inspectionWithFrames)
        console.log('Inspeccion saved successfully')
        
        await clearTempInspeccionData()
        console.log('Temp data cleared')
        
        router.push("/listado-inspecciones")
      } catch (error) {
        console.error('Error saving inspeccion:', error)
        alert('Error al guardar la inspección. Por favor, intente nuevamente.')
      } finally {
        setIsSaving(false)
      }
    } else {
      console.error('No inspeccionData available to save')
      alert('No hay datos de inspección para guardar. Por favor, complete el formulario primero.')
      setIsSaving(false)
    }
  }

  // Generate chart data based on sensor data
  const generateChartData = () => {
    const data = []
    const baseValue = sensorData.temperatura || 25
    for (let i = 0; i < 50; i++) {
      // Use temperature as base with some variation
      const variation = Math.sin(i * 0.1 + Date.now() * 0.001) * 2
      data.push(baseValue + variation)
    }
    return data
  }

  // Convert pressure (Pa) to depth (meters) using hydrostatic formula
  const pressureToDepth = (pressurePa: number) => {
    const atmosphericPressure = 101325 // Pa (1 atm)
    const waterDensity = 1025 // kg/m³ (seawater)
    const gravity = 9.81 // m/s²
    
    // P = P₀ + ρgh
    // h = (P - P₀) / (ρg)
    const depth = (pressurePa - atmosphericPressure) / (waterDensity * gravity)
    return Math.max(0, depth) // No negative depths
  }

  // Generate realistic dive profile data with real time progression
  const generateRealisticDiveProfile = () => {
    if (!inspectionStartTime) return []
    
    const data = []
    const elapsed = getElapsedTime()
    
    for (let i = 0; i < 50; i++) {
      // Calculate time for this data point (going back in time)
      const pointTime = Math.max(0, elapsed - (49 - i))
      
      let depth = 0
      
      // Create a realistic dive profile based on elapsed time
      if (pointTime < 20) {
        // Descent phase (0-20 seconds): 0m to 45m
        const descentProgress = pointTime / 20
        depth = 45 * descentProgress + Math.sin(pointTime * 0.1) * 5
      } else if (pointTime < 40) {
        // Deep exploration (20-40 seconds): 35-50m
        depth = 42 + Math.sin(pointTime * 0.15) * 8 + Math.sin(pointTime * 0.05) * 5
      } else if (pointTime < 60) {
        // Mid-depth exploration (40-60 seconds): 15-35m
        depth = 25 + Math.sin(pointTime * 0.2) * 10 + Math.sin(pointTime * 0.1) * 5
      } else if (pointTime < 80) {
        // Deep dive again (60-80 seconds): 25-45m
        depth = 35 + Math.sin(pointTime * 0.12) * 10 + Math.sin(pointTime * 0.08) * 5
      } else if (pointTime < 100) {
        // Shallow exploration (80-100 seconds): 5-25m
        depth = 15 + Math.sin(pointTime * 0.25) * 10 + Math.sin(pointTime * 0.15) * 3
      } else {
        // Ascent phase (100+ seconds): 15m to 0m
        const ascentProgress = Math.min(1, (pointTime - 100) / 20)
        depth = 15 * (1 - ascentProgress) + Math.sin(pointTime * 0.3) * 2
      }
      
      // Add realistic noise
      const noise = (Math.random() - 0.5) * 4 + Math.sin(pointTime * 0.5) * 1
      depth = Math.max(0, depth + noise)
      
      data.push(depth)
    }
    
    return data
  }

  // Generate depth chart data for immersion profile
  const generateDepthChartData = () => {
    if (altitudeHistory.length === 0) {
      // Si no hay datos del sensor, generar perfil de inmersión realista
      // Usar chartUpdateTrigger para forzar recálculo
      return generateRealisticDiveProfile()
    }
    // Usar datos de altitud directamente (convertir a profundidad)
    // Si altitud es positiva (sobre el nivel del mar), la profundidad es 0
    // Si altitud es negativa (bajo el nivel del mar), la profundidad es el valor absoluto
    const depthData = altitudeHistory.map(altitude => {
      const depth = altitude < 0 ? Math.abs(altitude) : 0
      return depth
    })
    return depthData
  }

  // Calculate elapsed time since inspection started
  const getElapsedTime = () => {
    if (!inspectionStartTime) return 0
    return Math.floor((Date.now() - inspectionStartTime) / 1000) // seconds
  }

  // Generate time labels for X-axis based on real elapsed time
  const getTimeLabels = () => {
    const elapsed = getElapsedTime()
    const maxTime = Math.max(45, elapsed) // Show at least 45 seconds or current elapsed time
    
    return {
      start: Math.max(0, elapsed - 45), // Start from 45 seconds ago or 0
      quarter: Math.max(0, elapsed - 34), // 3/4 of the way back
      half: Math.max(0, elapsed - 23), // Half way back
      threeQuarter: Math.max(0, elapsed - 12), // 1/4 of the way back
      end: elapsed // Current time
    }
  }

  const chartData = generateChartData()
  const depthChartData = generateDepthChartData()
  const timeLabels = getTimeLabels()
  
  // Forzar re-render del gráfico cuando cambie el trigger
  useEffect(() => {
    // Este efecto se ejecuta cuando chartUpdateTrigger cambia
  }, [chartUpdateTrigger])

  const handleFullscreen = async () => {
    const container = videoContainerRef.current
    if (!container) return

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
    }
  }

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Inicializando base de datos...</p>
        </div>
      </div>
    )
  }

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
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {/* Datos básicos */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-primary">Datos Básicos</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temperatura:</span>
                        <span className="font-medium">{sensorData.temperatura.toFixed(1)}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Humedad:</span>
                        <span className="font-medium">{sensorData.humedad.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distancia:</span>
                        <span className="font-medium">{sensorData.distancia.toFixed(1)} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Motor:</span>
                        <span className="font-medium">{sensorData.motor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Datos ambientales */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-primary">Ambientales</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sonido:</span>
                        <span className="font-medium">{sensorData.sound_level?.toFixed(0) || 0} dB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Altitud:</span>
                        <span className="font-medium">{sensorData.altitude?.toFixed(1) || 0} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Presión:</span>
                        <span className="font-medium">{sensorData.pressure?.toFixed(0) || 0} Pa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Obstáculos:</span>
                        <span className={`font-medium ${sensorData.obstacles ? 'text-red-500' : 'text-green-500'}`}>
                          {sensorData.obstacles ? 'Sí' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Aceleración */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-primary">Aceleración (m/s²)</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-muted-foreground">X</div>
                        <div className="font-medium">{sensorData.acceleration_x?.toFixed(2) || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Y</div>
                        <div className="font-medium">{sensorData.acceleration_y?.toFixed(2) || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Z</div>
                        <div className="font-medium">{sensorData.acceleration_z?.toFixed(2) || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* Rotación */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-primary">Rotación (rad/s)</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-muted-foreground">X</div>
                        <div className="font-medium">{sensorData.rotation_x?.toFixed(3) || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Y</div>
                        <div className="font-medium">{sensorData.rotation_y?.toFixed(3) || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Z</div>
                        <div className="font-medium">{sensorData.rotation_z?.toFixed(3) || 0}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <Label htmlFor="mswitch" className="text-sm text-muted-foreground">Mediciones</Label>
                    <Switch id="mswitch" checked={measurementOn} onCheckedChange={toggleMeasurement} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main video area */}
        <div 
          ref={videoContainerRef}
          className="relative bg-card rounded-lg overflow-hidden mb-6"
        >
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
              {measurementText && (
                <div className="bg-black/70 text-white px-3 py-2 rounded text-xs max-w-[50%] truncate">
                  {measurementText}
                </div>
              )}
              {isRecording && (
                <div className="bg-red-600 text-white px-3 py-2 rounded flex items-center gap-2 text-sm">
                  <Circle className="w-3 h-3 fill-current animate-pulse" />
                  REC {formatTime(recordingTime)}
                </div>
              )}
            </div>

            {/* Sensor data overlay - Top right */}
            <div className="absolute top-4 right-4 space-y-2">
              <div className="bg-black/70 text-white px-3 py-2 rounded text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">T:</span>
                  <span className="font-medium">{sensorData.temperatura.toFixed(1)}°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">H:</span>
                  <span className="font-medium">{sensorData.humedad.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">D:</span>
                  <span className="font-medium">{sensorData.distancia.toFixed(1)}cm</span>
                </div>
                {sensorData.obstacles !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Obs:</span>
                    <span className={`font-medium ${sensorData.obstacles ? 'text-red-400' : 'text-green-400'}`}>
                      {sensorData.obstacles ? 'Sí' : 'No'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom left - Altitude chart and rotation indicators */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2">
              {/* Gráfico de Perfil de Inmersión (Profundidad) */}
              <div className="bg-black/80 text-white p-3 rounded border border-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-blue-300">Perfil de Inmersión</div>
                  {altitudeHistory.length === 0 && (
                    <div className="text-xs text-yellow-400">SIM</div>
                  )}
                </div>
                <svg width="120" height="60" className="text-blue-400">
                  {/* Grid lines for depth reference */}
                  <defs>
                    <pattern id="depthGrid" width="24" height="12" patternUnits="userSpaceOnUse">
                      <path d="M 0 12 L 24 12" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="0.5"/>
                    </pattern>
                    {/* Clipping path to prevent line from overlapping with axis labels */}
                    <clipPath id="chartClip">
                      <rect x="18" y="0" width="102" height="52"/>
                    </clipPath>
                  </defs>
                  <rect width="120" height="60" fill="url(#depthGrid)" opacity="0.3"/>
                  
                  {/* Time reference lines - clipped to avoid X-axis overlap */}
                  <line x1="18" y1="0" x2="18" y2="52" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                  <line x1="44" y1="0" x2="44" y2="52" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                  <line x1="70" y1="0" x2="70" y2="52" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                  <line x1="96" y1="0" x2="96" y2="52" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                  <line x1="120" y1="0" x2="120" y2="52" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                  
                  {/* Chart area with clipping */}
                  <g clipPath="url(#chartClip)">
                    {/* Depth profile line */}
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={depthChartData.map((depth, index) => {
                        // Normalizar profundidad: 0-50m -> 0-52 píxeles (invertido para que 0m esté arriba)
                        // Ajustar posición X para que empiece después de las etiquetas y use todo el ancho
                        const x = 18 + (index * 2.04) // Empezar en x=18, espaciado de 2.04 para llegar a 120
                        const normalizedDepth = Math.max(0, Math.min(52, (depth / 50) * 52))
                        return `${x},${normalizedDepth}`
                      }).join(" ")}
                    />
                    
                    {/* Current depth indicator */}
                    <circle
                      cx={depthChartData.length > 0 ? 18 + ((depthChartData.length - 1) * 2.04) : 18}
                      cy={depthChartData.length > 0 ? Math.max(0, Math.min(52, (depthChartData[depthChartData.length - 1] / 50) * 52)) : 0}
                      r="3"
                      fill="currentColor"
                      className="text-yellow-400"
                    />
                  </g>
                  
                  {/* Depth scale markers - positioned to match the chart scale */}
                  <text x="2" y="8" fontSize="7" fill="rgba(255,255,255,0.8)">0m</text>
                  <text x="2" y="22" fontSize="7" fill="rgba(255,255,255,0.8)">25m</text>
                  <text x="2" y="36" fontSize="7" fill="rgba(255,255,255,0.8)">40m</text>
                  <text x="2" y="50" fontSize="7" fill="rgba(255,255,255,0.8)">50m</text>
                  
                  {/* Time scale markers on X-axis - Real elapsed time */}
                  <text x="18" y="58" fontSize="6" fill="rgba(255,255,255,0.7)" textAnchor="start">{timeLabels.start}s</text>
                  <text x="44" y="58" fontSize="6" fill="rgba(255,255,255,0.7)" textAnchor="middle">{timeLabels.quarter}s</text>
                  <text x="70" y="58" fontSize="6" fill="rgba(255,255,255,0.7)" textAnchor="middle">{timeLabels.half}s</text>
                  <text x="96" y="58" fontSize="6" fill="rgba(255,255,255,0.7)" textAnchor="middle">{timeLabels.threeQuarter}s</text>
                  <text x="120" y="58" fontSize="6" fill="rgba(255,255,255,0.7)" textAnchor="end">{timeLabels.end}s</text>
                </svg>
                <div className="text-xs mt-1 text-center">
                  <div className="flex justify-between">
                    <span className="text-blue-300">
                      Profundidad: {altitudeHistory.length > 0 ? 
                        (sensorData.altitude && sensorData.altitude < 0 ? Math.abs(sensorData.altitude).toFixed(1) : '0.0') + 'm' : 
                        depthChartData[depthChartData.length - 1]?.toFixed(1) + 'm (SIM)'
                      }
                    </span>
                    <span className="text-green-300">
                      Tiempo: {getElapsedTime()}s
                    </span>
                  </div>
                  {isRecording && (
                    <div className="text-xs text-yellow-400 mt-1">
                      📊 Generando gráficos en tiempo real
                    </div>
                  )}
                </div>
              </div>
              
              {/* Rotation indicators */}
              <div className="bg-black/70 text-white px-3 py-2 rounded text-sm">
                <div className="text-xs text-muted-foreground mb-1">Rotaciones (rad/s)</div>
                <div className="flex gap-3 text-xs">
                  <div>X: {sensorData.rotation_x?.toFixed(3) || '0.000'}</div>
                  <div>Y: {sensorData.rotation_y?.toFixed(3) || '0.000'}</div>
                  <div>Z: {sensorData.rotation_z?.toFixed(3) || '0.000'}</div>
                </div>
              </div>
            </div>

            {/* Bottom right - Temperature chart and fullscreen button */}
            <div className="absolute bottom-4 right-4 flex items-end gap-2">
              {/* Gráfico de Temperatura */}
              <div className="bg-black/70 text-white p-3 rounded">
                <div className="text-xs mb-2">Temperatura en tiempo real</div>
                <svg width="120" height="60" className="text-primary">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    points={chartData.map((value, index) => `${index * 2.4},${60 - (value - 20) * 2}`).join(" ")}
                  />
                </svg>
                <div className="text-xs mt-1 text-center">
                  {sensorData.temperatura.toFixed(1)}°C
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
                className="bg-black/70 hover:bg-black/80 text-white"
              >
                {isFullscreen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </Button>
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
            onClick={handleFinalizar} 
            disabled={isSaving}
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-foreground mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Finalizar
              </>
            )}
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
                    <div key={index} className="relative group">
                      <img
                        src={frame || "/placeholder.svg"}
                        alt={`Captura ${index + 1}`}
                        className="w-full h-20 object-cover rounded border border-border"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleEliminarFrame(index)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
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
                    <div key={index} className="flex items-center gap-2 group">
                      <div className="relative">
                        <video src={recording} className="w-40 h-24 bg-black rounded" controls />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleEliminarRecording(index)}
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Grabación {index + 1}</div>
                        <div className="text-xs text-muted-foreground">webm local</div>
                      </div>
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
        
        {/* Chart capture component */}
        <ChartCapture
          ref={chartCaptureRef}
          temperatureData={temperatureHistory}
          altitudeData={altitudeHistory}
          inspectionStartTime={inspectionStartTime || Date.now()}
          onChartCaptured={setSensorCharts}
        />
      </div>
    </div>
  )
}
