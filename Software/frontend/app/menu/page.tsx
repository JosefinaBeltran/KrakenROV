"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, FileText, LogOut } from "lucide-react"

export default function MenuPage() {
  const router = useRouter()

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Menú Principal</h1>
          <Button variant="outline" onClick={handleLogout} className="border-border hover:bg-secondary bg-transparent">
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="cursor-pointer hover:bg-card/80 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Iniciar Inspección</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full btn-primary"
                onClick={() => router.push("/formulario-inspeccion")}
              >
                Comenzar Nueva Inspección
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-card/80 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Inspecciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full btn-primary"
                onClick={() => router.push("/listado-inspecciones")}>
                Ver Inspecciones Realizadas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
