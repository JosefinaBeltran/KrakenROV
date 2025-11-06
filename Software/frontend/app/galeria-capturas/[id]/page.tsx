"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ArrowLeft, Calendar, MapPin, User, ZoomIn, Trash2 } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
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

export default function GaleriaCapturas() {
  const router = useRouter()
  const params = useParams()
  const { getInspeccionById, updateInspeccion } = useDatabase()
  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showDeleteFrameDialog, setShowDeleteFrameDialog] = useState(false)
  const [frameToDelete, setFrameToDelete] = useState<number | null>(null)

  useEffect(() => {
    const loadInspeccion = async () => {
      console.log('Loading inspeccion for gallery, ID:', params.id)
      try {
        const found = await getInspeccionById(params.id as string)
        console.log('Found inspeccion for gallery:', found)
        setInspeccion(found || null)
      } catch (error) {
        console.error('Error loading inspeccion:', error)
        // Fallback to localStorage
        const data = localStorage.getItem("inspecciones")
        if (data) {
          const inspecciones: Inspeccion[] = JSON.parse(data)
          const found = inspecciones.find((i) => i.id === params.id)
          setInspeccion(found || null)
        }
      }
    }
    loadInspeccion()
  }, [params.id, getInspeccionById])

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

  const handleImageClick = (image: string, index: number) => {
    setSelectedImage(image)
    setSelectedIndex(index)
  }

  const closeModal = () => {
    setSelectedImage(null)
    setSelectedIndex(null)
  }

  const handleEliminarFrame = (e: React.MouseEvent, index: number) => {
    e.stopPropagation() // Evitar que se abra el modal al hacer clic en eliminar
    setFrameToDelete(index)
    setShowDeleteFrameDialog(true)
  }

  const handleConfirmDeleteFrame = async () => {
    if (frameToDelete !== null && inspeccion) {
      try {
        const updatedFrames = inspeccion.capturedFrames.filter((_, i) => i !== frameToDelete)
        // Recargar la inspección completa desde la base de datos para asegurar que tenemos todos los campos
        const fullInspeccion = await getInspeccionById(inspeccion.id)
        if (fullInspeccion) {
          const updatedInspeccion = {
            ...fullInspeccion,
            capturedFrames: updatedFrames
          }
          await updateInspeccion(updatedInspeccion)
          setInspeccion(updatedInspeccion)
        }
        setFrameToDelete(null)
      } catch (error) {
        console.error('Error deleting frame:', error)
        // Fallback to localStorage
        const data = localStorage.getItem("inspecciones")
        if (data) {
          const inspecciones: Inspeccion[] = JSON.parse(data)
          const updatedInspecciones = inspecciones.map((i) =>
            i.id === inspeccion.id
              ? { ...i, capturedFrames: i.capturedFrames.filter((_, idx) => idx !== frameToDelete) }
              : i
          )
          localStorage.setItem("inspecciones", JSON.stringify(updatedInspecciones))
          const updated = updatedInspecciones.find((i) => i.id === inspeccion.id)
          if (updated) {
            setInspeccion(updated)
          }
        }
        setFrameToDelete(null)
      }
    }
    setShowDeleteFrameDialog(false)
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push(`/detalle-inspeccion/${inspeccion.id}`)}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Galería de Capturas</h1>
        </div>

        {/* Inspection header info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">{inspeccion.nombreInspeccion}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Lugar</p>
                  <p className="font-medium">{inspeccion.lugarInspeccion}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(inspeccion.fechaInspeccion)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Operador</p>
                  <p className="font-medium">{inspeccion.nombreApellido}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gallery */}
        {inspeccion.capturedFrames.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ZoomIn className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay capturas disponibles</h3>
              <p className="text-muted-foreground">No se realizaron capturas durante esta inspección.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center justify-between">
                <span>Capturas de la Inspección</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {inspeccion.capturedFrames.length}{" "}
                  {inspeccion.capturedFrames.length === 1 ? "imagen" : "imágenes"}
                </span>
            </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {inspeccion.capturedFrames.map((frame, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                    onClick={() => handleImageClick(frame, index)}
                  >
                    <img
                      src={frame || "/placeholder.svg"}
                      alt={`Captura ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      Captura {index + 1}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => handleEliminarFrame(e, index)}
                      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image modal */}
        <Dialog open={selectedImage !== null} onOpenChange={closeModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="p-6">
              {selectedImage && (
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt={`Captura ampliada ${selectedIndex !== null ? selectedIndex + 1 : ""}`}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

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
              <AlertDialogAction onClick={handleConfirmDeleteFrame} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
