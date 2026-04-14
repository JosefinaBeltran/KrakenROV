"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Upload, Trash2 } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
import { useState, useRef } from "react"
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

export default function GestionDatosPage() {
  const router = useRouter()
  const { exportAllData, importData, getBackupInfo, clearAllData, isInitialized, currentUser, hasPermission, isLoading } = useDatabase()
  type ProcessingAction = "export" | "import" | "clear" | null
  const [processingAction, setProcessingAction] = useState<ProcessingAction>(null)
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importConfirm, setImportConfirm] = useState<{ file: File; info: { filename: string; backupDate: string; totalInspecciones: number; size: number } } | null>(null)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const handleExportData = async () => {
    if (!isInitialized) return
    
    setProcessingAction("export")
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
      setProcessingAction(null)
    }
  }

  const handleImportFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isInitialized) return
    const fileInput = e.target
    if (!fileInput.files || fileInput.files.length === 0) return
    const file = fileInput.files[0]
    setStatus(null)
    try {
      const infoResult = await getBackupInfo(file)
      if (!infoResult.success) {
        setStatus({ success: false, message: `Error al leer el archivo: ${infoResult.error}` })
        fileInput.value = ''
        return
      }
      setImportConfirm({ file, info: infoResult.info })
    } catch (error) {
      console.error('Import info error:', error)
      setStatus({ success: false, message: 'Error al leer el archivo' })
    }
    fileInput.value = ''
  }

  const handleImportConfirm = async () => {
    if (!importConfirm) return
    setProcessingAction("import")
    setStatus(null)
    try {
      const result = await importData(importConfirm.file)
      if (result.success) {
        let message = `Datos importados exitosamente. ${result.importedCount || 0} inspección(es) importada(s).`
        if (result.failedInspecciones && result.failedInspecciones.length > 0) {
          message += ` ${result.failedInspecciones.length} inspección(es) no se pudieron importar.`
        }
        setStatus({ success: true, message })
      } else {
        let errorMessage = result.error || 'Error desconocido'
        if (result.importedCount && result.importedCount > 0) {
          errorMessage = `${errorMessage} ${result.importedCount} inspección(es) se importaron antes del error.`
        }
        setStatus({ success: false, message: errorMessage })
      }
    } catch (error) {
      console.error('Import error:', error)
      setStatus({ success: false, message: 'Error al importar los datos' })
    } finally {
      setProcessingAction(null)
      setImportConfirm(null)
    }
  }

  const handleImportCancel = () => {
    setImportConfirm(null)
  }

  const handleClearAllDataConfirm = async () => {
    if (!isInitialized) return
    setClearConfirmOpen(false)
    setProcessingAction("clear")
    setStatus(null)
    try {
      const result = await clearAllData()
      if (result.success) {
        setStatus({ success: true, message: 'Todos los datos han sido eliminados exitosamente' })
      } else {
        setStatus({ success: false, message: `Error al eliminar datos: ${result.error || 'Error desconocido'}` })
      }
    } catch (error) {
      console.error('Clear data error:', error)
      setStatus({ success: false, message: 'Error al eliminar los datos' })
    } finally {
      setProcessingAction(null)
    }
  }

  // Show loading while session/permissions are being resolved
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Cargando...</h3>
            <p className="text-muted-foreground">Verificando permisos</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user has permission
  if (!currentUser || !hasPermission('canExportData')) {
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/menu")}
            className="border-border hover:bg-secondary bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Datos</h1>
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

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="flex flex-col h-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Exportar Datos</CardTitle>
            </CardHeader>
            <CardContent className="text-center flex flex-col flex-1">
              <p className="text-sm text-muted-foreground mb-4">
                Descargar todos los datos como archivo JSON
              </p>
              <div className="mt-auto">
                <Button 
                  onClick={handleExportData}
                  disabled={processingAction !== null || !isInitialized}
                  className="w-full"
                  variant="outline"
                >
                  {processingAction === "export" ? (
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
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Download className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Importar Datos</CardTitle>
            </CardHeader>
            <CardContent className="text-center flex flex-col flex-1">
              <p className="text-sm text-muted-foreground mb-4">
                Cargar datos desde archivo JSON
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFileSelect}
                aria-label="Seleccionar archivo de backup"
              />
              <div className="mt-auto">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processingAction !== null || !isInitialized}
                  className="w-full"
                  variant="outline"
                >
                  {processingAction === "import" ? (
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
              </div>
            </CardContent>
          </Card>

          {hasPermission('canClearAllData') && (
            <Card className="flex flex-col h-full">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-xl">Limpiar Datos</CardTitle>
              </CardHeader>
              <CardContent className="text-center flex flex-col flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Eliminar todos los datos locales
                </p>
                <div className="mt-auto">
                  <Button 
                    onClick={() => setClearConfirmOpen(true)}
                    disabled={processingAction !== null || !isInitialized}
                    className="w-full"
                    variant="outline"
                  >
                    {processingAction === "clear" ? (
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
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <AlertDialog open={!!importConfirm} onOpenChange={(open) => !open && setImportConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar importación</AlertDialogTitle>
              <AlertDialogDescription>
                {importConfirm && (
                  <>
                    ¿Está seguro de que desea importar este backup?
                    <br /><br />
                    Archivo: {importConfirm.info.filename}<br />
                    Fecha: {new Date(importConfirm.info.backupDate).toLocaleString()}<br />
                    Inspecciones: {importConfirm.info.totalInspecciones}<br />
                    Tamaño: {(importConfirm.info.size / 1024).toFixed(1)} KB
                    <br /><br />
                    Esto reemplazará los datos existentes.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setImportConfirm(null); setStatus({ success: false, message: 'Importación cancelada' }); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleImportConfirm} disabled={processingAction !== null}>Importar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar todos los datos</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro de que desea eliminar TODOS los datos? Esta acción no se puede deshacer. Se eliminarán todas las inspecciones, imágenes y videos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAllDataConfirm} disabled={processingAction !== null} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

