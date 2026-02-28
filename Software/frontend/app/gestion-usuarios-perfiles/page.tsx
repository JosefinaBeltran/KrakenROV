"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, Users } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"

export default function GestionUsuariosPerfilesPage() {
  const router = useRouter()
  const { currentUser, hasPermission, isLoading } = useDatabase()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Cargando...</h3>
            <p className="text-muted-foreground">Verificando permisos</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentUser || !hasPermission('canManageUsers')) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Acceso Denegado</h3>
            <p className="text-muted-foreground mb-6">No tienes permisos para acceder a esta sección.</p>
            <Button
              onClick={() => router.push("/menu")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Volver al Menú
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/menu")}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios y Perfiles</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="cursor-pointer hover:bg-card/80 transition-colors flex flex-col h-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Gestión de Perfiles</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <div className="mt-auto">
                <Button
                  className="w-full btn-primary"
                  onClick={() => router.push("/gestion-perfiles")}
                >
                  Gestionar Perfiles
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-card/80 transition-colors flex flex-col h-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Gestión de Usuarios</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <div className="mt-auto">
                <Button
                  className="w-full btn-primary"
                  onClick={() => router.push("/gestion-usuarios")}
                >
                  Gestionar Usuarios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
