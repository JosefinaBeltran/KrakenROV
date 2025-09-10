"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Images, FileText, Video, Calendar, MapPin, User, FileCheck } from "lucide-react"

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
  createdAt: string
}

export default function DetalleInspeccionPage() {
  const router = useRouter()
  const params = useParams()
  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null)

  useEffect(() => {
    const data = localStorage.getItem("inspecciones")
    if (data) {
      const inspecciones: Inspeccion[] = JSON.parse(data)
      const found = inspecciones.find((i) => i.id === params.id)
      setInspeccion(found || null)
    }
  }, [params.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/listado-inspecciones")}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Listado
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Detalle de Inspección</h1>
        </div>

        {/* Inspection details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{inspeccion.nombreInspeccion}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Lugar de la inspección</p>
                  <p className="font-medium">{inspeccion.lugarInspeccion}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de la inspección</p>
                  <p className="font-medium">{formatDate(inspeccion.fechaInspeccion)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Inspector</p>
                  <p className="font-medium">{inspeccion.nombreApellido}</p>
                  <p className="text-sm text-muted-foreground">Matrícula: {inspeccion.matricula}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Duración de grabación</p>
                  <p className="font-medium">{formatTime(inspeccion.recordingTime)}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">Detalle</p>
                  <p className="text-foreground leading-relaxed">{inspeccion.descripcion}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:bg-card/80 transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-3">
                <Images className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Capturas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Ver las {inspeccion.capturedFrames.length} capturas realizadas durante la inspección
              </p>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => router.push(`/galeria-capturas/${inspeccion.id}`)}
              >
                Ver Capturas
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-card/80 transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Informe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Generar y ver el informe completo de la inspección
              </p>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => router.push(`/informe-inspeccion/${inspeccion.id}`)}
              >
                Ver Informe
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-card/80 transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-3">
                <Video className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Link del Video</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Acceder al video completo de la inspección
              </p>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => router.push(`/visor-video/${inspeccion.id}`)}
              >
                Ver Video
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
