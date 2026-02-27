"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, LogOut, Database, Users } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"

export default function MenuPage() {
  const router = useRouter()
  const { clearSession, currentUser, hasPermission, reloadCurrentUser, getProfileById } = useDatabase()
  const [profileName, setProfileName] = useState<string | null>(null)

  useEffect(() => {
    const loadProfileName = async () => {
      if (currentUser?.profileId) {
        try {
          const profile = await getProfileById(currentUser.profileId)
          setProfileName(profile?.name ?? null)
        } catch (error) {
          console.error("Error loading profile for current user:", error)
          setProfileName(null)
        }
      } else {
        setProfileName(null)
      }
    }

    loadProfileName()
  }, [currentUser?.profileId, getProfileById])

  const handleLogout = async () => {
    try {
      await clearSession()
    } catch (error) {
      console.error('Logout error:', error)
    }
    router.push("/login")
  }

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google"
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Menú Principal</h1>
            {currentUser && (
              <p className="text-sm text-muted-foreground mt-1">
                Bienvenido, {currentUser.displayName}
                {profileName && ` (${profileName})`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {!currentUser && (
              <Button 
                variant="outline" 
                onClick={reloadCurrentUser} 
                className="border-border hover:bg-secondary bg-transparent"
                size="sm"
              >
                Recargar Usuario
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout} className="border-border hover:bg-secondary bg-transparent">
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="cursor-pointer hover:bg-card/80 transition-colors flex flex-col h-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Iniciar Inspección</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <div className="mt-auto">
                <Button
                  className="w-full btn-primary"
                  onClick={() => router.push("/formulario-inspeccion")}
                >
                  Comenzar Nueva Inspección
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-card/80 transition-colors flex flex-col h-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Inspecciones</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <div className="mt-auto">
                <Button 
                  className="w-full btn-primary"
                  onClick={() => router.push("/listado-inspecciones")}>
                  Ver Inspecciones Realizadas
                </Button>
              </div>
            </CardContent>
          </Card>

          {currentUser && hasPermission('canExportData') && (
            <Card className="cursor-pointer hover:bg-card/80 transition-colors flex flex-col h-full">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Gestión de Datos</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <div className="mt-auto">
                  <Button 
                    className="w-full btn-primary"
                    onClick={() => router.push("/gestion-datos")}>
                    Gestionar Datos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentUser && hasPermission('canManageUsers') && (
            <Card className="cursor-pointer hover:bg-card/80 transition-colors flex flex-col h-full">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Gestión de Usuarios y Perfiles</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <div className="mt-auto">
                  <Button 
                    className="w-full btn-primary"
                    onClick={() => router.push("/gestion-usuarios-perfiles")}>
                    Gestionar Usuarios y Perfiles
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
