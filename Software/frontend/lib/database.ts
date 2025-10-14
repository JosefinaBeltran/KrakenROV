// Database schema and operations for local SQLite database
// This replaces localStorage functionality with a proper database

export interface User {
  id: string
  username: string
  name: string
  role: 'superuser' | 'operator'
  displayName: string
  createdAt: string
}

export interface Session {
  id: string
  userId: string
  loggedIn: boolean
  createdAt: string
  lastActivity: string
}

export interface InspeccionData {
  id: string
  nombreInspeccion: string
  lugarInspeccion: string
  fechaInspeccion: string
  descripcion: string
  nombreApellido: string
  matricula: string
  capturedFrames: string[]
  recordings: string[]
  recordingTime: number
  observaciones?: string
  reportImages?: string[]
  youtubeLink?: string
  createdBy: string // User ID who created this inspection
  createdAt: string
  updatedAt: string
  syncedToCloud: boolean
}

export interface TempInspeccionData {
  id: string
  nombreInspeccion: string
  lugarInspeccion: string
  fechaInspeccion: string
  descripcion: string
  nombreApellido: string
  matricula: string
  createdAt: string
}

class LocalDatabase {
  private db: IDBDatabase | null = null
  private dbName = 'KrakenROV_DB'
  private version = 1

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        console.error('Error opening database:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('Database opened successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Users table
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' })
          userStore.createIndex('username', 'username', { unique: true })
        }

