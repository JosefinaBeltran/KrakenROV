"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RotateCcw, ArrowRight, Save } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"

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
  recordings?: string[]
}

export default function EditarInspeccionPage() {
  const router = useRouter()
  const params = useParams()
  const { getInspeccionById, updateInspeccion } = useDatabase()
  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null)
  
  // Función para obtener la fecha local en formato YYYY-MM-DD sin problemas de zona horaria
  const getLocalDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const [formData, setFormData] = useState({
    nombreInspeccion: "",
    lugarInspeccion: "",
    fechaInspeccion: getLocalDateString(), // Always use current date
    descripcion: "",
    nombreApellido: "",
    matricula: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load inspection data
  useEffect(() => {
    const loadInspeccion = async () => {
      console.log('Loading inspeccion for edit, ID:', params.id)
      try {
        const found = await getInspeccionById(params.id as string)
        console.log('Found inspeccion for edit:', found)
        if (found) {
          setInspeccion(found)
          setFormData({
            nombreInspeccion: found.nombreInspeccion,
            lugarInspeccion: found.lugarInspeccion,
            fechaInspeccion: getLocalDateString(), // Always use current date
            descripcion: found.descripcion,
            nombreApellido: found.nombreApellido,
            matricula: found.matricula,
          })
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
            setFormData({
              nombreInspeccion: found.nombreInspeccion,
              lugarInspeccion: found.lugarInspeccion,
              fechaInspeccion: getLocalDateString(), // Always use current date
              descripcion: found.descripcion,
              nombreApellido: found.nombreApellido,
              matricula: found.matricula,
            })
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadInspeccion()
  }, [params.id, getInspeccionById])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombreInspeccion.trim()) {
      newErrors.nombreInspeccion = "El nombre de la inspección es requerido"
    }
    if (!formData.lugarInspeccion.trim()) {
      newErrors.lugarInspeccion = "El lugar de la inspección es requerido"
    }
    // No need to validate fecha since it's always set to current date
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es requerida"
    }
    if (!formData.nombreApellido.trim()) {
      newErrors.nombreApellido = "El nombre y apellido del inspector es requerido"
    }
    if (!formData.matricula.trim()) {
      newErrors.matricula = "La matrícula es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLimpiar = () => {
    if (inspeccion) {
      setFormData({
        nombreInspeccion: inspeccion.nombreInspeccion,
        lugarInspeccion: inspeccion.lugarInspeccion,
        fechaInspeccion: getLocalDateString(), // Always use current date
        descripcion: inspeccion.descripcion,
        nombreApellido: inspeccion.nombreApellido,
        matricula: inspeccion.matricula,
      })
    }
    setErrors({})
  }

  const handleGuardar = async () => {
    if (!inspeccion || !validateForm()) return

    try {
      const updatedInspeccion = {
        ...inspeccion,
        nombreInspeccion: formData.nombreInspeccion,
        lugarInspeccion: formData.lugarInspeccion,
        fechaInspeccion: getLocalDateString(), // Always use current date
        descripcion: formData.descripcion,
        nombreApellido: formData.nombreApellido,
        matricula: formData.matricula,
      }
      await updateInspeccion(updatedInspeccion)
      router.push("/listado-inspecciones")
    } catch (error) {
      console.error('Error saving inspeccion:', error)
      // Fallback to localStorage
      const data = localStorage.getItem("inspecciones")
      if (data) {
        const inspecciones: Inspeccion[] = JSON.parse(data)
        const updatedInspecciones = inspecciones.map((i) =>
          i.id === inspeccion.id
            ? {
                ...i,
                nombreInspeccion: formData.nombreInspeccion,
                lugarInspeccion: formData.lugarInspeccion,
                fechaInspeccion: getLocalDateString(), // Always use current date
                descripcion: formData.descripcion,
                nombreApellido: formData.nombreApellido,
                matricula: formData.matricula,
              }
            : i
        )
        localStorage.setItem("inspecciones", JSON.stringify(updatedInspecciones))
      }
      router.push("/listado-inspecciones")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Cargando...</h3>
            <p className="text-muted-foreground">Obteniendo datos de la inspección</p>
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
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/listado-inspecciones")}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Listado
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Editar Inspección</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Datos de la inspección */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Datos de la Inspección</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombreInspeccion">Nombre de la inspección</Label>
                <Input
                  id="nombreInspeccion"
                  value={formData.nombreInspeccion}
                  onChange={(e) => handleInputChange("nombreInspeccion", e.target.value)}
                  placeholder="Ingrese el nombre de la inspección"
                  className="bg-input border-border"
                />
                {errors.nombreInspeccion && <p className="text-destructive text-sm">{errors.nombreInspeccion}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lugarInspeccion">Lugar de la inspección</Label>
                <Input
                  id="lugarInspeccion"
                  value={formData.lugarInspeccion}
                  onChange={(e) => handleInputChange("lugarInspeccion", e.target.value)}
                  placeholder="Ingrese el lugar de la inspección"
                  className="bg-input border-border"
                />
                {errors.lugarInspeccion && <p className="text-destructive text-sm">{errors.lugarInspeccion}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaInspeccion">Fecha de la inspección</Label>
                <Input
                  id="fechaInspeccion"
                  type="date"
                  value={formData.fechaInspeccion}
                  disabled
                  className="bg-muted border-border cursor-not-allowed opacity-70"
                />
                <p className="text-xs text-muted-foreground">La fecha se actualiza automáticamente al día actual</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange("descripcion", e.target.value)}
                  placeholder="Ingrese una descripción detallada de la inspección"
                  className="bg-input border-border min-h-[100px]"
                />
                {errors.descripcion && <p className="text-destructive text-sm">{errors.descripcion}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Datos del inspector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Datos del Inspector</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombreApellido">Nombre y Apellido</Label>
                <Input
                  id="nombreApellido"
                  value={formData.nombreApellido}
                  onChange={(e) => handleInputChange("nombreApellido", e.target.value)}
                  placeholder="Ingrese nombre y apellido completo"
                  className="bg-input border-border"
                />
                {errors.nombreApellido && <p className="text-destructive text-sm">{errors.nombreApellido}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  value={formData.matricula}
                  onChange={(e) => handleInputChange("matricula", e.target.value)}
                  placeholder="Ingrese número de matrícula"
                  className="bg-input border-border"
                />
                {errors.matricula && <p className="text-destructive text-sm">{errors.matricula}</p>}
              </div>

              {/* Información adicional de la inspección */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-semibold mb-3">Información de la Inspección</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Capturas realizadas:</span>
                    <span className="font-medium">{inspeccion.capturedFrames.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grabaciones guardadas:</span>
                    <span className="font-medium">{inspeccion.recordings?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiempo de grabación:</span>
                    <span className="font-medium">{Math.floor(inspeccion.recordingTime / 60)}:{(inspeccion.recordingTime % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha de creación:</span>
                    <span className="font-medium">{new Date(inspeccion.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push("/listado-inspecciones")}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancelar
          </Button>

          <Button variant="secondary" onClick={handleLimpiar} className="bg-secondary hover:bg-secondary/80">
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar
          </Button>

          <Button onClick={handleGuardar} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  )
}
