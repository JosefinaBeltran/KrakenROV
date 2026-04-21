"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, MapPin, FileCheck, Upload, ImageIcon, Printer as Print, User, Clock, CreditCard, Save } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
import { toast } from "sonner"
import SensorCharts from "@/components/SensorCharts"

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
  observaciones?: string
  reportImages?: string[]
  sensorCharts?: {
    temperature: string
    depth: string
  }
}

export default function InformeInspeccionPage() {
  const router = useRouter()
  const params = useParams()
  const { getInspeccionById, updateInspeccion } = useDatabase()
  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null)
  const [observaciones, setObservaciones] = useState("")
  const [reportImages, setReportImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadInspeccion = async () => {
      console.log('Loading inspeccion for informe, ID:', params.id)
      try {
        const found = await getInspeccionById(params.id as string)
        console.log('Found inspeccion for informe:', found)
        if (found) {
          setInspeccion(found)
          setObservaciones(found.observaciones || "")
          setReportImages(found.reportImages || [])
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
            setObservaciones(found.observaciones || "")
            setReportImages(found.reportImages || [])
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadInspeccion()
  }, [params.id, getInspeccionById])

  const saveObservaciones = async () => {
    if (!inspeccion) return

    try {
      const updatedInspeccion = {
        ...inspeccion,
        observaciones,
        reportImages
      }
      await updateInspeccion(updatedInspeccion)
    } catch (error) {
      console.error('Error saving observaciones:', error)
      // Fallback to localStorage
      const data = localStorage.getItem("inspecciones")
      if (data) {
        const inspecciones: Inspeccion[] = JSON.parse(data)
        const updatedInspecciones = inspecciones.map((i) =>
          i.id === inspeccion.id ? { ...i, observaciones, reportImages } : i,
        )
        localStorage.setItem("inspecciones", JSON.stringify(updatedInspecciones))
      }
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setReportImages((prev) => [...prev, result])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const addCapturedImage = (imageUrl: string) => {
    setReportImages((prev) => [...prev, imageUrl])
  }

  const removeImage = (index: number) => {
    setReportImages((prev) => prev.filter((_, i) => i !== index))
  }

  const formatDate = (dateString: string) => {
    // Si la fecha viene en formato YYYY-MM-DD, parsearla correctamente sin conversión de zona horaria
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month - 1 porque Date usa 0-indexed months
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
    // Fallback para otros formatos
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleImprimirInforme = () => {
    saveObservaciones()
    window.print()
  }

  const handleGuardarInforme = async () => {
    await saveObservaciones()
    toast.success("Cambios guardados correctamente")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Cargando...</h3>
            <p className="text-muted-foreground">Obteniendo datos del informe</p>
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 print:hidden">
          <Button
            variant="outline"
            onClick={() => router.push(`/detalle-inspeccion/${inspeccion.id}`)}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Informe de Inspección</h1>
        </div>

        {/* Report content */}
        <Card id="informe-content" className="mb-8">
          <CardHeader className="text-center border-b border-border">
            <CardTitle className="text-2xl mb-2">INFORME DE INSPECCIÓN</CardTitle>
            <p className="text-muted-foreground">Sistema de Inspecciones Profesional</p>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {/* Operador y Matrícula alineados con el grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Operador responsable</p>
                  <p className="font-semibold text-lg">{inspeccion.nombreApellido}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Matrícula</p>
                  <p className="font-semibold text-lg">{inspeccion.matricula}</p>
                </div>
              </div>
            </div>

            {/* Línea separadora */}
            <div className="border-t border-border pt-6"></div>

            {/* Información de la inspección */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Nombre de la inspección</p>
                  <p className="font-semibold text-lg">{inspeccion.nombreInspeccion}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de la inspección</p>
                  <p className="font-medium">{formatDate(inspeccion.fechaInspeccion)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Duración de la inspección</p>
                  <p className="font-medium text-lg">{formatTime(inspeccion.recordingTime)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Lugar de la inspección</p>
                  <p className="font-medium">{inspeccion.lugarInspeccion}</p>
                </div>
              </div>
            </div>

            {/* Línea separadora */}
            <div className="border-t border-border pt-6"></div>

            {/* Detailed description */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Detalle de la Inspección</h3>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{inspeccion.descripcion}</p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-4">Observaciones</h3>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                onBlur={saveObservaciones}
                placeholder="Escriba aquí sus observaciones sobre la inspección..."
                className="min-h-[120px] bg-secondary border-border print:bg-transparent print:border-none"
              />
            </div>

            <div className="border-t border-border pt-6 print:hidden">
              <h3 className="text-lg font-semibold mb-4">Imágenes del Informe</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("image-upload")?.click()}
                    className="border-border hover:bg-secondary bg-transparent"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Nueva Imagen
                  </Button>

                  {inspeccion.capturedFrames.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {inspeccion.capturedFrames.map((frame, index) => (
                        <button
                          key={index}
                          onClick={() => addCapturedImage(frame)}
                          className="relative group w-20 h-20 rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer"
                        >
                          <img
                            src={frame || "/placeholder.svg"}
                            alt={`Captura ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded text-center truncate">
                            Captura {index + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {reportImages.length > 0 && (
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold mb-4">Imágenes Adjuntas</h3>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {reportImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Imagen adjunta ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sensor Data Charts */}
            {inspeccion.sensorCharts && (
              <div className="border-t border-border pt-6">
                <SensorCharts 
                  sensorCharts={inspeccion.sensorCharts}
                />
              </div>
            )}


            {/* Footer */}
            <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
              <p>Informe generado por el Sistema de Inspecciones Kraken ROV</p>
              <p>Fecha de generación: {new Date().toLocaleString("es-ES")}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
          <Button
            variant="outline"
            onClick={() => router.push(`/detalle-inspeccion/${inspeccion.id}`)}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <Button
            onClick={handleGuardarInforme}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>

          <Button
            onClick={handleImprimirInforme}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Print className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  )
}