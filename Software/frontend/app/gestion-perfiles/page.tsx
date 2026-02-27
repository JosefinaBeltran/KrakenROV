"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Pencil, Trash2, Shield } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
import { useState, useEffect } from "react"
import { Profile, ProfilePermissions } from "@/lib/database"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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

const PROFILE_SUPERUSER_ID = 'profile-superuser'
const PROFILE_OPERATOR_ID = 'profile-operator'

const DEFAULT_PERMISSIONS: ProfilePermissions = {
  canCreateInspecciones: false,
  canViewAllInspecciones: false,
  canEditAllInspecciones: false,
  canDeleteInspecciones: false,
  canExportData: false,
  canImportData: false,
  canManageUsers: false,
  canClearAllData: false
}

const PERMISSION_OPTIONS: { key: keyof ProfilePermissions; label: string }[] = [
  { key: 'canCreateInspecciones', label: 'Iniciar una inspección' },
  { key: 'canViewAllInspecciones', label: 'Ver todas las inspecciones' },
  { key: 'canExportData', label: 'Importar, exportar y eliminar datos' },
  { key: 'canManageUsers', label: 'Gestionar usuarios y perfiles' }
]

// "Poder importar, exportar y eliminar" maps to multiple keys
const DATA_MANAGEMENT_KEYS: (keyof ProfilePermissions)[] = [
  'canExportData', 'canImportData', 'canClearAllData', 'canDeleteInspecciones', 'canEditAllInspecciones'
]

function permissionsFromForm(form: Record<keyof ProfilePermissions, boolean>): ProfilePermissions {
  const p = { ...form }
  if (p.canExportData) {
    p.canImportData = true
    p.canClearAllData = true
    p.canDeleteInspecciones = true
    p.canEditAllInspecciones = true
  }
  return p
}

function formFromPermissions(permissions: ProfilePermissions): Record<keyof ProfilePermissions, boolean> {
  const form = { ...permissions }
  form.canExportData = !!(permissions.canExportData || permissions.canImportData || permissions.canClearAllData)
  return form
}

