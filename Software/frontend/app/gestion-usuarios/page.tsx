"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, UserPlus, Trash2, Shield, User } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
import { useState, useEffect } from "react"
import { User as UserType } from "@/lib/database"
import { localDB } from "@/lib/database"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff } from "lucide-react"

export default function GestionUsuariosPage() {
  const router = useRouter()
  const { getAllUsers, deleteUser, register, isInitialized, currentUser, hasPermission } = useDatabase()
  const [users, setUsers] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)
  
  // Form state
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [nombreCompleto, setNombreCompleto] = useState("")
  const [matricula, setMatricula] = useState("")
  const [role, setRole] = useState<"superuser" | "operator">("operator")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [isInitialized])

  const loadUsers = async () => {
    if (!isInitialized) return
    setIsLoading(true)
    try {
      const allUsers = await getAllUsers()
      setUsers(allUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      setStatus({
        success: false,
        message: 'Error al cargar usuarios'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    setStatus(null)
    
    if (!username || !password || !nombreCompleto || !matricula) {
      setStatus({
        success: false,
        message: 'Todos los campos son requeridos'
      })
      return
    }

    if (username.length < 3) {
      setStatus({
        success: false,
        message: 'El nombre de usuario debe tener al menos 3 caracteres'
      })
      return
    }

    if (password.length < 6) {
      setStatus({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await register(username, password, nombreCompleto, matricula)
      
      if (result.success && result.user) {
        // Update role if needed (since register creates operator by default)
        if (role === 'superuser') {
          const updatedUser = { ...result.user, role: 'superuser' as const }
          await localDB.saveUser(updatedUser)
        }
        
        setStatus({
          success: true,
          message: 'Usuario creado exitosamente'
        })
        
        // Reset form
        setUsername("")
        setPassword("")
        setNombreCompleto("")
        setMatricula("")
        setRole("operator")
        setIsDialogOpen(false)
        
        // Reload users
        await loadUsers()
      } else {
        setStatus({
          success: false,
          message: result.error || 'Error al crear usuario'
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setStatus({
        success: false,
        message: 'Error al crear usuario'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar al usuario "${username}"?\n\nEsta acción no se puede deshacer.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setIsProcessing(true)
    setStatus(null)

    try {
      const result = await deleteUser(userId)
      
      if (result.success) {
        setStatus({
          success: true,
          message: 'Usuario eliminado exitosamente'
        })
        await loadUsers()
      } else {
        setStatus({
          success: false,
          message: result.error || 'Error al eliminar usuario'
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setStatus({
        success: false,
        message: 'Error al eliminar usuario'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Check if user has permission
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
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
        </div>

        {status && (
          <div className={`mb-6 p-4 rounded-lg border ${
            status.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{status.message}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <UserPlus className="w-4 h-4 mr-2" />
                Crear Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Complete el formulario para crear un nuevo usuario
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                
                <div>
                  <Label htmlFor="nombreCompleto">Nombre Completo</Label>
                  <Input
                    id="nombreCompleto"
                    placeholder="Ingrese nombre completo"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    placeholder="Ingrese matrícula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Input
                    id="username"
                    placeholder="Ingrese nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingrese contraseña (mínimo 6 caracteres)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="role">Rol</Label>
                  <Select value={role} onValueChange={(value: "superuser" | "operator") => setRole(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operador</SelectItem>
                      <SelectItem value="superuser">Super Usuario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleCreateUser}
                    disabled={isProcessing}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isProcessing ? "Creando..." : "Crear Usuario"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isProcessing}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <Card key={user.id} className="hover:bg-card/80 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {user.role === 'superuser' ? (
                        <Shield className="w-5 h-5 text-amber-500" />
                      ) : (
                        <User className="w-5 h-5 text-blue-500" />
                      )}
                      <CardTitle className="text-lg">{user.displayName}</CardTitle>
                    </div>
                    {user.id !== currentUser?.id && 
                     user.id !== 'superuser-001' && 
                     user.id !== 'operator-001' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={isProcessing}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Usuario:</span>
                      <p className="text-foreground">{user.username}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Rol:</span>
                      <p className="text-foreground">
                        {user.role === 'superuser' ? 'Super Usuario' : 'Operador'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Matrícula:</span>
                      <p className="text-foreground">{user.matricula}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Creado:</span>
                      <p className="text-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No hay usuarios registrados</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

