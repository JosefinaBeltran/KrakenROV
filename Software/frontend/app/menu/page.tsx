"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, LogOut, Youtube, Download, Upload, Trash2 } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
import { useState, useRef } from "react"

export default function MenuPage() {
  const router = useRouter()
  const { clearSession, exportAllData, importData, getBackupInfo, clearAllData, isInitialized, currentUser, hasPermission, reloadCurrentUser } = useDatabase()
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleExportData = async () => {
    if (!isInitialized) return
    
    setIsProcessing(true)
    setStatus(null)
    
    try {
      const result = await exportAllData()
      
      if (result.success) {
        setStatus({
          success: true,
          message: `Datos exportados exitosamente: ${result.filename}`
        })
      } else {
        setStatus({
          success: false,
          message: `Error al exportar: ${result.error || 'Error desconocido'}`
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      setStatus({
        success: false,
        message: 'Error al exportar los datos'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImportData = async () => {
    if (!isInitialized) return
    
    const fileInput = fileInputRef.current
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      setStatus({
        success: false,
        message: 'Por favor selecciona un archivo de backup'
      })
      return
    }
    
    const file = fileInput.files[0]
    
    setIsProcessing(true)
    setStatus(null)
    
    try {
      // First get backup info
      const infoResult = await getBackupInfo(file)
      
      if (!infoResult.success) {
        setStatus({
          success: false,
          message: `Error al leer el archivo: ${infoResult.error}`
        })
        return
      }
      
      // Confirm import
      const confirmMessage = `¿Estás seguro de que quieres importar este backup?\n\n` +
        `Archivo: ${infoResult.info.filename}\n` +
        `Fecha: ${new Date(infoResult.info.backupDate).toLocaleString()}\n` +
        `Inspecciones: ${infoResult.info.totalInspecciones}\n` +
        `Tamaño: ${(infoResult.info.size / 1024).toFixed(1)} KB\n\n` +
        `Esto reemplazará los datos existentes.`
      
      if (!confirm(confirmMessage)) {
        setStatus({
          success: false,
          message: 'Importación cancelada'
        })
        return
      }
      
      // Import data
      const result = await importData(file)
      
      if (result.success) {
        setStatus({
          success: true,
          message: `Datos importados exitosamente. ${result.importedCount} elementos importados.`
        })
      } else {
        setStatus({
          success: false,
          message: `Error al importar: ${result.error || 'Error desconocido'}`
        })
      }
    } catch (error) {
      console.error('Import error:', error)
      setStatus({
        success: false,
        message: 'Error al importar los datos'
      })
    } finally {
      setIsProcessing(false)
      // Clear file input
      if (fileInput) {
        fileInput.value = ''
      }
    }
  }

  const handleClearAllData = async () => {
    if (!isInitialized) return
    
    const confirmMessage = '¿Estás seguro de que quieres eliminar TODOS los datos?\n\n' +
      'Esta acción no se puede deshacer.\n' +
      'Se eliminarán todas las inspecciones, imágenes y videos.'
    
    if (!confirm(confirmMessage)) {
      setStatus({
        success: false,
        message: 'Eliminación cancelada'
      })
      return
    }
    
    setIsProcessing(true)
    setStatus(null)
    
    try {
      const result = await clearAllData()
      
      if (result.success) {
        setStatus({
          success: true,
          message: 'Todos los datos han sido eliminados exitosamente'
        })
      } else {
        setStatus({
          success: false,
          message: `Error al eliminar datos: ${result.error || 'Error desconocido'}`
        })
      }
    } catch (error) {
      console.error('Clear data error:', error)
      setStatus({
        success: false,
        message: 'Error al eliminar los datos'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Debug info
  console.log('Menu render - currentUser:', currentUser)
  console.log('Menu render - hasPermission canExportData:', currentUser ? hasPermission('canExportData') : false)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Menú Principal</h1>
            {currentUser && (
              <p className="text-sm text-muted-foreground mt-1">
                Bienvenido, {currentUser.displayName} ({currentUser.role === 'superuser' ? 'Super Usuario' : 'Operador'})
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

        {/* Backup and Restore Section - Only for superusers */}
        {currentUser && hasPermission('canExportData') && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Gestión de Datos</h2>
            
            <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Exportar Datos</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Descargar todos los datos como archivo JSON
                </p>
                <Button 
                  onClick={handleExportData}
                  disabled={isProcessing || !isInitialized}
                  className="w-full"
                  variant="outline"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Exportar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Importar Datos</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Cargar datos desde archivo JSON
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportData}
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing || !isInitialized}
                  className="w-full"
                  variant="outline"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Importar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {hasPermission('canClearAllData') && (
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Limpiar Datos</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Eliminar todos los datos locales
                  </p>
                  <Button 
                    onClick={handleClearAllData}
                    disabled={isProcessing || !isInitialized}
                    className="w-full"
                    variant="outline"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpiar
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