export default function GestionPerfilesPage() {
  const router = useRouter()
  const { getAllProfiles, saveProfile, deleteProfile, getUsersByProfileId, currentUser, hasPermission, isInitialized } = useDatabase()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editProfile, setEditProfile] = useState<Profile | null>(null)
  const [formName, setFormName] = useState("")
  const [formPermissions, setFormPermissions] = useState<Record<keyof ProfilePermissions, boolean>>(DEFAULT_PERMISSIONS)
  const [isProcessing, setIsProcessing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (isInitialized) {
      loadProfiles()
    }
  }, [isInitialized])

  const loadProfiles = async () => {
    setIsLoading(true)
    try {
      const list = await getAllProfiles()
      // Eliminar duplicados por ID (mantener el primero)
      const uniqueProfiles = Array.from(
        new Map(list.map(p => [p.id, p])).values()
      )
      // Eliminar duplicados por nombre (mantener el primero)
      const finalProfiles = Array.from(
        new Map(uniqueProfiles.map(p => [p.name.toLowerCase(), p])).values()
      )
      setProfiles(finalProfiles)
    } catch (e) {
      console.error(e)
      setStatusMessage({ success: false, message: 'Error al cargar perfiles' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setFormName("")
    setFormPermissions(DEFAULT_PERMISSIONS)
    setEditProfile(null)
    setCreateOpen(true)
  }

  const handleEditClick = (profile: Profile) => {
    setFormName(profile.name)
    setFormPermissions(formFromPermissions(profile.permissions))
    setEditProfile(profile)
    setCreateOpen(true)
  }

  const handleSaveClick = () => {
    if (!formName.trim()) {
      setStatusMessage({ success: false, message: 'El nombre del perfil es requerido' })
      return
    }

    // Validar que no haya perfiles duplicados
    const trimmedName = formName.trim()
    const existingProfile = profiles.find(p => p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== editProfile?.id)
    if (existingProfile) {
      setStatusMessage({ success: false, message: 'Ya existe un perfil con ese nombre' })
      return
    }

    setShowSaveConfirm(true)
  }

  const handleConfirmSave = async () => {
    setShowSaveConfirm(false)
    setIsProcessing(true)
    setStatusMessage(null)
    try {
      const now = new Date().toISOString()
      const permissions = permissionsFromForm(formPermissions)
      const trimmedName = formName.trim()
      let savedProfile: Profile
      if (editProfile) {
        savedProfile = {
          ...editProfile,
          name: trimmedName,
          permissions,
          updatedAt: now
        }
        await saveProfile(savedProfile)
        setStatusMessage({ success: true, message: 'Perfil actualizado correctamente' })
      } else {
        savedProfile = {
          id: `profile-${Date.now()}`,
          name: trimmedName,
          permissions,
          createdAt: now,
          updatedAt: now
        }
        await saveProfile(savedProfile)
        setStatusMessage({ success: true, message: 'Perfil creado correctamente' })
      }
      setCreateOpen(false)
      setEditProfile(null)
      await loadProfiles()
    } catch (e) {
      console.error(e)
      setStatusMessage({ success: false, message: 'Error al guardar el perfil' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteClick = (profile: Profile) => {
    setDeleteTarget(profile)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    // No se pueden eliminar los perfiles predeterminados
    if (id === PROFILE_OPERATOR_ID || id === PROFILE_SUPERUSER_ID) {
      setStatusMessage({ success: false, message: 'No se pueden eliminar los perfiles predeterminados (Super Usuario y Operador)' })
      setDeleteTarget(null)
      return
    }
    setIsProcessing(true)
    setStatusMessage(null)
    try {
      // deleteProfile ahora asigna automáticamente el perfil Operador a los usuarios
      await deleteProfile(id)
      setStatusMessage({ success: true, message: 'Perfil eliminado correctamente. Los usuarios con este perfil fueron asignados al perfil Operador.' })
      setDeleteTarget(null)
      await loadProfiles()
    } catch (e) {
      console.error(e)
      setStatusMessage({ success: false, message: 'Error al eliminar el perfil' })
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleFormPermission = (key: keyof ProfilePermissions, checked: boolean) => {
    setFormPermissions((prev) => {
      const next = { ...prev, [key]: checked }
      if (key === 'canExportData' && checked) {
        DATA_MANAGEMENT_KEYS.forEach((k) => (next[k] = true))
      }
      if (key === 'canExportData' && !checked) {
        DATA_MANAGEMENT_KEYS.forEach((k) => (next[k] = false))
      }
      return next
    })
  }

  if (!currentUser || !hasPermission('canManageUsers')) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Acceso Denegado</h3>
            <p className="text-muted-foreground mb-6">No tienes permisos para acceder a esta sección.</p>
            <Button onClick={() => router.push("/gestion-usuarios-perfiles")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/gestion-usuarios-perfiles")}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Perfiles</h1>
        </div>

        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-lg border ${statusMessage.success ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-200' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200'
              }`}
          >
            <span className="font-medium">{statusMessage.message}</span>
          </div>
        )}

        <div className="flex justify-end mb-6">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Crear perfil
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Cargando perfiles...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {profiles.map((profile) => {
              const isPreset = profile.id === PROFILE_OPERATOR_ID || profile.id === PROFILE_SUPERUSER_ID
              return (
                <Card key={profile.id} className="hover:bg-card/80 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className={`w-5 h-5 ${isPreset ? 'text-accent' : 'text-primary'}`} />
                        <CardTitle className="text-lg">{profile.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <p>Creación: {new Date(profile.createdAt).toLocaleDateString()}</p>
                      <p>Última modificación: {new Date(profile.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(profile)}
                        disabled={isProcessing}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Editar permisos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(profile)}
                        disabled={isProcessing || profile.id === PROFILE_OPERATOR_ID || profile.id === PROFILE_SUPERUSER_ID}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editProfile ? 'Editar perfil' : 'Crear perfil'}</DialogTitle>
              <DialogDescription>
                {editProfile ? 'Modifique el nombre y los permisos del perfil.' : 'Defina el nombre del perfil y sus permisos en el sistema.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="profile-name">Nombre del perfil</Label>
                <Input
                  id="profile-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Operador de campo"
                  className="mt-1"
                />
              </div>
              <div className="space-y-3">
                <Label>Permisos</Label>
                {PERMISSION_OPTIONS.map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`perm-${key}`}
                      checked={formPermissions[key]}
                      onCheckedChange={(checked) => toggleFormPermission(key, checked === true)}
                    />
                    <label htmlFor={`perm-${key}`} className="text-sm font-medium leading-none cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveClick} disabled={isProcessing} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isProcessing ? 'Guardando...' : editProfile ? 'Guardar cambios' : 'Crear perfil'}
                </Button>
                <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isProcessing}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
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
              <AlertDialogTitle>Eliminar perfil</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget && (deleteTarget.id === PROFILE_OPERATOR_ID || deleteTarget.id === PROFILE_SUPERUSER_ID)
                  ? 'No se pueden eliminar los perfiles predeterminados (Super Usuario y Operador).'
                  : '¿Está seguro de que desea eliminar este perfil? Esta acción no se puede deshacer. Los usuarios con este perfil serán asignados automáticamente al perfil Operador.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              {deleteTarget && deleteTarget.id !== PROFILE_OPERATOR_ID && deleteTarget.id !== PROFILE_SUPERUSER_ID && (
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