        // Sessions table
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' })
          sessionStore.createIndex('userId', 'userId', { unique: false })
          sessionStore.createIndex('loggedIn', 'loggedIn', { unique: false })
        }

        // Inspecciones table
        if (!db.objectStoreNames.contains('inspecciones')) {
          const inspeccionStore = db.createObjectStore('inspecciones', { keyPath: 'id' })
          inspeccionStore.createIndex('fechaInspeccion', 'fechaInspeccion', { unique: false })
          inspeccionStore.createIndex('lugarInspeccion', 'lugarInspeccion', { unique: false })
          inspeccionStore.createIndex('nombreApellido', 'nombreApellido', { unique: false })
          inspeccionStore.createIndex('syncedToCloud', 'syncedToCloud', { unique: false })
          inspeccionStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Temporary inspeccion data table
        if (!db.objectStoreNames.contains('tempInspeccionData')) {
          db.createObjectStore('tempInspeccionData', { keyPath: 'id' })
        }

        console.log('Database schema created/updated')
      }
    })
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    const transaction = this.db.transaction([storeName], mode)
    return transaction.objectStore(storeName)
  }

  // User operations
  async saveUser(user: User): Promise<void> {
    const store = await this.getStore('users', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(user)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getUser(username: string): Promise<User | null> {
    const store = await this.getStore('users')
    return new Promise((resolve, reject) => {
      const index = store.index('username')
      const request = index.get(username)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getUserById(id: string): Promise<User | null> {
    const store = await this.getStore('users')
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  // Session operations
  async saveSession(session: Session): Promise<void> {
    const store = await this.getStore('sessions', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(session)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getActiveSession(): Promise<Session | null> {
    const store = await this.getStore('sessions')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const sessions = request.result || []
        // Find the most recent logged in session
        const activeSession = sessions
          .filter((session: Session) => session.loggedIn === true)
          .sort((a: Session, b: Session) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        resolve(activeSession || null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearSession(): Promise<void> {
    const store = await this.getStore('sessions', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => {
        console.log('All sessions cleared')
        resolve()
      }
      request.onerror = () => {
        console.error('Error clearing sessions:', request.error)
        reject(request.error)
      }
    })
  }

  // Inspeccion operations
  async saveInspeccion(inspeccion: InspeccionData): Promise<void> {
    console.log('Saving inspeccion to database:', inspeccion)
    const store = await this.getStore('inspecciones', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(inspeccion)
      request.onsuccess = () => {
        console.log('Inspeccion saved successfully to database')
        resolve()
      }
      request.onerror = () => {
        console.error('Error saving inspeccion to database:', request.error)
        reject(request.error)
      }
    })
  }

  async getAllInspecciones(): Promise<InspeccionData[]> {
    console.log('Getting all inspecciones from database...')
    const store = await this.getStore('inspecciones')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const results = request.result || []
        console.log('Retrieved inspecciones from database:', results)
        resolve(results)
      }
      request.onerror = () => {
        console.error('Error getting inspecciones from database:', request.error)
        reject(request.error)
      }
    })
  }

  // Get inspecciones filtered by user role
  async getInspeccionesByUser(userId: string, userRole: 'superuser' | 'operator'): Promise<InspeccionData[]> {
    console.log('Getting inspecciones for user:', userId, 'with role:', userRole)
    const store = await this.getStore('inspecciones')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const results = request.result || []
        
        // Filter based on user role
        let filteredResults = results
        if (userRole === 'operator') {
          // Operators can only see their own inspecciones
          filteredResults = results.filter((inspeccion: InspeccionData) => inspeccion.createdBy === userId)
        }
        // Superusers can see all inspecciones (no filtering needed)
        
        console.log('Retrieved filtered inspecciones:', filteredResults.length, 'out of', results.length)
        resolve(filteredResults)
      }
      request.onerror = () => {
        console.error('Error getting inspecciones by user from database:', request.error)
        reject(request.error)
      }
    })
  }

  async getInspeccionById(id: string): Promise<InspeccionData | null> {
    console.log('Getting inspeccion by ID from database:', id)
    const store = await this.getStore('inspecciones')
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => {
        const result = request.result || null
        console.log('Retrieved inspeccion by ID from database:', result)
        resolve(result)
      }
      request.onerror = () => {
        console.error('Error getting inspeccion by ID from database:', request.error)
        reject(request.error)
      }
    })
  }

  async updateInspeccion(inspeccion: InspeccionData): Promise<void> {
    return this.saveInspeccion(inspeccion)
  }

  async deleteInspeccion(id: string): Promise<void> {
    const store = await this.getStore('inspecciones', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getUnsyncedInspecciones(): Promise<InspeccionData[]> {
    const store = await this.getStore('inspecciones')
    return new Promise((resolve, reject) => {
      const index = store.index('syncedToCloud')
      const request = index.getAll(false)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async markInspeccionAsSynced(id: string): Promise<void> {
    const inspeccion = await this.getInspeccionById(id)
    if (inspeccion) {
      inspeccion.syncedToCloud = true
      inspeccion.updatedAt = new Date().toISOString()
      await this.saveInspeccion(inspeccion)
    }
  }

  // Temporary inspeccion data operations
  async saveTempInspeccionData(data: TempInspeccionData): Promise<void> {
    console.log('Saving temp inspeccion data to database:', data)
    const store = await this.getStore('tempInspeccionData', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => {
        console.log('Temp inspeccion data saved successfully to database')
        resolve()
      }
      request.onerror = () => {
        console.error('Error saving temp inspeccion data to database:', request.error)
        reject(request.error)
      }
    })
  }

  async getTempInspeccionData(): Promise<TempInspeccionData | null> {
    console.log('Getting temp inspeccion data from database...')
    const store = await this.getStore('tempInspeccionData')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const results = request.result || []
        console.log('Retrieved temp data results:', results)
        const data = results.length > 0 ? results[0] : null
        console.log('Returning temp data:', data)
        resolve(data)
      }
      request.onerror = () => {
        console.error('Error getting temp inspeccion data from database:', request.error)
        reject(request.error)
      }
    })
  }

  async clearTempInspeccionData(): Promise<void> {
    const store = await this.getStore('tempInspeccionData', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Migration from localStorage
  async migrateFromLocalStorage(): Promise<void> {
    try {
      // Migrate users
      const sessionData = localStorage.getItem('session')
      const userData = localStorage.getItem('user')
      
      if (sessionData && userData) {
        const session = JSON.parse(sessionData)
        const user = JSON.parse(userData)
        
        const dbUser: User = {
          id: Date.now().toString(),
          username: user.username,
          name: user.name,
          createdAt: new Date().toISOString()
        }
        
        const dbSession: Session = {
          id: Date.now().toString(),
          userId: dbUser.id,
          loggedIn: session.loggedIn,
          createdAt: new Date(session.at).toISOString(),
          lastActivity: new Date().toISOString()
        }
        
        await this.saveUser(dbUser)
        await this.saveSession(dbSession)
      }

      // Migrate inspecciones
      const inspeccionesData = localStorage.getItem('inspecciones')
      if (inspeccionesData) {
        const inspecciones: any[] = JSON.parse(inspeccionesData)
        
        for (const insp of inspecciones) {
          const dbInspeccion: InspeccionData = {
            id: insp.id,
            nombreInspeccion: insp.nombreInspeccion,
            lugarInspeccion: insp.lugarInspeccion,
            fechaInspeccion: insp.fechaInspeccion,
            descripcion: insp.descripcion,
            nombreApellido: insp.nombreApellido,
            matricula: insp.matricula,
            capturedFrames: insp.capturedFrames || [],
            recordings: insp.recordings || [],
            recordingTime: insp.recordingTime || 0,
            observaciones: insp.observaciones || '',
            reportImages: insp.reportImages || [],
            createdAt: insp.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncedToCloud: false
          }
          
          await this.saveInspeccion(dbInspeccion)
        }
      }

      console.log('Migration from localStorage completed successfully')
    } catch (error) {
      console.error('Error during migration:', error)
      throw error
    }
  }

  // Cloud sync operations
  async syncToCloud(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    try {
      const unsyncedInspecciones = await this.getUnsyncedInspecciones()
      let syncedCount = 0

      for (const inspeccion of unsyncedInspecciones) {
        try {
          // Here you would implement the actual cloud sync logic
          // For now, we'll simulate a successful sync
          const response = await fetch('/api/cloud-sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(inspeccion)
          })

          if (response.ok) {
            await this.markInspeccionAsSynced(inspeccion.id)
            syncedCount++
          } else {
            throw new Error(`Failed to sync inspeccion ${inspeccion.id}`)
          }
        } catch (error) {
          console.error(`Error syncing inspeccion ${inspeccion.id}:`, error)
          // Continue with other inspecciones even if one fails
        }
      }

      return { success: true, syncedCount }
    } catch (error) {
      console.error('Error during cloud sync:', error)
      return { 
        success: false, 
        syncedCount: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

// Create singleton instance
export const localDB = new LocalDatabase()

// Initialize database on module load
if (typeof window !== 'undefined') {
  localDB.init().catch(console.error)
}
