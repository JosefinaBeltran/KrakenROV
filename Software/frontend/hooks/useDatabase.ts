import { useState, useEffect, useCallback } from 'react'
import { localDB, User, Session, InspeccionData, TempInspeccionData } from '@/lib/database'
import { backupService } from '@/lib/backupService'
import { PREDEFINED_USERS, DEFAULT_PASSWORDS, USER_PERMISSIONS, UserRole } from '@/lib/users'

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const initDB = async () => {
      try {
        await localDB.init()
        
        // Initialize predefined users if they don't exist
        await initializePredefinedUsers()
        
        // Load current user from session
        await loadCurrentUser()
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize database:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initDB()
  }, [])

  // Initialize predefined users
  const initializePredefinedUsers = useCallback(async () => {
    try {
      for (const user of PREDEFINED_USERS) {
        const existingUser = await localDB.getUser(user.id)
        if (!existingUser) {
          await localDB.saveUser(user)
          console.log('Initialized predefined user:', user.username)
        }
      }
    } catch (error) {
      console.error('Error initializing predefined users:', error)
    }
  }, [])

  // Load current user from session
  const loadCurrentUser = useCallback(async () => {
    try {
      console.log('Loading current user...')
      const session = await localDB.getActiveSession()
      console.log('Active session:', session)
      if (session && session.loggedIn) {
        console.log('Session found, loading user with ID:', session.userId)
        const user = await localDB.getUserById(session.userId)
        console.log('Found user by ID:', user)
        if (user) {
          setCurrentUser(user)
          console.log('Successfully loaded current user:', user.username, 'with role:', user.role)
        } else {
          console.error('User not found for session userId:', session.userId)
          setCurrentUser(null)
        }
      } else {
        console.log('No active session found')
        setCurrentUser(null)
      }
    } catch (error) {
      console.error('Error loading current user:', error)
      setCurrentUser(null)
    }
  }, [])

  // User operations
  const saveUser = useCallback(async (user: Omit<User, 'id' | 'createdAt'>) => {
    if (!isInitialized) return
    const dbUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    await localDB.saveUser(dbUser)
    return dbUser
  }, [isInitialized])

  // Login with username and password
  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    if (!isInitialized) {
      return { success: false, error: 'Database not initialized' }
    }

    try {
      // Find user by username
      const user = PREDEFINED_USERS.find(u => u.username === username)
      if (!user) {
        return { success: false, error: 'Usuario no encontrado' }
      }

      // Check password
      const expectedPassword = DEFAULT_PASSWORDS[user.id]
      if (password !== expectedPassword) {
        return { success: false, error: 'Contraseña incorrecta' }
      }

      // Ensure user exists in database
      await localDB.saveUser(user)
      console.log('User saved to database:', user.username)

      // Create session
      const session: Session = {
        id: Date.now().toString(),
        userId: user.id,
        loggedIn: true,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      }

      await localDB.saveSession(session)
      setCurrentUser(user)
      
      console.log('User logged in:', user.username, 'with role:', user.role)
      return { success: true, user }
      
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de login' 
      }
    }
  }, [isInitialized])

  // Get user permissions
  const getUserPermissions = useCallback((userRole: UserRole) => {
    return USER_PERMISSIONS[userRole] || USER_PERMISSIONS.operator
  }, [])

  // Check if user has permission
  const hasPermission = useCallback((permission: keyof typeof USER_PERMISSIONS.superuser) => {
    if (!currentUser) return false
    const permissions = getUserPermissions(currentUser.role)
    return permissions[permission]
  }, [currentUser, getUserPermissions])

  const getUser = useCallback(async (username: string) => {
    if (!isInitialized) return null
    return await localDB.getUser(username)
  }, [isInitialized])

  // Session operations
  const saveSession = useCallback(async (session: Omit<Session, 'id' | 'createdAt' | 'lastActivity'>) => {
    if (!isInitialized) return
    const dbSession: Session = {
      ...session,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }
    await localDB.saveSession(dbSession)
    return dbSession
  }, [isInitialized])

  const getActiveSession = useCallback(async () => {
    if (!isInitialized) return null
    return await localDB.getActiveSession()
  }, [isInitialized])

  const clearSession = useCallback(async () => {
    if (!isInitialized) return
    await localDB.clearSession()
    setCurrentUser(null)
    console.log('Session cleared and currentUser reset')
  }, [isInitialized])

  // Inspeccion operations
  const saveInspeccion = useCallback(async (inspeccion: Omit<InspeccionData, 'id' | 'createdAt' | 'updatedAt' | 'syncedToCloud' | 'createdBy'>) => {
    if (!isInitialized) {
      console.error('Database not initialized when trying to save inspeccion')
      throw new Error('Database not initialized')
    }
    if (!currentUser) {
      console.error('No current user when trying to save inspeccion')
      throw new Error('User not logged in')
    }
    const dbInspeccion: InspeccionData = {
      ...inspeccion,
      id: Date.now().toString(),
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToCloud: false
    }
    console.log('Saving inspeccion to database:', dbInspeccion)
    await localDB.saveInspeccion(dbInspeccion)
    console.log('Inspeccion saved successfully to database')
    return dbInspeccion
  }, [isInitialized, currentUser])

  const getAllInspecciones = useCallback(async () => {
    if (!isInitialized) {
      console.log('Database not initialized, returning empty array for inspecciones')
      return []
    }
    if (!currentUser) {
      console.log('No current user, returning empty array for inspecciones')
      return []
    }
    
    console.log('Getting inspecciones for user:', currentUser.username, 'with role:', currentUser.role)
    const data = await localDB.getInspeccionesByUser(currentUser.id, currentUser.role)
    console.log('Retrieved inspecciones from database:', data.length)
    return data
  }, [isInitialized, currentUser])

  const getInspeccionById = useCallback(async (id: string) => {
    if (!isInitialized) {
      console.log('Database not initialized, returning null for inspeccion by ID')
      return null
    }
    console.log('Getting inspeccion by ID from database:', id)
    const data = await localDB.getInspeccionById(id)
    console.log('Retrieved inspeccion by ID from database:', data)
    return data
  }, [isInitialized])

  const updateInspeccion = useCallback(async (inspeccion: InspeccionData) => {
    if (!isInitialized) return
    const updatedInspeccion = {
      ...inspeccion,
      updatedAt: new Date().toISOString()
    }
    await localDB.updateInspeccion(updatedInspeccion)
    return updatedInspeccion
  }, [isInitialized])

  const deleteInspeccion = useCallback(async (id: string) => {
    if (!isInitialized) return
    await localDB.deleteInspeccion(id)
  }, [isInitialized])

  // Temporary inspeccion data operations
  const saveTempInspeccionData = useCallback(async (data: Omit<TempInspeccionData, 'id' | 'createdAt'>) => {
    if (!isInitialized) {
      console.log('Database not initialized, cannot save temp data')
      return
    }
    console.log('Saving temp inspeccion data:', data)
    const dbData: TempInspeccionData = {
      ...data,
      id: 'temp',
      createdAt: new Date().toISOString()
    }
    console.log('Processed temp data for saving:', dbData)
    await localDB.saveTempInspeccionData(dbData)
    console.log('Temp data saved successfully')
    return dbData
  }, [isInitialized])

  const getTempInspeccionData = useCallback(async () => {
    if (!isInitialized) {
      console.log('Database not initialized, returning null for temp data')
      return null
    }
    console.log('Getting temp inspeccion data from database...')
    const data = await localDB.getTempInspeccionData()
    console.log('Retrieved temp data:', data)
    return data
  }, [isInitialized])

  const clearTempInspeccionData = useCallback(async () => {
    if (!isInitialized) {
      console.error('Database not initialized when trying to clear temp data')
      throw new Error('Database not initialized')
    }
    console.log('Clearing temp inspeccion data...')
    await localDB.clearTempInspeccionData()
    console.log('Temp inspeccion data cleared successfully')
  }, [isInitialized])

  // Migration
  const migrateFromLocalStorage = useCallback(async () => {
    if (!isInitialized) return
    await localDB.migrateFromLocalStorage()
  }, [isInitialized])

  // Backup and restore functions
  const exportAllData = useCallback(async () => {
    if (!isInitialized) return { success: false, error: 'Database not initialized' }
    
    try {
      console.log('Starting data export...')
      const result = await backupService.exportAllData()
      console.log('Data export result:', result)
      return result
    } catch (error) {
      console.error('Error during data export:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [isInitialized])

  const importData = useCallback(async (file: File) => {
    if (!isInitialized) return { success: false, error: 'Database not initialized' }
    
    try {
      console.log('Starting data import...')
      const result = await backupService.importData(file)
      console.log('Data import result:', result)
      return result
    } catch (error) {
      console.error('Error during data import:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [isInitialized])

  const getBackupInfo = useCallback(async (file: File) => {
    try {
      const result = await backupService.getBackupInfo(file)
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [])

  const clearAllData = useCallback(async () => {
    if (!isInitialized) return { success: false, error: 'Database not initialized' }
    
    try {
      console.log('Starting data clear...')
      const result = await backupService.clearAllData()
      console.log('Data clear result:', result)
      return result
    } catch (error) {
      console.error('Error during data clear:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [isInitialized])

  // Force reload current user
  const reloadCurrentUser = useCallback(async () => {
    if (!isInitialized) return
    await loadCurrentUser()
  }, [isInitialized, loadCurrentUser])

  return {
    isInitialized,
    isLoading,
    currentUser,
    login,
    reloadCurrentUser,
    getUserPermissions,
    hasPermission,
    saveUser,
    getUser,
    saveSession,
    getActiveSession,
    clearSession,
    saveInspeccion,
    getAllInspecciones,
    getInspeccionById,
    updateInspeccion,
    deleteInspeccion,
    saveTempInspeccionData,
    getTempInspeccionData,
    clearTempInspeccionData,
    migrateFromLocalStorage,
    exportAllData,
    importData,
    getBackupInfo,
    clearAllData
  }
}
