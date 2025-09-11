"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"

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
  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [youtubeLink, setYoutubeLink] = useState("")
  const [linkSaved, setLinkSaved] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRecording, setSelectedRecording] = useState(0) // Added state for selected recording

  useEffect(() => {
    const data = localStorage.getItem("inspecciones")
    if (data) {
      const inspecciones: Inspeccion[] = JSON.parse(data)
      const found = inspecciones.find((i) => i.id === params.id)
      if (found) {
        setInspeccion(found)
        setYoutubeLink(found.youtubeLink || "")
      }
    }
  }, [params.id])

  // Simulate video playback
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && inspeccion) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= inspeccion.recordingTime) {
            setIsPlaying(false)
            return inspeccion.recordingTime
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, inspeccion])

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
    setIsPlaying(!isPlaying)
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  const handleSaveYoutubeLink = () => {
    if (!inspeccion || !youtubeLink.trim()) return

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

  const handleFullscreen = () => {
    // In a real app, this would enter fullscreen mode
    alert("Modo pantalla completa - En desarrollo")
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

  const progressPercentage = inspeccion.recordingTime > 0 ? (currentTime / inspeccion.recordingTime) * 100 : 0
  const totalRecordings = inspeccion.recordings?.length || 1 // Calculate total recordings

  return (
    <div className="min-h-screen bg-background p-4">
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
                <div className="relative bg-muted aspect-video flex items-center justify-center">
                  {/* Simulated video content */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Play className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-white text-lg font-semibold">
                        {totalRecordings > 1 ? `Grabación ${selectedRecording + 1}` : "Video de Inspección"}
                      </p>
                      <p className="text-white/70 text-sm mt-2">{inspeccion.lugarInspeccion}</p>
                    </div>
                  </div>

                  {/* Video overlay when playing */}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/20">
                      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
                        {formatDateTime(inspeccion.createdAt)}
                      </div>
                      <div className="absolute bottom-20 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
                        {formatTime(currentTime)} / {formatTime(inspeccion.recordingTime)}
                      </div>
                    </div>
                  )}

                  {/* Play button overlay */}
                  {!isPlaying && (
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
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
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
                      <span className="text-sm text-muted-foreground ml-2">
                        {formatTime(currentTime)} / {formatTime(inspeccion.recordingTime)}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleFullscreen}>
                      <Maximize className="w-4 h-4" />
                    </Button>
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
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-border hover:bg-secondary bg-transparent">
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
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      No hay enlace de YouTube guardado para esta inspección.
                    </p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                          <Youtube className="w-4 h-4 mr-2" />
                          Agregar Enlace de YouTube
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
      </div>
    </div>
  )
}
