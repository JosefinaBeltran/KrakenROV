// Backup and restore service for complete data export/import
import { localDB, InspeccionData, User, Session } from './database'

export interface BackupData {
  version: string
  timestamp: string
  inspecciones: InspeccionData[]
  users: User[]
  sessions: Session[]
  metadata: {
    totalInspecciones: number
    totalUsers: number
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
      
      // Get users (if any)
      const users: User[] = [] // For now, we don't have a getAllUsers method
      
      // Get sessions (if any)
      const sessions: Session[] = [] // For now, we don't have a getAllSessions method
      
      // Create backup data structure
      const backupData: BackupData = {
        version: this.version,
        timestamp: new Date().toISOString(),
        inspecciones,
        users,
        sessions,
        metadata: {
          totalInspecciones: inspecciones.length,
          totalUsers: users.length,
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
  async importData(file: File): Promise<{ success: boolean; importedCount?: number; error?: string }> {
    try {
      console.log('Starting data import from file:', file.name)
      
      // Read file content
      const text = await file.text()
      const backupData: BackupData = JSON.parse(text)
      
      // Validate backup data structure
      if (!this.validateBackupData(backupData)) {
        throw new Error('Invalid backup file format')
      }
      
      console.log('Backup data validated:', backupData.metadata)
      
      let importedCount = 0
      
      // Import inspecciones
      for (const inspeccion of backupData.inspecciones) {
        try {
          // Check if inspeccion already exists
          const existing = await localDB.getInspeccionById(inspeccion.id)
          
          if (!existing) {
            // Import new inspeccion
            await localDB.saveInspeccion(inspeccion)
            importedCount++
            console.log('Imported inspeccion:', inspeccion.id)
          } else {
            // Update existing inspeccion if backup is newer
            const backupDate = new Date(inspeccion.updatedAt)
            const existingDate = new Date(existing.updatedAt)
            
            if (backupDate > existingDate) {
              await localDB.updateInspeccion(inspeccion)
              importedCount++
              console.log('Updated inspeccion:', inspeccion.id)
            }
          }
        } catch (error) {
          console.error('Error importing inspeccion:', inspeccion.id, error)
        }
      }
      
      // Import users (if any)
      for (const user of backupData.users) {
        try {
          await localDB.saveUser(user)
          console.log('Imported user:', user.id)
        } catch (error) {
          console.error('Error importing user:', user.id, error)
        }
      }
      
      // Import sessions (if any)
      for (const session of backupData.sessions) {
        try {
          await localDB.saveSession(session)
          console.log('Imported session:', session.id)
        } catch (error) {
          console.error('Error importing session:', session.id, error)
        }
      }
      
      console.log('Data import completed successfully:', { importedCount })
      
      return { success: true, importedCount }
      
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
      Array.isArray(data.users) &&
      Array.isArray(data.sessions) &&
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
      
      return {
        success: true,
        info: {
          version: backupData.version,
          backupDate: backupData.metadata.backupDate,
          totalInspecciones: backupData.metadata.totalInspecciones,
          totalUsers: backupData.metadata.totalUsers,
          totalSessions: backupData.metadata.totalSessions,
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
