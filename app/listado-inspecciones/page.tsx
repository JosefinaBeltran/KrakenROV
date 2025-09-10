"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, FileText, Calendar, MapPin, Filter, Edit, Trash2, ArrowUpDown } from "lucide-react"

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

export default function ListadoInspeccionesPage() {
  const router = useRouter()
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([])
  const [filteredInspecciones, setFilteredInspecciones] = useState<Inspeccion[]>([])
  const [sortBy, setSortBy] = useState<"nombre" | "fecha">("fecha")
  const [filters, setFilters] = useState({
    fechaDesde: "",
    fechaHasta: "",
    lugar: "",
    inspector: "",
    nombre: "",
  })

  useEffect(() => {
    const data = localStorage.getItem("inspecciones")
    if (data) {
      const parsedData = JSON.parse(data)
      setInspecciones(parsedData)
      setFilteredInspecciones(parsedData)
    }
  }, [])

  useEffect(() => {
    let filtered = inspecciones

    if (filters.fechaDesde) {
      filtered = filtered.filter((insp) => {
        const inspDate = new Date(insp.fechaInspeccion)
        const fromDate = new Date(filters.fechaDesde)
        return inspDate >= fromDate
      })
    }

    if (filters.fechaHasta) {
      filtered = filtered.filter((insp) => {
        const inspDate = new Date(insp.fechaInspeccion)
        const toDate = new Date(filters.fechaHasta)
        return inspDate <= toDate
      })
    }

    if (filters.lugar) {
      filtered = filtered.filter((insp) => insp.lugarInspeccion.toLowerCase().includes(filters.lugar.toLowerCase()))
    }

    if (filters.inspector) {
      filtered = filtered.filter((insp) => insp.nombreApellido.toLowerCase().includes(filters.inspector.toLowerCase()))
    }

    if (filters.nombre) {
      filtered = filtered.filter((insp) => insp.nombreInspeccion.toLowerCase().includes(filters.nombre.toLowerCase()))
    }

    filtered = filtered.sort((a, b) => {
      if (sortBy === "nombre") {
        return a.nombreInspeccion.localeCompare(b.nombreInspeccion)
      } else {
        return new Date(b.fechaInspeccion).getTime() - new Date(a.fechaInspeccion).getTime()
      }
    })

    setFilteredInspecciones(filtered)
  }, [filters, inspecciones, sortBy])

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      fechaDesde: "",
      fechaHasta: "",
      lugar: "",
      inspector: "",
      nombre: "",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleInspeccionClick = (inspeccionId: string) => {
    router.push(`/detalle-inspeccion/${inspeccionId}`)
  }

  const handleEditInspeccion = (e: React.MouseEvent, inspeccionId: string) => {
    e.stopPropagation()
    router.push(`/editar-inspeccion/${inspeccionId}`)
  }

  const handleDeleteInspeccion = (e: React.MouseEvent, inspeccionId: string) => {
    e.stopPropagation()
    if (confirm("¿Está seguro de que desea eliminar esta inspección? Esta acción no se puede deshacer.")) {
      const updatedInspecciones = inspecciones.filter((insp) => insp.id !== inspeccionId)
      setInspecciones(updatedInspecciones)
      localStorage.setItem("inspecciones", JSON.stringify(updatedInspecciones))
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/menu")}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Listado de Inspecciones</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Fecha Desde</label>
                <Input
                  type="date"
                  value={filters.fechaDesde}
                  onChange={(e) => handleFilterChange("fechaDesde", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Fecha Hasta</label>
                <Input
                  type="date"
                  value={filters.fechaHasta}
                  onChange={(e) => handleFilterChange("fechaHasta", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Lugar</label>
                <Input
                  placeholder="Buscar por lugar..."
                  value={filters.lugar}
                  onChange={(e) => handleFilterChange("lugar", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Inspector</label>
                <Input
                  placeholder="Buscar por inspector..."
                  value={filters.inspector}
                  onChange={(e) => handleFilterChange("inspector", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Nombre de Inspección</label>
                <Input
                  placeholder="Buscar por nombre..."
                  value={filters.nombre}
                  onChange={(e) => handleFilterChange("nombre", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                <span className="text-sm font-medium">Ordenar por:</span>
                <Select value={sortBy} onValueChange={(value: "nombre" | "fecha") => setSortBy(value)}>
                  <SelectTrigger className="w-48 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nombre">Orden Alfabético</SelectItem>
                    <SelectItem value="fecha">Fecha de Inspección</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-border hover:bg-secondary bg-transparent"
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {filteredInspecciones.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {inspecciones.length === 0 ? "No hay inspecciones registradas" : "No se encontraron inspecciones"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {inspecciones.length === 0
                  ? "Comience creando una nueva inspección desde el menú principal."
                  : "Intente ajustar los filtros de búsqueda."}
              </p>
              <Button
                onClick={() => router.push("/menu")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Ir al Menú Principal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredInspecciones.map((inspeccion) => (
              <Card
                key={inspeccion.id}
                className="cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => handleInspeccionClick(inspeccion.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2 flex-1 mr-2">{inspeccion.nombreInspeccion}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleEditInspeccion(e, inspeccion.id)}
                        className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDeleteInspeccion(e, inspeccion.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{inspeccion.lugarInspeccion}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(inspeccion.fechaInspeccion)}</span>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">Inspector: {inspeccion.nombreApellido}</p>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
