"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, UserPlus, Trash2, Pencil, Shield, User, Filter } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
import { useState, useEffect } from "react"
import { User as UserType } from "@/lib/database"
import { Profile } from "@/lib/database"
import { hashPassword, validatePasswordStrength } from "@/lib/password"
import { KRAKENROV_USER_ID } from "@/lib/users"
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

function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null

  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  return (
    <div className="text-xs space-y-1 mt-2 p-3 bg-muted/30 rounded-md border border-border/50">
      <p className="font-medium mb-1.5 text-foreground">Requisitos de contraseña:</p>
      <div className={`flex items-center gap-2 transition-colors ${hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
        <div className={`w-2 h-2 rounded-full ${hasMinLength ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
        <span>Mínimo 8 caracteres</span>
      </div>
      <div className={`flex items-center gap-2 transition-colors ${hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
        <div className={`w-2 h-2 rounded-full ${hasUppercase ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
        <span>Al menos 1 mayúscula</span>
      </div>
      <div className={`flex items-center gap-2 transition-colors ${hasNumber ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
        <div className={`w-2 h-2 rounded-full ${hasNumber ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
        <span>Al menos 1 número</span>
      </div>
    </div>
  )
}

export default function GestionUsuariosPage() {
  const router = useRouter()
  const { getAllUsers, getAllProfiles, deleteUser, register, updateUser, isInitialized, currentUser, hasPermission, getUserByMatricula } = useDatabase()
  const [users, setUsers] = useState<UserType[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
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

  // Dialog error state
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  // Filter state
  const [filterName, setFilterName] = useState("")
  const [filterProfileId, setFilterProfileId] = useState<string>("all")

  useEffect(() => {
    if (!isInitialized) return
    loadUsers()
    loadProfiles()
  }, [isInitialized])

  const loadProfiles = async () => {
    try {
      const profilesList = await getAllProfiles()
      // Eliminar duplicados por ID y filtrar solo perfiles válidos
      const uniqueProfilesById = Array.from(
        new Map(profilesList.map(p => [p.id, p])).values()
      ).filter(p => p && p.id && p.name && typeof p.id === 'string' && typeof p.name === 'string')

      // Eliminar duplicados por nombre (mantener el primero)
      const uniqueProfiles = Array.from(
        new Map(uniqueProfilesById.map(p => [p.name.toLowerCase(), p])).values()
      )
      setProfiles(uniqueProfiles)
    } catch (error) {
      console.error('Error loading profiles:', error)
      setProfiles([])
    }
  }

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

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesName = !filterName || user.name.toLowerCase().includes(filterName.toLowerCase()) || user.username.toLowerCase().includes(filterName.toLowerCase())
    const matchesProfile = filterProfileId === "all" || user.profileId === filterProfileId
    return matchesName && matchesProfile
  })

  const handleToggleActive = async (user: UserType) => {
    if (user.id === KRAKENROV_USER_ID) {
      setStatus({ success: false, message: 'No se puede desactivar el usuario predefinido del sistema' })
      return
    }
    setIsProcessing(true)
    setStatus(null)
    try {
      const updated: UserType = {
        ...user,
        active: !user.active,
        updatedAt: new Date().toISOString()
      }
      await updateUser(updated)
      setStatus({ success: true, message: `Usuario ${updated.active ? 'activado' : 'desactivado'} correctamente` })
      await loadUsers()
    } catch (error) {
      console.error('Error toggling user active:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar estado del usuario'
      setStatus({ success: false, message: errorMessage })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateUser = async () => {
    setDialogError(null)
    setStatus(null)

    if (!username || !password || !nombreCompleto || !matricula) {
      setDialogError('Todos los campos son requeridos')
      return
    }

    if (username.length < 3) {
      setDialogError('El nombre de usuario debe tener al menos 3 caracteres')
      return
    }

    // Validar contraseña: 8 caracteres, mayúscula y número
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      setDialogError(passwordValidation.error || 'La contraseña no cumple con los requisitos')
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
        setDialogError(null)
        setIsDialogOpen(false)
        await loadUsers()
      } else {
        setDialogError(result.error || 'Error al crear usuario')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setDialogError('Error al crear usuario')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEditClick = (user: UserType) => {
    setEditingUser(user)
    setEditNombre(user.name)
    setEditMatricula(user.matricula)
    setEditProfileId(user.profileId ?? 'profile-operator')
    setEditUsername(user.username)
    setEditPassword("")
    setEditError(null)
  }

  const handleEditSave = async () => {
    if (!editingUser) return
    setEditError(null)

    if (!editNombre?.trim() || !editMatricula?.trim() || !editUsername?.trim()) {
      setEditError('Nombre, matrícula y nombre de usuario son requeridos')
      return
    }
    if (editUsername.length < 3) {
      setEditError('El nombre de usuario debe tener al menos 3 caracteres')
      return
    }

    // Validar duplicados: nombre
    const trimmedNombre = editNombre.trim()
    const allUsers = await getAllUsers()
    const duplicateName = allUsers.find(u => u.id !== editingUser.id && u.name.toLowerCase() === trimmedNombre.toLowerCase())
    if (duplicateName) {
      setEditError('Ya existe un usuario con ese nombre completo')
      return
    }

    setShowSaveConfirm(true)
  }

  const handleConfirmSave = async () => {
    if (!editingUser) return
    setShowSaveConfirm(false)
    setIsProcessing(true)
    setEditError(null)
    setStatus(null)
    try {
      const trimmedNombre = editNombre.trim()
      const trimmedMatricula = editMatricula.trim()
      // Validar duplicados: matrícula (async check inside try block before saving)
      const duplicateMatricula = await getUserByMatricula(trimmedMatricula)
      if (duplicateMatricula && duplicateMatricula.id !== editingUser.id) {
        setEditError('Ya existe un usuario con esa matrícula')
        setIsProcessing(false)
        return
      }

      const updated: UserType = {
        ...editingUser,
        name: trimmedNombre,
        displayName: trimmedNombre,
        matricula: trimmedMatricula,
        profileId: editProfileId || editingUser.profileId,
        username: editUsername.trim(),
        role: editProfileId === 'profile-superuser' ? 'superuser' : 'operator',
        updatedAt: new Date().toISOString()
      }
      if (editPassword.length > 0) {
        const passwordValidation = validatePasswordStrength(editPassword)
        if (!passwordValidation.valid) {
          setEditError(passwordValidation.error || 'La contraseña no cumple con los requisitos')
          setIsProcessing(false)
          return
        }
        updated.passwordHash = await hashPassword(editPassword)
      }
      await updateUser(updated)
      setStatus({ success: true, message: 'Usuario actualizado correctamente' })
      setEditingUser(null)
      await loadUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar usuario'
      setEditError(errorMessage)
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
          <div className={`mb-6 p-4 rounded-lg border ${status.success
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
              {dialogError && (
                <div className="mt-4 p-3 rounded-lg border bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200">
                  <span className="text-sm font-medium">{dialogError}</span>
                </div>
              )}
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
                      placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
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
                  <PasswordRequirements password={password} />
                </div>
                <div>
                  <Label htmlFor="profile">Perfil</Label>
                  <Select value={profileId} onValueChange={setProfileId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccione un perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.filter(p => p && p.id && p.name && typeof p.id === 'string' && typeof p.name === 'string').map((p) => (
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
                    onClick={() => {
                      setIsDialogOpen(false)
                      setDialogError(null)
                      setUsername("")
                      setPassword("")
                      setNombreCompleto("")
                      setMatricula("")
                    }}
                    disabled={isProcessing}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Nombre o Usuario</label>
                <Input
                  placeholder="Buscar por nombre o usuario..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Perfil</label>
                <Select value={filterProfileId} onValueChange={setFilterProfileId}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Todos los perfiles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los perfiles</SelectItem>
                    {profiles.filter(p => p && p.id && p.name && typeof p.id === 'string' && typeof p.name === 'string').map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => {
              const isInactive = user.active === false
              const isCurrentUser = user.id === currentUser?.id
              const isKrakenUser = user.id === KRAKENROV_USER_ID
              const isAdminProfile = user.profileId === 'profile-superuser' || user.role === 'superuser'
              const showFullActions = !isCurrentUser && !isKrakenUser
              const showSelfEdit = isCurrentUser && isAdminProfile && !isKrakenUser

              return (
                <Card key={user.id} className={`hover:bg-card/80 transition-colors ${isInactive ? 'opacity-60 bg-muted/30' : ''}`}>
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
                      {(showFullActions || showSelfEdit) && (
                        <div className="flex gap-1">
                          {(showFullActions || showSelfEdit) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(user)}
                              disabled={isProcessing}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {showFullActions && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(user)}
                                disabled={isProcessing}
                                title={user.active === false ? 'Activar usuario' : 'Desactivar usuario'}
                              >
                                {user.active === false ? (
                                  <User className="w-4 h-4 text-green-600" />
                                ) : (
                                  <User className="w-4 h-4 text-gray-400" />
                                )}
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
                            </>
                          )}
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
                        <span className="font-medium text-muted-foreground">Perfil:</span>
                        <p className="text-foreground">{profileName(user.profileId ?? '') || (user.role === 'superuser' ? 'Super Usuario' : 'Operador')}</p>
                      </div>
                      {isInactive && (
                        <div className="pt-2 border-t">
                          <span className="text-xs font-medium text-muted-foreground">Estado: Desactivado</span>
                        </div>
                      )}
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
              )
            })}
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
            {editError && (
              <div className="mt-4 p-3 rounded-lg border bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200">
                <span className="text-sm font-medium">{editError}</span>
              </div>
            )}
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
                <Label htmlFor="editProfileId">Perfil</Label>
                <Select value={editProfileId} onValueChange={setEditProfileId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.filter(p => p && p.id && p.name && typeof p.id === 'string' && typeof p.name === 'string').map((p) => (
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
                    placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
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
                <PasswordRequirements password={editPassword} />
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

        <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader className="cursor-move">
              <AlertDialogTitle>Guardar cambios</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Seguro de guardar los nuevos cambios?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowSaveConfirm(false)}>No</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSave}>Sí</AlertDialogAction>
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

