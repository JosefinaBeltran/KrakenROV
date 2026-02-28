"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Check,
  User,
  Calendar,
  Clock,
  Youtube,
  Video,
  FolderOpen,
  Camera,
  Trash2,
} from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
import { VideoControls } from "@/components/VideoControls"

interface Inspeccion {
  id: string
  nombreInspeccion: string
  lugarInspeccion: string
  fechaInspeccion: string
  descripcion: string
  nombreApellido: string
  matricula: string
  capturedFrames: string[]
  recordingTime: number
  recordings?: string[] // Added recordings array for multiple recordings
  createdAt: string
  updatedAt?: string
  createdBy?: string
  syncedToCloud?: boolean
  youtubeLink?: string
}

export default function VisorVideoPage() {
  const router = useRouter()
  const params = useParams()
  const { getInspeccionById, updateInspeccion } = useDatabase()
  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null)
  const [isLoadingInspeccion, setIsLoadingInspeccion] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [youtubeLink, setYoutubeLink] = useState("")
  const [linkSaved, setLinkSaved] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRecording, setSelectedRecording] = useState(0) // Added state for selected recording
  const [isSeeking, setIsSeeking] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [showDeleteFrameDialog, setShowDeleteFrameDialog] = useState(false)
  const [frameToDelete, setFrameToDelete] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoContainerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const loadInspeccion = async () => {
      if (!params?.id) {
        setIsLoadingInspeccion(false)
        return
      }
      console.log('Loading inspeccion for video viewer, ID:', params.id)
      try {
        const found = await getInspeccionById(params.id as string)
        console.log('Found inspeccion for video viewer:', found)
        if (found) {
          setInspeccion(found)
          setYoutubeLink(found.youtubeLink || "")
        }
      } catch (error) {
        console.error('Error loading inspeccion:', error)
        // Fallback to localStorage
        const data = localStorage.getItem("inspecciones")
        if (data) {
          const inspecciones: Inspeccion[] = JSON.parse(data)
          const found = inspecciones.find((i) => i.id === params.id)
          if (found) {
            setInspeccion(found)
            setYoutubeLink(found.youtubeLink || "")
          }
        }
      } finally {
        setIsLoadingInspeccion(false)
      }
    }
    
    loadInspeccion()
  }, [params?.id, getInspeccionById])

  // Wire up HTML5 video events for real playback
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateDuration = () => {
      const videoDuration = video.duration
      console.log('Checking video duration:', videoDuration, 'readyState:', video.readyState)
      if (videoDuration && isFinite(videoDuration) && !isNaN(videoDuration) && videoDuration > 0) {
        console.log('Setting duration to:', videoDuration)
        setDuration(videoDuration)
      } else {
        console.log('Duration not valid yet:', videoDuration)
        // Don't set invalid durations
        if (videoDuration === Infinity || isNaN(videoDuration)) {
          console.warn('Invalid duration detected, not updating state')
        }
      }
    }

    const onLoaded = () => {
      console.log('loadedmetadata event fired')
      updateDuration()
    }
    
    const onLoadedData = () => {
      console.log('loadeddata event fired')
      updateDuration()
    }
    
    const onCanPlay = () => {
      console.log('canplay event fired')
      updateDuration()
    }
    
    const onCanPlayThrough = () => {
      console.log('canplaythrough event fired')
      updateDuration()
    }
    
    const onDurationChange = () => {
      console.log('durationchange event fired')
      updateDuration()
    }
    
    const onTime = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime || 0)
      }
    }
    
    const onEnd = () => setIsPlaying(false)

    video.addEventListener("loadedmetadata", onLoaded)
    video.addEventListener("loadeddata", onLoadedData)
    video.addEventListener("canplay", onCanPlay)
    video.addEventListener("canplaythrough", onCanPlayThrough)
    video.addEventListener("durationchange", onDurationChange)
    video.addEventListener("timeupdate", onTime)
    video.addEventListener("ended", onEnd)
    
    // Try to get duration immediately if video is already loaded
    if (video.readyState >= 1) {
      console.log('Video already loaded, checking duration immediately')
      updateDuration()
    }
    
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded)
      video.removeEventListener("loadeddata", onLoadedData)
      video.removeEventListener("canplay", onCanPlay)
      video.removeEventListener("canplaythrough", onCanPlayThrough)
      video.removeEventListener("durationchange", onDurationChange)
      video.removeEventListener("timeupdate", onTime)
      video.removeEventListener("ended", onEnd)
    }
  }, [isSeeking])

  // Convert base64 data URL to blob URL for better video handling
  useEffect(() => {
    let currentBlobUrl: string | null = null

    const convertToBlob = async () => {
      if (!inspeccion || !inspeccion.recordings || inspeccion.recordings.length === 0) {
        setVideoBlobUrl(null)
        setIsVideoLoading(false)
        return
      }

      const currentDataUrl = inspeccion.recordings[selectedRecording]
      if (!currentDataUrl) {
        setVideoBlobUrl(null)
        setIsVideoLoading(false)
        return
      }

      try {
        setIsVideoLoading(true)
        console.log('Converting base64 to blob URL for recording:', selectedRecording)
        // Fetch the data URL and convert to blob
        const response = await fetch(currentDataUrl)
        const blob = await response.blob()
        currentBlobUrl = URL.createObjectURL(blob)
        
        console.log('Blob URL created successfully:', currentBlobUrl.substring(0, 50) + '...', 'Blob size:', blob.size, 'bytes')
        setVideoBlobUrl(currentBlobUrl)
      } catch (error) {
        console.error('Error converting to blob URL:', error)
        // Fallback to using data URL directly
        setVideoBlobUrl(currentDataUrl)
        setIsVideoLoading(false)
      }
    }

    convertToBlob()

    // Cleanup on unmount or when recording changes
    return () => {
      if (currentBlobUrl) {
        console.log('Revoking blob URL:', currentBlobUrl.substring(0, 50) + '...')
        URL.revokeObjectURL(currentBlobUrl)
      }
    }
  }, [selectedRecording, inspeccion])

  // Reset video when blob URL changes
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    if (!videoBlobUrl) {
      console.log('No video source available')
      setDuration(0)
      setCurrentTime(0)
      setIsPlaying(false)
      setIsVideoLoading(false)
      return
    }
    
    console.log('Video blob URL changed, resetting player')
    video.pause()
    video.currentTime = 0
    setCurrentTime(0)
    setIsPlaying(false)
    setDuration(0)
    
    // Force video to reload with new source and load metadata
    video.load()
    
    // Try to load metadata immediately
    if (video.readyState === 0) {
      // Video hasn't started loading, force it
      video.load()
    }
    
    // Add listeners to track loading progress
    const checkDuration = () => {
      const videoDuration = video.duration
      console.log('Video metadata loaded, duration:', videoDuration, 'readyState:', video.readyState)
      if (videoDuration && isFinite(videoDuration) && !isNaN(videoDuration) && videoDuration > 0) {
        console.log('Setting duration to:', videoDuration)
        setDuration(videoDuration)
        setIsVideoLoading(false)
      } else {
        console.warn('Invalid duration received:', videoDuration)
      }
    }
    
    const onDurationChange = () => {
      const videoDuration = video.duration
      console.log('Duration changed event, duration:', videoDuration)
      if (videoDuration && isFinite(videoDuration) && !isNaN(videoDuration) && videoDuration > 0) {
        console.log('Setting duration from durationchange event:', videoDuration)
        setDuration(videoDuration)
        setIsVideoLoading(false)
      }
    }
    
    const onCanPlay = () => {
      const videoDuration = video.duration
      console.log('Video can play, duration:', videoDuration)
      // Double-check duration when video can play
      if (videoDuration && isFinite(videoDuration) && !isNaN(videoDuration) && videoDuration > 0) {
        setDuration(videoDuration)
      }
      setIsVideoLoading(false)
    }
    
    const onError = (e: Event) => {
      console.error('Video loading error:', e)
      setDuration(0)
      setIsVideoLoading(false)
    }
    
    // Set up a polling mechanism to check duration if metadata doesn't load immediately
    let durationCheckInterval: NodeJS.Timeout | null = null
    let checkCount = 0
    const maxChecks = 40 // Check for up to 20 seconds (40 * 500ms)
    
    const checkDurationPolling = () => {
      const videoDuration = video.duration
      if (videoDuration && isFinite(videoDuration) && !isNaN(videoDuration) && videoDuration > 0) {
        console.log('Duration found via polling:', videoDuration)
        setDuration(videoDuration)
        if (durationCheckInterval) {
          clearInterval(durationCheckInterval)
          durationCheckInterval = null
        }
        setIsVideoLoading(false)
        return true
      }
      return false
    }
    
    const startDurationPolling = () => {
      if (durationCheckInterval) return
      
      // Check immediately first
      if (checkDurationPolling()) {
        return
      }
      
      // Then check every 200ms for faster response
      durationCheckInterval = setInterval(() => {
        checkCount++
        if (checkDurationPolling()) {
          return
        }
        if (checkCount >= maxChecks) {
          console.warn('Duration polling timeout, stopping checks')
          if (durationCheckInterval) {
            clearInterval(durationCheckInterval)
            durationCheckInterval = null
          }
        }
      }, 200)
    }
    
    video.addEventListener('loadedmetadata', checkDuration, { once: true })
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('canplay', onCanPlay, { once: true })
    video.addEventListener('error', onError, { once: true })
    
    // Start polling as backup
    startDurationPolling()
    
    return () => {
      video.removeEventListener('loadedmetadata', checkDuration)
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('error', onError)
      if (durationCheckInterval) {
        clearInterval(durationCheckInterval)
      }
    }
  }, [videoBlobUrl])

  const formatTime = (seconds: number) => {
    // Validate that seconds is a finite number
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return "00:00:00"
    }
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("es-ES")
  }

  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      void video.play()
      setIsPlaying(true)
    }
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  const handleSeekKeyboard = (direction: 'forward' | 'backward') => {
    const video = videoRef.current
    if (!video) return
    
    const seekAmount = 10 // 10 seconds
    const newTime = direction === 'forward' 
      ? Math.min(video.currentTime + seekAmount, duration)
      : Math.max(video.currentTime - seekAmount, 0)
    
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (direction: 'up' | 'down') => {
    const video = videoRef.current
    if (!video) return
    
    const volumeChange = 0.1
    const newVolume = direction === 'up' 
      ? Math.min((video.volume || 0) + volumeChange, 1)
      : Math.max((video.volume || 0) - volumeChange, 0)
    
    video.volume = newVolume
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const handleSaveYoutubeLink = async () => {
    if (!inspeccion || !youtubeLink.trim()) return

    try {
      const updatedInspeccion = {
        ...inspeccion,
        youtubeLink: youtubeLink.trim(),
        updatedAt: new Date().toISOString(),
        createdBy: inspeccion.createdBy || '',
        syncedToCloud: inspeccion.syncedToCloud ?? false
      }
      await updateInspeccion(updatedInspeccion as any)
      setInspeccion(updatedInspeccion)
      setLinkSaved(true)
      setIsDialogOpen(false)
      setTimeout(() => setLinkSaved(false), 3000)
    } catch (error) {
      console.error('Error saving youtube link:', error)
      // Fallback to localStorage
      const data = localStorage.getItem("inspecciones")
      if (data) {
        const inspecciones: Inspeccion[] = JSON.parse(data)
        const updatedInspecciones = inspecciones.map((i) =>
          i.id === inspeccion.id ? { ...i, youtubeLink: youtubeLink.trim() } : i,
        )
        localStorage.setItem("inspecciones", JSON.stringify(updatedInspecciones))
        setInspeccion({ ...inspeccion, youtubeLink: youtubeLink.trim() })
        setLinkSaved(true)
        setIsDialogOpen(false)
        setTimeout(() => setLinkSaved(false), 3000)
      }
    }
  }

  const handleOpenFileExplorer = async () => {
    if (!inspeccion || !inspeccion.recordings || inspeccion.recordings.length === 0) {
      toast.error("No hay grabaciones disponibles para descargar")
      return
    }

    // Get the selected recording
    const selectedVideoData = inspeccion.recordings[selectedRecording]
    if (!selectedVideoData) {
      toast.error("No hay video seleccionado")
      return
    }

    try {
      // Convert base64 to blob
      const response = await fetch(selectedVideoData)
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `inspeccion_${inspeccion.nombreInspeccion.replace(/\s+/g, '_')}_${selectedRecording + 1}.webm`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      window.URL.revokeObjectURL(url)
      
      toast.success("Video descargado exitosamente. Puedes encontrarlo en tu carpeta de Descargas.")
    } catch (error) {
      console.error('Error downloading video:', error)
      toast.error("Error al descargar el video. Por favor, inténtalo nuevamente.")
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, clickX / rect.width)) // Clamp between 0 and 1
    
    // Validate that duration is a finite number
    if (!isFinite(duration) || duration <= 0) {
      console.warn('Invalid duration:', duration)
      return
    }
    
    const newTime = percentage * duration
    
    // Validate that newTime is a finite number before setting
    if (!isFinite(newTime) || newTime < 0) {
      console.warn('Invalid newTime calculated:', newTime, { percentage, duration })
      return
    }
    
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleSeekStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const video = videoRef.current
    if (!video || !duration) {
      console.log('Cannot seek - video or duration not available', { video: !!video, duration })
      return
    }

    // Validate that duration is a finite number
    if (!isFinite(duration) || duration <= 0) {
      console.warn('Invalid duration in handleSeekStart:', duration)
      return
    }

    setIsSeeking(true)
    handleSeek(e)
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const video = videoRef.current
      const target = e.currentTarget
      if (!video || !duration || !target) return

      // Validate that duration is still a finite number
      if (!isFinite(duration) || duration <= 0) {
        return
      }

      const rect = target.getBoundingClientRect()
      const clickX = moveEvent.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, clickX / rect.width))
      const newTime = percentage * duration
      
      // Validate that newTime is a finite number before setting
      if (!isFinite(newTime) || newTime < 0) {
        return
      }
      
      video.currentTime = newTime
      setCurrentTime(newTime)
    }

    const handleMouseUp = () => {
      setIsSeeking(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

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

  const handleCapturar = async () => {
    const video = videoRef.current
    if (!video || !inspeccion) return

    setIsCapturing(true)
    try {
      // Crear un canvas temporal si no existe
      let canvas = canvasRef.current
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvasRef.current = canvas
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('No se pudo obtener el contexto del canvas')
        return
      }

      // Establecer las dimensiones del canvas iguales al video
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480

      // Dibujar el frame actual del video en el canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convertir el canvas a base64
      const frameData = canvas.toDataURL('image/jpeg', 0.9)

      // Agregar la captura al array de capturedFrames
      const updatedFrames = [...(inspeccion.capturedFrames || []), frameData]

      // Actualizar la inspección
      const updatedInspeccion = {
        ...inspeccion,
        capturedFrames: updatedFrames,
        updatedAt: new Date().toISOString(),
        createdBy: inspeccion.createdBy || '',
        syncedToCloud: inspeccion.syncedToCloud ?? false
      }

      // Guardar en la base de datos
      await updateInspeccion(updatedInspeccion as any)
      setInspeccion(updatedInspeccion)

      console.log('Frame capturado exitosamente. Total de capturas:', updatedFrames.length)
    } catch (error) {
      console.error('Error al capturar frame:', error)
      toast.error('Error al capturar el frame. Por favor, inténtalo nuevamente.')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleEliminarFrame = (index: number) => {
    setFrameToDelete(index)
    setShowDeleteFrameDialog(true)
  }

  const handleConfirmDeleteFrame = async () => {
    if (frameToDelete === null || !inspeccion) return

    try {
      // Eliminar el frame del array
      const updatedFrames = inspeccion.capturedFrames.filter((_, i) => i !== frameToDelete)

      // Actualizar la inspección
      const updatedInspeccion = {
        ...inspeccion,
        capturedFrames: updatedFrames,
        updatedAt: new Date().toISOString(),
        createdBy: inspeccion.createdBy || '',
        syncedToCloud: inspeccion.syncedToCloud ?? false
      }

      // Guardar en la base de datos
      await updateInspeccion(updatedInspeccion as any)
      setInspeccion(updatedInspeccion)

      setFrameToDelete(null)
      setShowDeleteFrameDialog(false)
    } catch (error) {
      console.error('Error al eliminar frame:', error)
      toast.error('Error al eliminar el frame. Por favor, inténtalo nuevamente.')
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

  if (isLoadingInspeccion) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Cargando...</h3>
            <p className="text-muted-foreground">Obteniendo datos del visor de video</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!inspeccion) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Inspección no encontrada</h3>
            <p className="text-muted-foreground mb-6">La inspección solicitada no existe o ha sido eliminada.</p>
            <Button
              onClick={() => router.push("/listado-inspecciones")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Volver al Listado
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalRecordings = inspeccion.recordings?.length || 0
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="min-h-screen bg-background p-4">
      <VideoControls
        onPlayPause={handlePlayPause}
        onSeek={handleSeekKeyboard}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleMuteToggle}
        onToggleFullscreen={handleFullscreen}
        onToggleFullscreenExit={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen()
          }
        }}
      />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push(`/detalle-inspeccion/${inspeccion.id}`)}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Visor de Video</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video player */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{inspeccion.nombreInspeccion}</CardTitle>
                {totalRecordings > 1 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Video className="w-4 h-4" />
                    <span>
                      Grabación {selectedRecording + 1} de {totalRecordings}
                    </span>
                    <div className="flex gap-1 ml-2">
                      {Array.from({ length: totalRecordings }, (_, i) => (
                        <Button
                          key={i}
                          variant={selectedRecording === i ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedRecording(i)}
                          className="w-8 h-8 p-0"
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {/* Video area */}
                <div 
                  ref={videoContainerRef}
                  className="relative bg-muted aspect-video flex items-center justify-center"
                >
                  {/* Hidden canvas for frame capture */}
                  <canvas ref={canvasRef} className="hidden" />
                  {videoBlobUrl ? (
                    <video
                      key={videoBlobUrl}
                      ref={videoRef}
                      src={videoBlobUrl}
                      controls={false}
                      muted={isMuted}
                      className="w-full h-full object-contain bg-black"
                      preload="metadata"
                      playsInline
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                          <Video className="w-12 h-12 text-primary" />
                        </div>
                        <p className="text-white text-lg font-semibold">Sin grabaciones</p>
                        <p className="text-white/70 text-sm mt-2">{inspeccion.lugarInspeccion}</p>
                      </div>
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isVideoLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2"></div>
                        <p className="text-white text-sm">Cargando video...</p>
                      </div>
                    </div>
                  )}

                  {/* Play button overlay */}
                  {videoBlobUrl && !isPlaying && !isVideoLoading && (
                    <Button
                      onClick={handlePlayPause}
                      size="lg"
                      className="absolute bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-16 h-16 p-0"
                    >
                      <Play className="w-8 h-8 ml-1" />
                    </Button>
                  )}
                </div>

                {/* Video controls */}
                <div className="p-4 bg-card border-t border-border">
                  {/* Interactive Progress bar */}
                  <div className="mb-4">
                    <div 
                      className="relative w-full bg-muted rounded-full h-2.5 cursor-pointer hover:h-3 transition-all duration-200 group"
                      onMouseDown={handleSeekStart}
                      title={`${formatTime(currentTime)} / ${formatTime(duration)}`}
                    >
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-100 pointer-events-none"
                        style={{ width: `${progressPercentage}%` }}
                      />
                      {/* Seek indicator */}
                      <div 
                        className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-2 border-background shadow-lg pointer-events-none"
                        style={{ left: `${progressPercentage}%`, marginLeft: '-6px' }}
                      />
                    </div>
                    {/* Time display */}
                    <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Control buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={handlePlayPause}>
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleMuteToggle}>
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleCapturar}
                        disabled={isCapturing || !videoBlobUrl}
                        title="Capturar frame del video"
                        className="text-primary hover:text-primary/80"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                        className="text-xs"
                      >
                        ⌨️
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleFullscreen}>
                        {isFullscreen ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
                          </svg>
                        ) : (
                          <Maximize className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Captured frames section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl">Capturas Realizadas ({inspeccion.capturedFrames?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {inspeccion.capturedFrames && inspeccion.capturedFrames.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {inspeccion.capturedFrames.map((frame, index) => (
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
                          title="Eliminar captura"
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
          </div>

          {/* Metadata sidebar */}
          <div className="space-y-6">
            {/* Inspector info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Operador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-lg">{inspeccion.nombreApellido}</p>
                <p className="text-sm text-muted-foreground">Matrícula: {inspeccion.matricula}</p>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha/Hora</p>
                    <p className="font-medium">{formatDateTime(inspeccion.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duración total de la inspección</p>
                    <p className="font-medium">{formatTime(inspeccion.recordingTime)}</p>
                  </div>
                </div>

                {totalRecordings > 1 && (
                  <div className="flex items-center gap-3">
                    <Video className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total de grabaciones</p>
                      <p className="font-medium">{totalRecordings}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* YouTube link management */}
            <Card>
              <CardHeader>
                <CardTitle>Video en YouTube</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspeccion.youtubeLink ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Enlace guardado:</p>
                      <a
                        href={inspeccion.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline text-sm break-all"
                      >
                        {inspeccion.youtubeLink}
                      </a>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1 min-w-0 border-border hover:bg-secondary bg-transparent">
                            <Youtube className="w-4 h-4 mr-2 shrink-0" />
                            <span className="truncate">Actualizar Enlace</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Actualizar Enlace de YouTube</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              value={youtubeLink}
                              onChange={(e) => setYoutubeLink(e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="bg-secondary border-border"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveYoutubeLink}
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                              >
                                Guardar
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className="border-border hover:bg-secondary bg-transparent"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        onClick={handleOpenFileExplorer}
                        disabled={!inspeccion.recordings || inspeccion.recordings.length === 0}
                        variant="outline"
                        className="flex-1 min-w-0 border-border hover:bg-secondary bg-transparent"
                      >
                        <FolderOpen className="w-4 h-4 mr-2 shrink-0" />
                        <span className="truncate">Descargar Video</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={handleOpenFileExplorer}
                        disabled={!inspeccion.recordings || inspeccion.recordings.length === 0}
                        variant="outline"
                        className="flex-1 min-w-0 border-border hover:bg-secondary bg-transparent"
                      >
                        <FolderOpen className="w-4 h-4 mr-2 shrink-0" />
                        <span className="truncate">Descargar Video</span>
                      </Button>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1 min-w-0 border-border hover:bg-secondary bg-transparent">
                            <Youtube className="w-4 h-4 mr-2 shrink-0" />
                            <span className="truncate">Agregar Enlace</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Agregar Enlace de YouTube</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              value={youtubeLink}
                              onChange={(e) => setYoutubeLink(e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="bg-secondary border-border"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveYoutubeLink}
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                              >
                                Guardar
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className="border-border hover:bg-secondary bg-transparent"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}

                {linkSaved && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Check className="w-4 h-4" />
                    Enlace guardado correctamente
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Keyboard shortcuts modal */}
        {showKeyboardShortcuts && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Atajos de Teclado</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Espacio</span>
                  <span className="text-muted-foreground">Reproducir/Pausar</span>
                </div>
                <div className="flex justify-between">
                  <span>← →</span>
                  <span className="text-muted-foreground">Retroceder/Avanzar 10s</span>
                </div>
                <div className="flex justify-between">
                  <span>↑ ↓</span>
                  <span className="text-muted-foreground">Subir/Bajar volumen</span>
                </div>
                <div className="flex justify-between">
                  <span>F</span>
                  <span className="text-muted-foreground">Pantalla completa</span>
                </div>
                <div className="flex justify-between">
                  <span>M</span>
                  <span className="text-muted-foreground">Silenciar/Activar</span>
                </div>
                <div className="flex justify-between">
                  <span>Esc</span>
                  <span className="text-muted-foreground">Salir pantalla completa</span>
                </div>
              </div>
              <Button 
                onClick={() => setShowKeyboardShortcuts(false)}
                className="w-full mt-4"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {/* Diálogo de confirmación para eliminar captura */}
        <AlertDialog 
          open={showDeleteFrameDialog} 
          onOpenChange={(open) => {
            setShowDeleteFrameDialog(open)
            if (!open) {
              setFrameToDelete(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar captura?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro que desea eliminar esta captura? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDeleteFrame} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
