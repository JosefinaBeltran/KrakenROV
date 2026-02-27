// Backup and restore service for complete data export/import
import { localDB, InspeccionData, User, Session, Profile } from './database'

export interface BackupData {
  version: string
  timestamp: string
  inspecciones: InspeccionData[]
  users: User[]
  profiles: Profile[]
  sessions: Session[]
  metadata: {
    totalInspecciones: number
    totalUsers: number
    totalProfiles: number
    totalSessions: number
    backupDate: string
    appVersion: string
  }
}

class BackupService {
  private version = '1.0.0'

  // Export all data to JSON file
  async exportAllData(): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
      console.log('Starting data export...')
      
      // Get all data from local database
      const inspecciones = await localDB.getAllInspecciones()
      console.log('Retrieved inspecciones:', inspecciones.length)
      
      // Get users and profiles
      const users: User[] = await localDB.getAllUsers()
      console.log('Retrieved users:', users.length)

      const profiles: Profile[] = await localDB.getAllProfiles()
      console.log('Retrieved profiles:', profiles.length)
      
      // Get sessions (optional – currently not exported in detail)
      const sessions: Session[] = [] // Placeholder: implement getAllSessions in localDB if needed
      
      // Create backup data structure
      const backupData: BackupData = {
        version: this.version,
        timestamp: new Date().toISOString(),
        inspecciones,
        users,
        profiles,
        sessions,
        metadata: {
          totalInspecciones: inspecciones.length,
          totalUsers: users.length,
          totalProfiles: profiles.length,
          totalSessions: sessions.length,
          backupDate: new Date().toISOString(),
          appVersion: this.version
        }
      }
      
      // Convert to JSON
      const jsonData = JSON.stringify(backupData, null, 2)
      
      // Create and download file
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `krakenrov-backup-${timestamp}.json`
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(url)
      
      console.log('Data export completed successfully:', filename)
      
