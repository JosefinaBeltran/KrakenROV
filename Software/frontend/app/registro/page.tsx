"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"

export default function RegistroPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [nombreCompleto, setNombreCompleto] = useState("")
  const [matricula, setMatricula] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, isInitialized } = useDatabase()

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    setError("")
    setSuccess("")
    
    // Validaciones
    if (!username || !password || !nombreCompleto || !matricula) {
      setError("Todos los campos son requeridos")
      return
    }

    if (username.length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }
    
    if (!isInitialized) {
      setError("Base de datos no inicializada")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await register(username, password, nombreCompleto, matricula)
      
      if (result.success) {
        setSuccess("Usuario registrado exitosamente. Redirigiendo al login...")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setError(result.error || "Error al registrar usuario")
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError("Error al registrar usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl bg-card/60 border-border">
        <CardContent className="p-8">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Image
                src="/placeholder-logo.png"
                width={120}
                height={120}
                alt="KrakenROV Logo"
                className="rounded-xl border border-border"
                priority
              />
            </div>

            <CardHeader className="text-center p-0 mb-6">
              <CardTitle className="text-3xl md:text-4xl font-bold text-foreground">
                Registro de Usuario
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Complete el formulario para crear una nueva cuenta
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleRegister} className="w-full max-w-xl space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-foreground">
                  Nombre de Usuario
                </Label>
                <Input
                  id="username"
                  placeholder="Ingrese su nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-input border-border mt-1"
                  disabled={isSubmitting}
                  required
                  minLength={3}
                />
              </div>

              <div>
                <Label htmlFor="nombreCompleto" className="text-sm font-medium text-foreground">
                  Nombre Completo
                </Label>
                <Input
                  id="nombreCompleto"
                  placeholder="Ingrese su nombre completo"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="bg-input border-border mt-1"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="matricula" className="text-sm font-medium text-foreground">
                  Matrícula
                </Label>
                <Input
                  id="matricula"
                  placeholder="Ingrese su matrícula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="bg-input border-border mt-1"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingrese su contraseña (mínimo 6 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input border-border pr-10"
                    disabled={isSubmitting}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirmar Contraseña
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme su contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-input border-border pr-10"
                    disabled={isSubmitting}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-amber-400 text-black hover:bg-amber-300 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registrando..." : "Registrarse"}
              </Button>

              <div className="text-center mt-4">
                <Link 
                  href="/login" 
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

