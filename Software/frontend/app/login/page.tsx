"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { login, isInitialized, isLoading } = useDatabase()

  const handleLogin = async () => {
    setError("")
    if (!username || !password) {
      setError("Complete usuario y contraseña")
      return
    }
    
    if (!isInitialized) {
      setError("Base de datos no inicializada")
      return
    }

    try {
      const result = await login(username, password)
      
      if (result.success) {
        router.replace("/menu")
      } else {
        setError(result.error || "Error al iniciar sesión")
      }
    } catch (error) {
      console.error('Login error:', error)
      setError("Error al iniciar sesión")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-xl bg-card/60 border-border">
        <CardContent className="p-8">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Image
                src="/placeholder-logo.png"
                width={180}
                height={180}
                alt="KrakenROV Logo"
                className="rounded-xl border border-border"
                priority
              />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-8">
              Sistema de Inspecciones
            </h1>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Usuarios Disponibles:</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Super Usuario:</strong> admin / admin123</p>
                <p><strong>Operador:</strong> operador / operador123</p>
              </div>
            </div>

            <div className="w-full max-w-2xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Usuario</label>
                <Input
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-input border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Contraseña</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input border-border pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button
                className="w-full bg-amber-400 text-black hover:bg-amber-300 font-semibold"
                onClick={handleLogin}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin()
                  }
                }}
              >
                Ingresar
              </Button>
              
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


