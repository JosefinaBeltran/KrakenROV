"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, UserPlus, Trash2, Pencil, Shield, User } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
import { useState, useEffect } from "react"
import { User as UserType } from "@/lib/database"
import { Profile } from "@/lib/database"
import { hashPassword } from "@/lib/password"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function GestionUsuariosPage() {
  const router = useRouter()
  const { getAllUsers, getAllProfiles, deleteUser, register, updateUser, isInitialized, currentUser, hasPermission } = useDatabase()
  const [users, setUsers] = useState<UserType[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null)
  const [editConfirmTarget, setEditConfirmTarget] = useState<UserType | null>(null)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Create form state
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [nombreCompleto, setNombreCompleto] = useState("")
  const [matricula, setMatricula] = useState("")
  const [profileId, setProfileId] = useState("")

  // Edit form state
  const [editNombre, setEditNombre] = useState("")
  const [editMatricula, setEditMatricula] = useState("")
  const [editProfileId, setEditProfileId] = useState("")
  const [editUsername, setEditUsername] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editShowPassword, setEditShowPassword] = useState(false)

  useEffect(() => {
    if (!isInitialized) return
    loadUsers()
    getAllProfiles().then(setProfiles)
  }, [isInitialized])

  useEffect(() => {
    if (profiles.length > 0 && !profileId) {
      const defaultProfile = profiles.find((p) => p.id === 'profile-operator') ?? profiles[0]
      setProfileId(defaultProfile.id)
    }
  }, [profiles, profileId])

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

  const profileName = (id: string) => profiles.find((p) => p.id === id)?.name ?? id

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
      const result = await register(username, password, nombreCompleto, matricula, profileId || undefined)
      if (result.success && result.user) {
        setStatus({ success: true, message: 'Usuario creado exitosamente' })
        setUsername("")
        setPassword("")
        setNombreCompleto("")
        setMatricula("")
        setProfileId(profiles[0]?.id ?? '')
        setIsDialogOpen(false)
        await loadUsers()
      } else {
        setStatus({ success: false, message: result.error || 'Error al crear usuario' })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setStatus({ success: false, message: 'Error al crear usuario' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEditClick = (user: UserType) => {
    setEditConfirmTarget(user)
  }

  const handleEditConfirmProceed = () => {
    if (!editConfirmTarget) return
    setEditingUser(editConfirmTarget)
    setEditNombre(editConfirmTarget.name)
    setEditMatricula(editConfirmTarget.matricula)
    setEditProfileId(editConfirmTarget.profileId ?? 'profile-operator')
    setEditUsername(editConfirmTarget.username)
    setEditPassword("")
    setEditConfirmTarget(null)
  }

  const handleEditSave = async () => {
    if (!editingUser) return
    if (!editNombre?.trim() || !editMatricula?.trim() || !editUsername?.trim()) {
      setStatus({ success: false, message: 'Nombre, matrícula y nombre de usuario son requeridos' })
      return
    }
    if (editUsername.length < 3) {
      setStatus({ success: false, message: 'El nombre de usuario debe tener al menos 3 caracteres' })
      return
    }
    setIsProcessing(true)
    setStatus(null)
    try {
      const updated: UserType = {
        ...editingUser,
        name: editNombre.trim(),
        displayName: editNombre.trim(),
        matricula: editMatricula.trim(),
        profileId: editProfileId || editingUser.profileId,
        username: editUsername.trim(),
        role: editProfileId === 'profile-superuser' ? 'superuser' : 'operator',
        updatedAt: new Date().toISOString()
      }
      if (editPassword.length >= 6) {
        updated.passwordHash = await hashPassword(editPassword)
      }
      await updateUser(updated)
      setStatus({ success: true, message: 'Usuario actualizado correctamente' })
      setEditingUser(null)
      await loadUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      setStatus({ success: false, message: 'Error al actualizar usuario' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsProcessing(true)
    setStatus(null)
    try {
      const result = await deleteUser(deleteTarget.id)
      if (result.success) {
        setStatus({ success: true, message: 'Usuario eliminado exitosamente' })
        setDeleteTarget(null)
        await loadUsers()
      } else {
        setStatus({ success: false, message: result.error || 'Error al eliminar usuario' })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setStatus({ success: false, message: 'Error al eliminar usuario' })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!currentUser || !hasPermission('canManageUsers')) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Acceso Denegado</h3>
            <p className="text-muted-foreground mb-6">No tienes permisos para acceder a esta sección.</p>
            <Button
              onClick={() => router.push("/gestion-usuarios-perfiles")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Volver
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
            onClick={() => router.push("/gestion-usuarios-perfiles")}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
        </div>

        {status && (
          <div className={`mb-6 p-4 rounded-lg border ${
            status.success
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-200'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200'
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
                  <Select value={profileId} onValueChange={setProfileId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccione un perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
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
                      {user.profileId === 'profile-superuser' || user.role === 'superuser' ? (
                        <Shield className="w-5 h-5 text-amber-500" />
                      ) : (
                        <User className="w-5 h-5 text-blue-500" />
                      )}
                      <CardTitle className="text-lg">{user.displayName}</CardTitle>
                    </div>
                    {user.id !== currentUser?.id &&
                     user.id !== 'superuser-001' &&
                     user.id !== 'operator-001' && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(user)}
                          disabled={isProcessing}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(user)}
                          disabled={isProcessing}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
                      <p className="text-foreground">{profileName(user.profileId ?? '') || (user.role === 'superuser' ? 'Super Usuario' : 'Operador')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Matrícula:</span>
                      <p className="text-foreground">{user.matricula}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Creado:</span>
                      <p className="text-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Modificado:</span>
                      <p className="text-foreground">{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '-'}</p>
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

        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar usuario</DialogTitle>
              <DialogDescription>
                Modifique los datos del usuario. Deje la contraseña en blanco para no cambiarla.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="editNombre">Nombre completo</Label>
                <Input id="editNombre" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editMatricula">Matrícula</Label>
                <Input id="editMatricula" value={editMatricula} onChange={(e) => setEditMatricula(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editProfileId">Rol</Label>
                <Select value={editProfileId} onValueChange={setEditProfileId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editUsername">Nombre de usuario</Label>
                <Input id="editUsername" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editPassword">Nueva contraseña (opcional)</Label>
                <div className="relative mt-1">
                  <Input
                    id="editPassword"
                    type={editShowPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setEditShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {editShowPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditSave} disabled={isProcessing} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isProcessing ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isProcessing}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!editConfirmTarget} onOpenChange={(open) => !open && setEditConfirmTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Editar usuario</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Desea proseguir con la edición de este usuario?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleEditConfirmProceed}>Proceder</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget && (
                  <>¿Está seguro de que desea eliminar al usuario &quot;{deleteTarget.displayName}&quot;? Esta acción no se puede deshacer.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

