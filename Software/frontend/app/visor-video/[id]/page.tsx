"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  Upload,
  Loader2,
  FolderOpen,
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
  youtubeLink?: string
}

export default function VisorVideoPage() {
  const router = useRouter()
  const params = useParams()
  const { getInspeccionById, updateInspeccion } = useDatabase()
  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [youtubeLink, setYoutubeLink] = useState("")
  const [linkSaved, setLinkSaved] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRecording, setSelectedRecording] = useState(0) // Added state for selected recording
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const loadInspeccion = async () => {
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
      }
    }
    
    loadInspeccion()
    // Check authentication status
    checkAuthStatus()
  }, [params.id, getInspeccionById])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
    } catch (error) {
      console.log('Auth check failed:', error)
      setIsAuthenticated(false)
    }
  }

  // Check for auth success in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const authStatus = urlParams.get('auth')
    
    if (authStatus === 'success') {
      setIsAuthenticated(true)
      console.log('OAuth2 authentication successful')
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (authStatus === 'demo') {
      setIsAuthenticated(true)
      console.log('Demo mode activated')
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    if (urlParams.get('error')) {
      console.error('Auth error:', urlParams.get('error'))
      alert(`Error de autenticación: ${urlParams.get('error')}`)
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Wire up HTML5 video events for real playback
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onLoaded = () => setDuration(Math.floor(video.duration || 0))
    const onTime = () => setCurrentTime(Math.floor(video.currentTime || 0))
    const onEnd = () => setIsPlaying(false)

    video.addEventListener("loadedmetadata", onLoaded)
    video.addEventListener("timeupdate", onTime)
    video.addEventListener("ended", onEnd)
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded)
      video.removeEventListener("timeupdate", onTime)
      video.removeEventListener("ended", onEnd)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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
        youtubeLink: youtubeLink.trim()
      }
      await updateInspeccion(updatedInspeccion)
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

  const handleAuthenticateWithGoogle = () => {
    window.location.href = '/api/auth/google'
  }

  const handleOpenFileExplorer = async () => {
    if (!inspeccion || !inspeccion.recordings || inspeccion.recordings.length === 0) {
      alert("No hay grabaciones disponibles para descargar")
      return
    }

    // Get the selected recording
    const selectedVideoData = inspeccion.recordings[selectedRecording]
    if (!selectedVideoData) {
      alert("No hay video seleccionado")
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
      
      alert("Video descargado exitosamente. Puedes encontrarlo en tu carpeta de Descargas.")
    } catch (error) {
      console.error('Error downloading video:', error)
      alert("Error al descargar el video. Por favor, inténtalo nuevamente.")
    }
  }

  const handleUploadToYouTube = async () => {
    if (!inspeccion || !inspeccion.recordings || inspeccion.recordings.length === 0) {
      alert("No hay grabaciones disponibles para subir")
      return
    }

    if (!isAuthenticated) {
      const shouldAuth = confirm("Para subir videos a YouTube necesitas autenticarte con Google. ¿Quieres continuar?")
      if (shouldAuth) {
        handleAuthenticateWithGoogle()
      }
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Get the selected recording
      const selectedVideoData = inspeccion.recordings[selectedRecording]
      if (!selectedVideoData) {
        throw new Error("No hay video seleccionado")
      }

      // Convert base64 to blob
      const response = await fetch(selectedVideoData)
      const blob = await response.blob()

      // Create FormData for upload
      const formData = new FormData()
      formData.append('video', blob, `inspeccion_${inspeccion.id}_${selectedRecording + 1}.webm`)
      formData.append('title', inspeccion.nombreInspeccion) // Solo el nombre de la inspección
      formData.append('description', `Inspección realizada en ${inspeccion.lugarInspeccion} el ${new Date(inspeccion.fechaInspeccion).toLocaleDateString('es-ES')}. Inspector: ${inspeccion.nombreApellido}`)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 10
        })
      }, 500)

      // Upload to YouTube
      const uploadResponse = await fetch('/api/upload-youtube', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        if (errorData.needsAuth) {
          setIsAuthenticated(false)
          throw new Error('Sesión expirada. Por favor, auténtica nuevamente con Google.')
        }
        throw new Error(errorData.error || 'Error al subir el video')
      }

      const result = await uploadResponse.json()
      const youtubeUrl = `https://www.youtube.com/watch?v=${result.videoId}`

      // Save the YouTube link
      try {
        const updatedInspeccion = {
          ...inspeccion,
          youtubeLink: youtubeUrl
        }
        await updateInspeccion(updatedInspeccion)
        setInspeccion(updatedInspeccion)
        setLinkSaved(true)
        setTimeout(() => setLinkSaved(false), 5000)
      } catch (error) {
        console.error('Error saving youtube link after upload:', error)
        // Fallback to localStorage
        const data = localStorage.getItem("inspecciones")
        if (data) {
          const inspecciones: Inspeccion[] = JSON.parse(data)
          const updatedInspecciones = inspecciones.map((i) =>
            i.id === inspeccion.id ? { ...i, youtubeLink: youtubeUrl } : i,
          )
          localStorage.setItem("inspecciones", JSON.stringify(updatedInspecciones))
          setInspeccion({ ...inspeccion, youtubeLink: youtubeUrl })
          setLinkSaved(true)
          setTimeout(() => setLinkSaved(false), 5000)
        }
      }

    } catch (error) {
      console.error('Error uploading to YouTube:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`Error al subir el video a YouTube: ${errorMessage}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration
    
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleSeekMouseDown = () => {
    setIsSeeking(true)
  }

  const handleSeekMouseUp = () => {
    setIsSeeking(false)
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

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

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
  const activeSrc = totalRecordings > 0 ? inspeccion.recordings![selectedRecording] : undefined
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
                  {activeSrc ? (
                    <video
                      ref={videoRef}
                      src={activeSrc}
                      controls={false}
                      muted={isMuted}
                      className="w-full h-full object-contain bg-black"
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

                  {/* Play button overlay */}
                  {activeSrc && !isPlaying && (
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
                      className="relative w-full bg-black/40 rounded-full h-1.5 cursor-pointer hover:h-2 transition-all duration-200 group"
                      onClick={handleSeek}
                      onMouseDown={handleSeekMouseDown}
                      onMouseUp={handleSeekMouseUp}
                    >
                      <div
                        className="bg-red-600 h-full rounded-full transition-all duration-200"
                        style={{ width: `${progressPercentage}%` }}
                      />
                      {/* Seek indicator */}
                      <div 
                        className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-2 border-white shadow-lg"
                        style={{ left: `${progressPercentage}%`, marginLeft: '-8px' }}
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
          </div>

          {/* Metadata sidebar */}
          <div className="space-y-6">
            {/* Inspector info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Inspector
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
                    <p className="text-sm text-muted-foreground">Duración total</p>
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
                    <div className="flex gap-2">
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1 border-border hover:bg-secondary bg-transparent">
                            <Youtube className="w-4 h-4 mr-2" />
                            Actualizar Enlace
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
                        className="flex-1 border-border hover:bg-secondary bg-transparent"
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Descargar Video
                      </Button>
                      <Button
                        onClick={handleUploadToYouTube}
                        disabled={isUploading || !inspeccion.recordings || inspeccion.recordings.length === 0}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white min-w-0"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Subiendo...
                          </>
                        ) : isAuthenticated ? (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Subir Video
                          </>
                        ) : (
                          <>
                            <Youtube className="w-4 h-4 mr-2 shrink-0" />
                            <span className="truncate">Autenticar y Subir</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {inspeccion.recordings && inspeccion.recordings.length > 0
                        ? "Sube automáticamente una grabación a YouTube o agrega un enlace manualmente."
                        : "No hay grabaciones disponibles para subir. Agrega un enlace manualmente."}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleOpenFileExplorer}
                        disabled={!inspeccion.recordings || inspeccion.recordings.length === 0}
                        variant="outline"
                        className="flex-1 border-border hover:bg-secondary bg-transparent"
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Descargar Video
                      </Button>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1 border-border hover:bg-secondary bg-transparent">
                            <Youtube className="w-4 h-4 mr-2" />
                            Agregar Enlace
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
                      <Button
                        onClick={handleUploadToYouTube}
                        disabled={isUploading || !inspeccion.recordings || inspeccion.recordings.length === 0}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white min-w-0"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Subiendo...
                          </>
                        ) : isAuthenticated ? (
                          <>
                            <Upload className="w-4 h-4 mr-2 shrink-0" />
                            <span className="truncate">Subir a YouTube</span>
                          </>
                        ) : (
                          <>
                            <Youtube className="w-4 h-4 mr-2 shrink-0" />
                            <span className="truncate">Autenticar y Subir</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subiendo video...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {linkSaved && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Check className="w-4 h-4" />
                    {isUploading ? "Video subido y enlace guardado correctamente" : "Enlace guardado correctamente"}
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
      </div>
    </div>
  )
}
