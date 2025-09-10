"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Shield } from "lucide-react"

export default function LoginPage() {
  const [usuario, setUsuario] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!usuario.trim() || !contraseña.trim()) {
      setError("Por favor, complete todos los campos")
      return
    }

    // Simple validation - in real app this would be proper authentication
    if (usuario === "inspector" && contraseña === "123456") {
      router.push("/menu")
    } else {
      setError("Usuario o contraseña incorrectos")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Sistema de Inspecciones</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario</Label>
              <Input
                id="usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingrese su usuario"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contraseña">Contraseña</Label>
              <div className="relative">
                <Input
                  id="contraseña"
                  type={showPassword ? "text" : "password"}
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  className="bg-input border-border pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {error && <div className="text-destructive text-sm text-center">{error}</div>}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Ingresar
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Usuario de prueba: inspector</p>
            <p>Contraseña: 123456</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