      return { success: true, filename }
      
    } catch (error) {
      console.error('Error exporting data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Import data from JSON file
  async importData(file: File): Promise<{ success: boolean; importedCount?: number; error?: string; failedInspecciones?: string[] }> {
    try {
      console.log('Starting data import from file:', file.name)
      
      // Read file content
      const text = await file.text()
      const backupData: BackupData = JSON.parse(text)
      
      // Validate backup data structure (soporta backups antiguos sin usuarios/perfiles)
      if (!this.validateBackupData(backupData)) {
        throw new Error('Invalid backup file format')
      }
      
      console.log('Backup data validated:', backupData.metadata)
      console.log('Total inspecciones to import:', backupData.inspecciones.length)
      
      let importedCount = 0
      let updatedCount = 0
      let skippedCount = 0
      const failedInspecciones: string[] = []
      const errors: string[] = []
      
      // Import inspecciones
      for (let i = 0; i < backupData.inspecciones.length; i++) {
        const inspeccion = backupData.inspecciones[i]
        try {
          // Validate inspeccion has required fields
          if (!inspeccion.id || !inspeccion.nombreInspeccion) {
            const errorMsg = `Inspección ${i + 1} inválida: falta id o nombreInspeccion`
            console.error(errorMsg, inspeccion)
            errors.push(errorMsg)
            failedInspecciones.push(inspeccion.id || `inspeccion-${i + 1}`)
            continue
          }

          // Ensure required fields exist
          const inspeccionToImport: InspeccionData = {
            ...inspeccion,
            id: inspeccion.id,
            nombreInspeccion: inspeccion.nombreInspeccion,
            lugarInspeccion: inspeccion.lugarInspeccion || '',
            fechaInspeccion: inspeccion.fechaInspeccion || new Date().toISOString(),
            descripcion: inspeccion.descripcion || '',
            nombreApellido: inspeccion.nombreApellido || '',
            matricula: inspeccion.matricula || '',
            capturedFrames: inspeccion.capturedFrames || [],
            recordings: inspeccion.recordings || [],
            recordingTime: inspeccion.recordingTime || 0,
            createdBy: inspeccion.createdBy || '',
            createdAt: inspeccion.createdAt || new Date().toISOString(),
            updatedAt: inspeccion.updatedAt || new Date().toISOString(),
            syncedToCloud: inspeccion.syncedToCloud || false
          }
          
          // Check if inspeccion already exists
          const existing = await localDB.getInspeccionById(inspeccionToImport.id)
          
          if (!existing) {
            // Import new inspeccion
            await localDB.saveInspeccion(inspeccionToImport)
            importedCount++
            console.log(`[${i + 1}/${backupData.inspecciones.length}] Imported inspeccion:`, inspeccionToImport.id, inspeccionToImport.nombreInspeccion)
          } else {
            // Update existing inspeccion if backup is newer
            const backupDate = new Date(inspeccionToImport.updatedAt)
            const existingDate = new Date(existing.updatedAt)
            
            if (backupDate > existingDate) {
              await localDB.updateInspeccion(inspeccionToImport)
              updatedCount++
              console.log(`[${i + 1}/${backupData.inspecciones.length}] Updated inspeccion:`, inspeccionToImport.id, inspeccionToImport.nombreInspeccion)
            } else {
              skippedCount++
              console.log(`[${i + 1}/${backupData.inspecciones.length}] Skipped inspeccion (existing is newer):`, inspeccionToImport.id, inspeccionToImport.nombreInspeccion)
            }
          }
        } catch (error) {
          const errorMsg = `Error importing inspeccion ${i + 1} (${inspeccion.id || 'unknown'}): ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMsg, error)
          errors.push(errorMsg)
          failedInspecciones.push(inspeccion.id || `inspeccion-${i + 1}`)
        }
      }
      
      const totalProcessed = importedCount + updatedCount + skippedCount
      console.log('Import summary:', {
        total: backupData.inspecciones.length,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        failed: failedInspecciones.length,
        totalProcessed
      })
      
      if (errors.length > 0) {
        console.warn('Import errors:', errors)
      }

      // Import profiles (if any)
      const profilesToImport = Array.isArray((backupData as any).profiles) ? backupData.profiles : []
      if (profilesToImport.length > 0) {
        for (const profile of profilesToImport) {
          try {
            await localDB.saveProfile(profile)
            console.log('Imported profile:', profile.id)
          } catch (error) {
            console.error('Error importing profile:', profile.id, error)
          }
        }
      }

      // Import users (if any)
      const usersToImport = Array.isArray((backupData as any).users) ? backupData.users : []
      for (const user of usersToImport) {
        try {
          await localDB.saveUser(user)
          console.log('Imported user:', user.id)
        } catch (error) {
          console.error('Error importing user:', user.id, error)
        }
      }
      
      // Import sessions (if any)
      const sessionsToImport = Array.isArray((backupData as any).sessions) ? backupData.sessions : []
      for (const session of sessionsToImport) {
        try {
          await localDB.saveSession(session)
          console.log('Imported session:', session.id)
        } catch (error) {
          console.error('Error importing session:', session.id, error)
        }
      }
      
      const totalImported = importedCount + updatedCount
      console.log('Data import completed:', { 
        imported: importedCount, 
        updated: updatedCount, 
        skipped: skippedCount,
        failed: failedInspecciones.length,
        total: totalImported
      })
      
      // If there were failures, include them in the response
      if (failedInspecciones.length > 0) {
        const errorMessage = `${failedInspecciones.length} inspección(es) no se pudieron importar. ${totalImported} importadas exitosamente.`
        return { 
          success: totalImported > 0, 
          importedCount: totalImported,
          error: errorMessage,
          failedInspecciones
        }
      }
      
      return { success: true, importedCount: totalImported }
      
    } catch (error) {
      console.error('Error importing data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Validate backup data structure
  private validateBackupData(data: any): data is BackupData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.version === 'string' &&
      typeof data.timestamp === 'string' &&
      Array.isArray(data.inspecciones) &&
      data.metadata &&
      typeof data.metadata.totalInspecciones === 'number'
    )
  }

  // Get backup info without importing
  async getBackupInfo(file: File): Promise<{ success: boolean; info?: any; error?: string }> {
    try {
      const text = await file.text()
      const backupData: BackupData = JSON.parse(text)
      
      if (!this.validateBackupData(backupData)) {
        throw new Error('Invalid backup file format')
      }
      
      const metadata: any = backupData.metadata || {}
      const usersArray = Array.isArray((backupData as any).users) ? backupData.users : []
      const profilesArray = Array.isArray((backupData as any).profiles) ? backupData.profiles : []
      const sessionsArray = Array.isArray((backupData as any).sessions) ? backupData.sessions : []

      return {
        success: true,
        info: {
          version: backupData.version,
          backupDate: metadata.backupDate,
          totalInspecciones: metadata.totalInspecciones,
          totalUsers: typeof metadata.totalUsers === 'number' ? metadata.totalUsers : usersArray.length,
          totalProfiles: typeof metadata.totalProfiles === 'number' ? metadata.totalProfiles : profilesArray.length,
          totalSessions: typeof metadata.totalSessions === 'number' ? metadata.totalSessions : sessionsArray.length,
          filename: file.name,
          size: file.size
        }
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Clear all local data (use with caution!)
  async clearAllData(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Clearing all local data...')
      
      // Clear all inspecciones
      const inspecciones = await localDB.getAllInspecciones()
      for (const inspeccion of inspecciones) {
        await localDB.deleteInspeccion(inspeccion.id)
      }
      
      // Clear sessions
      await localDB.clearSession()
      
      console.log('All local data cleared successfully')
      
      return { success: true }
      
    } catch (error) {
      console.error('Error clearing data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export const backupService = new BackupService()
