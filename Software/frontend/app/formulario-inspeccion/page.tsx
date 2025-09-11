"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RotateCcw, ArrowRight } from "lucide-react"

export default function FormularioInspeccionPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombreInspeccion: "",
    lugarInspeccion: "",
    fechaInspeccion: "",
    descripcion: "",
    nombreApellido: "",
    matricula: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    if (!formData.fechaInspeccion) {
      newErrors.fechaInspeccion = "La fecha de la inspección es requerida"
    }
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
    setFormData({
      nombreInspeccion: "",
      lugarInspeccion: "",
      fechaInspeccion: "",
      descripcion: "",
      nombreApellido: "",
      matricula: "",
    })
    setErrors({})
  }

  const handleSiguiente = () => {
    if (validateForm()) {
      // Store form data in localStorage for the video recording screen
      localStorage.setItem("inspeccionData", JSON.stringify(formData))
      router.push("/video-en-curso")
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/menu")}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Formulario de Inspección</h1>
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
                  onChange={(e) => handleInputChange("fechaInspeccion", e.target.value)}
                  className="bg-input border-border"
                />
                {errors.fechaInspeccion && <p className="text-destructive text-sm">{errors.fechaInspeccion}</p>}
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
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push("/menu")}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <Button variant="secondary" onClick={handleLimpiar} className="bg-secondary hover:bg-secondary/80">
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpiar
          </Button>

          <Button onClick={handleSiguiente} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Siguiente
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
