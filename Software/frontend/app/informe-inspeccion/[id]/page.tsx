"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, MapPin, FileCheck, Upload, ImageIcon, Printer as Print, Download } from "lucide-react"

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
}

export default function InformeInspeccionPage() {
  const router = useRouter()
  const params = useParams()
  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null)
  const [observaciones, setObservaciones] = useState("")
  const [reportImages, setReportImages] = useState<string[]>([])

  useEffect(() => {
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
  }, [params.id])

  const saveObservaciones = () => {
    if (!inspeccion) return

    const data = localStorage.getItem("inspecciones")
    if (data) {
      const inspecciones: Inspeccion[] = JSON.parse(data)
      const updatedInspecciones = inspecciones.map((i) =>
        i.id === inspeccion.id ? { ...i, observaciones, reportImages } : i,
      )
      localStorage.setItem("inspecciones", JSON.stringify(updatedInspecciones))
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

  const handleImprimirInforme = () => {
    saveObservaciones()
    window.print()
  }

  const handleGenerarPDF = async () => {
    saveObservaciones()
    
    try {
      // Verificar que las librerías estén disponibles
      if (typeof window === 'undefined') {
        alert('La generación de PDF no está disponible en este entorno.')
        return
      }

      // Importar las librerías dinámicamente
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ])
      
      // Obtener el elemento del informe
      const element = document.getElementById('informe-content')
      if (!element) {
        alert('No se pudo encontrar el contenido del informe.')
        return
      }
      
      // Mostrar mensaje de carga
      const loadingMessage = document.createElement('div')
      loadingMessage.textContent = 'Generando PDF...'
      loadingMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #162831;
        color: #c5cac7;
        padding: 20px;
        border-radius: 8px;
        z-index: 9999;
        font-family: Arial, sans-serif;
      `
      document.body.appendChild(loadingMessage)
      
      // Crear estilos temporales más completos para PDF
      const tempStyles = document.createElement('style')
      tempStyles.id = 'pdf-styles'
      tempStyles.textContent = `
        * {
          --background: #ffffff !important;
          --foreground: #333333 !important;
          --card: #ffffff !important;
          --card-foreground: #333333 !important;
          --popover: #ffffff !important;
          --popover-foreground: #333333 !important;
          --primary: #1a365d !important;
          --primary-foreground: #ffffff !important;
          --secondary: #f5f5f5 !important;
          --secondary-foreground: #333333 !important;
          --muted: #f5f5f5 !important;
          --muted-foreground: #666666 !important;
          --accent: #e2e8f0 !important;
          --accent-foreground: #333333 !important;
          --destructive: #dc2626 !important;
          --destructive-foreground: #ffffff !important;
          --border: #cccccc !important;
          --input: #ffffff !important;
          --ring: #1a365d !important;
        }
        
        #informe-content {
          background: white !important;
          color: #333 !important;
        }
        
        #informe-content * {
          background: white !important;
          color: #333 !important;
          border-color: #ccc !important;
        }
        
        #informe-content .text-primary,
        #informe-content h1,
        #informe-content h2,
        #informe-content h3,
        #informe-content .font-bold {
          color: #1a365d !important;
        }
        
        #informe-content .text-muted-foreground {
          color: #666 !important;
        }
        
        #informe-content .bg-muted {
          background: #f5f5f5 !important;
        }
        
        #informe-content .border-border {
          border-color: #ccc !important;
        }
        
        #informe-content .bg-primary {
          background: #1a365d !important;
          color: white !important;
        }
      `
      document.head.appendChild(tempStyles)
      
      // Esperar un momento para que los estilos se apliquen
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Crear canvas del contenido
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        ignoreElements: (element) => {
          // Ignorar elementos que pueden causar problemas
          return element.classList.contains('print:hidden')
        }
      })
      
      // Remover estilos temporales
      const existingStyles = document.getElementById('pdf-styles')
      if (existingStyles) {
        document.head.removeChild(existingStyles)
      }
      
      // Remover mensaje de carga
      document.body.removeChild(loadingMessage)
      
      // Crear PDF
      const imgData = canvas.toDataURL('image/png', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = 210
      const pdfHeight = 297
      const imgWidth = pdfWidth - 20 // Margen de 10mm cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Calcular si necesita múltiples páginas
      if (imgHeight <= pdfHeight - 20) {
        // Una sola página
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      } else {
        // Múltiples páginas
        let heightLeft = imgHeight
        let position = 10
        
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= (pdfHeight - 20)
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight + 10
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
          heightLeft -= (pdfHeight - 20)
        }
      }
      
      // Descargar el PDF
      const fileName = `Informe_${inspeccion?.nombreInspeccion.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      console.error('Error al generar PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`Error al generar el PDF: ${errorMessage}`)
    }
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
            {/* Basic information */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre de la inspección</p>
                    <p className="font-semibold text-lg">{inspeccion.nombreInspeccion}</p>
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

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de la inspección</p>
                    <p className="font-medium">{formatDate(inspeccion.fechaInspeccion)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Inspector responsable</p>
                  <p className="font-medium">{inspeccion.nombreApellido}</p>
                  <p className="text-sm text-muted-foreground">Matrícula: {inspeccion.matricula}</p>
                </div>
              </div>
            </div>

            {/* Detailed description */}
            <div className="border-t border-border pt-6">
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
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => addCapturedImage(frame)}
                          className="border-border hover:bg-secondary bg-transparent text-xs"
                        >
                          <ImageIcon className="w-3 h-3 mr-1" />
                          Captura {index + 1}
                        </Button>
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

            {/* Statistics */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-4">Estadísticas de la Inspección</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">{formatTime(inspeccion.recordingTime)}</p>
                  <p className="text-sm text-muted-foreground">Duración de grabación</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">{inspeccion.capturedFrames.length}</p>
                  <p className="text-sm text-muted-foreground">Capturas realizadas</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">
                    {new Date(inspeccion.createdAt).toLocaleDateString("es-ES")}
                  </p>
                  <p className="text-sm text-muted-foreground">Fecha de creación</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
              <p>Informe generado automáticamente por el Sistema de Inspecciones</p>
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
            onClick={handleImprimirInforme}
            className="btn-primary"
          >
            <Print className="w-4 h-4 mr-2" />
            Imprimir
          </Button>

          <Button
            onClick={handleGenerarPDF}
            className="btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </div>
    </div>
  )
}