import { useState, useEffect, useCallback } from 'react'
import { localDB, User, Session, InspeccionData, TempInspeccionData, Profile, ProfilePermissions } from '@/lib/database'
import { backupService } from '@/lib/backupService'
import { getPredefinedUsers, DEFAULT_PASSWORDS, USER_PERMISSIONS, UserRole, KRAKENROV_USER_ID } from '@/lib/users'
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/password'

function arraysContentChanged<T>(a: T[] | undefined, b: T[] | undefined): boolean {
  const aa = a ?? []
  const bb = b ?? []
  if (aa.length !== bb.length) return true
  for (let i = 0; i < aa.length; i++) {
    if (aa[i] !== bb[i]) return true
  }
  return false
}

/** Resumen de campos modificados (sin volcar base64 completo en el log). */
function summarizeInspeccionChanges(prev: InspeccionData, next: InspeccionData): Record<string, unknown> {
  const delta: Record<string, unknown> = {}
  const scalarKeys: (keyof InspeccionData)[] = [
    'nombreInspeccion',
    'lugarInspeccion',
    'fechaInspeccion',
    'descripcion',
    'nombreApellido',
    'matricula',
    'recordingTime',
    'youtubeLink',
    'observaciones',
    'syncedToCloud',
  ]
  for (const k of scalarKeys) {
    if (prev[k] !== next[k]) {
      delta[String(k)] = { desde: prev[k], hacia: next[k] }
    }
  }
  if (arraysContentChanged(prev.capturedFrames, next.capturedFrames)) {
    delta.capturedFrames = {
      cantidadAntes: prev.capturedFrames?.length ?? 0,
      cantidadDespues: next.capturedFrames?.length ?? 0,
      mismaCantidad: (prev.capturedFrames?.length ?? 0) === (next.capturedFrames?.length ?? 0),
    }
  }
  if (arraysContentChanged(prev.recordings, next.recordings)) {
    delta.recordings = {
      cantidadAntes: prev.recordings?.length ?? 0,
      cantidadDespues: next.recordings?.length ?? 0,
      mismaCantidad: (prev.recordings?.length ?? 0) === (next.recordings?.length ?? 0),
    }
  }
  if (JSON.stringify(prev.sensorCharts ?? null) !== JSON.stringify(next.sensorCharts ?? null)) {
    delta.sensorCharts = {
      antes: prev.sensorCharts ? 'presente' : 'ausente',
      despues: next.sensorCharts ? 'presente' : 'ausente',
    }
  }
  if (arraysContentChanged(prev.reportImages, next.reportImages)) {
    delta.reportImages = {
      cantidadAntes: prev.reportImages?.length ?? 0,
      cantidadDespues: next.reportImages?.length ?? 0,
    }
  }
  return delta
}

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentUserPermissions, setCurrentUserPermissions] = useState<ProfilePermissions | null>(null)

  const logSystemEvent = useCallback(async (
    eventType: string,
    message: string,
    options?: {
      severity?: "INFO" | "WARN" | "ERROR" | "SECURITY"
      user?: string
      context?: Record<string, unknown>
    }
  ) => {
    try {
      await fetch("/api/system-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          message,
          severity: options?.severity ?? "INFO",
          user: options?.user,
          context: options?.context,
        }),
      })
    } catch (error) {
      // Never block app flows because of logging failures.
      console.error("Could not send system log:", error)
    }
  }, [])

  useEffect(() => {
    const initDB = async () => {
      try {
        await localDB.init()
        
        // Initialize predefined profiles if they don't exist
        await initializePredefinedProfiles()
        
        // Initialize predefined users if they don't exist
        await initializePredefinedUsers()
        
        // Load current user from session
        await loadCurrentUser()
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize database:', error)
        await logSystemEvent("SYSTEM_INIT_ERROR", "Fallo al inicializar la base de datos", {
          severity: "ERROR",
          context: { error: error instanceof Error ? error.message : "Unknown error" }
        })
      } finally {
        setIsLoading(false)
      }
    }

    initDB()
  }, [logSystemEvent])

  // Initialize predefined profiles
  const initializePredefinedProfiles = useCallback(async () => {
    try {
      const PROFILE_SUPERUSER_ID = 'profile-superuser'
      const PROFILE_OPERATOR_ID = 'profile-operator'
      
      const DEFAULT_SUPERUSER_PERMISSIONS: ProfilePermissions = {
        canViewAllInspecciones: true,
        canCreateInspecciones: true,
        canEditAllInspecciones: true,
        canEditInspecciones: true,
        canDeleteInspecciones: true,
        canExportData: true,
        canImportData: true,
        canManageUsers: true,
        canClearAllData: true
      }
      
      const DEFAULT_OPERATOR_PERMISSIONS: ProfilePermissions = {
        canViewAllInspecciones: true,
        canCreateInspecciones: true,
        canEditAllInspecciones: false,
        canEditInspecciones: false,
        canDeleteInspecciones: false,
        canExportData: false,
        canImportData: false,
        canManageUsers: false,
        canClearAllData: false
      }
      
      const now = new Date().toISOString()
      
      // Check and create Super Usuario profile
      const superuserProfile = await localDB.getProfileById(PROFILE_SUPERUSER_ID)
      if (!superuserProfile) {
        await localDB.saveProfile({
          id: PROFILE_SUPERUSER_ID,
          name: 'Super Usuario',
          permissions: DEFAULT_SUPERUSER_PERMISSIONS,
          createdAt: now,
          updatedAt: now
        } as Profile)
        console.log('Initialized predefined profile: Super Usuario')
      }
      
      // Check and create Operador profile
      const operatorProfile = await localDB.getProfileById(PROFILE_OPERATOR_ID)
      if (!operatorProfile) {
        await localDB.saveProfile({
          id: PROFILE_OPERATOR_ID,
          name: 'Operador',
          permissions: DEFAULT_OPERATOR_PERMISSIONS,
          createdAt: now,
          updatedAt: now
        } as Profile)
        console.log('Initialized predefined profile: Operador')
      }
    } catch (error) {
      console.error('Error initializing predefined profiles:', error)
    }
  }, [])

  // Initialize predefined users
  const initializePredefinedUsers = useCallback(async () => {
    try {
      const predefinedUsers = await getPredefinedUsers()
      for (const user of predefinedUsers) {
        const existingUser = await localDB.getUserById(user.id)
        if (!existingUser) {
          await localDB.saveUser(user)
          console.log('Initialized predefined user:', user.username)
        } else {
          // Update existing user if passwordHash, matricula, profileId or updatedAt is missing
          const needsUpdate =
            !existingUser.passwordHash ||
            !existingUser.matricula ||
            !existingUser.profileId ||
            !existingUser.updatedAt
          if (needsUpdate) {
            const updatedUser: User = {
              ...existingUser,
              passwordHash: existingUser.passwordHash || user.passwordHash,
              matricula: existingUser.matricula || user.matricula,
              profileId: existingUser.profileId ?? user.profileId,
              updatedAt: existingUser.updatedAt ?? user.updatedAt ?? new Date().toISOString()
            }
            await localDB.saveUser(updatedUser)
            console.log('Updated predefined user:', user.username)
          }
        }
      }
    } catch (error) {
      console.error('Error initializing predefined users:', error)
    }
  }, [])

  // Normalize profile permissions so every key is a boolean (fixes incomplete data from DB/import)
  const normalizePermissions = useCallback((p: ProfilePermissions | null | undefined): ProfilePermissions | null => {
    if (!p || typeof p !== 'object') return null
    const def: ProfilePermissions = {
      canCreateInspecciones: false,
      canViewAllInspecciones: false,
      canEditAllInspecciones: false,
      canEditInspecciones: false,
      canDeleteInspecciones: false,
      canExportData: false,
      canImportData: false,
      canManageUsers: false,
      canClearAllData: false
    }
    return {
      canCreateInspecciones: Boolean(p.canCreateInspecciones),
      canViewAllInspecciones: Boolean(p.canViewAllInspecciones),
      canEditAllInspecciones: Boolean(p.canEditAllInspecciones),
      canEditInspecciones: Boolean(p.canEditInspecciones),
      canDeleteInspecciones: Boolean(p.canDeleteInspecciones),
      canExportData: Boolean(p.canExportData),
      canImportData: Boolean(p.canImportData),
      canManageUsers: Boolean(p.canManageUsers),
      canClearAllData: Boolean(p.canClearAllData)
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
          if (user.profileId) {
            const profile = await localDB.getProfileById(user.profileId)
            setCurrentUserPermissions(normalizePermissions(profile?.permissions) ?? null)
          } else {
            setCurrentUserPermissions(null)
          }
          console.log('Successfully loaded current user:', user.username, 'with role:', user.role)
        } else {
          console.error('User not found for session userId:', session.userId)
          setCurrentUser(null)
          setCurrentUserPermissions(null)
        }
      } else {
        console.log('No active session found')
        setCurrentUser(null)
        setCurrentUserPermissions(null)
      }
    } catch (error) {
      console.error('Error loading current user:', error)
      setCurrentUser(null)
    }
  }, [normalizePermissions])

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
      await logSystemEvent("LOGIN_ERROR", "Intento de inicio de sesión con base no inicializada", {
        severity: "ERROR",
        context: { username }
      })
      return { success: false, error: 'Database not initialized' }
    }

    try {
      // Find user by username in database
      const user = await localDB.getUser(username)
      if (!user) {
        await logSystemEvent("UNAUTHORIZED_ACCESS", "Intento de acceso con usuario inexistente", {
          severity: "SECURITY",
          context: { username }
        })
        return { success: false, error: 'Usuario no encontrado' }
      }

      // Check if user is active
      if (user.active === false) {
        await logSystemEvent("UNAUTHORIZED_ACCESS", "Intento de acceso con usuario desactivado", {
          severity: "SECURITY",
          user: user.username,
          context: { userId: user.id }
        })
        return { success: false, error: 'Este usuario está desactivado. Contacte al administrador.' }
      }

      // Verify password
      if (!user.passwordHash) {
        // Legacy user without password hash, check against DEFAULT_PASSWORDS
        const expectedPassword = DEFAULT_PASSWORDS[user.id]
        if (password !== expectedPassword) {
          await logSystemEvent("LOGIN_FAILED", "Contraseña incorrecta", {
            severity: "SECURITY",
            user: user.username,
            context: { userId: user.id }
          })
          return { success: false, error: 'Contraseña incorrecta' }
        }
        // Update user with hashed password
        const passwordHash = await hashPassword(password)
        user.passwordHash = passwordHash
        await localDB.saveUser(user)
      } else {
        // Verify password hash
        const isValid = await verifyPassword(password, user.passwordHash)
        if (!isValid) {
          await logSystemEvent("LOGIN_FAILED", "Contraseña incorrecta", {
            severity: "SECURITY",
            user: user.username,
            context: { userId: user.id }
          })
          return { success: false, error: 'Contraseña incorrecta' }
        }
      }

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
      if (user.profileId) {
        const profile = await localDB.getProfileById(user.profileId)
        setCurrentUserPermissions(normalizePermissions(profile?.permissions) ?? null)
      } else {
        setCurrentUserPermissions(null)
      }
      console.log('User logged in:', user.username, 'with role:', user.role)
      await logSystemEvent("LOGIN_SUCCESS", "Inicio de sesión exitoso", {
        user: user.username,
        context: { userId: user.id, role: user.role, profileId: user.profileId ?? null }
      })
      return { success: true, user }
      
    } catch (error) {
      console.error('Login error:', error)
      await logSystemEvent("LOGIN_ERROR", "Error durante inicio de sesión", {
        severity: "ERROR",
        context: { username, error: error instanceof Error ? error.message : "Unknown error" }
      })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de login' 
      }
    }
  }, [isInitialized, logSystemEvent])

  // Register new user (profileId optional; defaults to operator profile)
  const register = useCallback(async (
    username: string,
    password: string,
    nombreCompleto: string,
    matricula: string,
    profileId?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    if (!isInitialized) {
      await logSystemEvent("USER_REGISTER_ERROR", "Intento de registro con base no inicializada", {
        severity: "ERROR",
        context: { username }
      })
      return { success: false, error: 'Database not initialized' }
    }

    try {
      // Validate inputs
      if (!username || !password || !nombreCompleto || !matricula) {
        await logSystemEvent("USER_REGISTER_FAILED", "Registro fallido por datos incompletos", {
          severity: "WARN",
          context: { username, matricula }
        })
        return { success: false, error: 'Todos los campos son requeridos' }
      }

      if (username.length < 3) {
        return { success: false, error: 'El nombre de usuario debe tener al menos 3 caracteres' }
      }

      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error || 'La contraseña no cumple con los requisitos' }
      }

      // Check if username already exists
      const existingUserByUsername = await localDB.getUser(username)
      if (existingUserByUsername) {
        await logSystemEvent("USER_REGISTER_FAILED", "Registro fallido por usuario duplicado", {
          severity: "WARN",
          context: { username }
        })
        return { success: false, error: 'El nombre de usuario ya existe' }
      }

      // Check if matricula already exists
      const existingUserByMatricula = await localDB.getUserByMatricula(matricula)
      if (existingUserByMatricula) {
        await logSystemEvent("USER_REGISTER_FAILED", "Registro fallido por matrícula duplicada", {
          severity: "WARN",
          context: { matricula }
        })
        return { success: false, error: 'La matrícula ya está registrada' }
      }

      // Hash password
      const passwordHash = await hashPassword(password)

      const now = new Date().toISOString()
      // Create new user (role derived from profile for legacy; new users use profileId)
      const newUser: User = {
        id: `user-${Date.now()}`,
        username,
        name: nombreCompleto,
        displayName: nombreCompleto,
        role: profileId ? (profileId === 'profile-superuser' ? 'superuser' : 'operator') : 'operator',
        passwordHash,
        matricula,
        profileId: profileId ?? 'profile-operator',
        active: true,
        createdAt: now,
        updatedAt: now
      }

      // Save user to database
      await localDB.saveUser(newUser)
      console.log('User registered:', newUser.username)
      await logSystemEvent("USER_REGISTERED", "Usuario registrado exitosamente", {
        user: currentUser?.username,
        context: { newUserId: newUser.id, username: newUser.username, profileId: newUser.profileId }
      })

      return { success: true, user: newUser }
      
    } catch (error) {
      console.error('Registration error:', error)
      await logSystemEvent("USER_REGISTER_ERROR", "Error durante registro de usuario", {
        severity: "ERROR",
        context: { username, error: error instanceof Error ? error.message : "Unknown error" }
      })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al registrar usuario' 
      }
    }
  }, [isInitialized, currentUser?.username, logSystemEvent])

  // Get user permissions
  const getUserPermissions = useCallback((userRole: UserRole) => {
    return USER_PERMISSIONS[userRole] || USER_PERMISSIONS.operator
  }, [])

  // Check if user has permission (from profile if profileId, else from legacy role). Always returns boolean.
  const hasPermission = useCallback((permission: keyof typeof USER_PERMISSIONS.superuser) => {
    if (!currentUser) return false
    if (currentUserPermissions) return Boolean(currentUserPermissions[permission])
    return Boolean(getUserPermissions(currentUser.role)[permission])
  }, [currentUser, currentUserPermissions, getUserPermissions])

  const getUser = useCallback(async (username: string) => {
    if (!isInitialized) return null
    return await localDB.getUser(username)
  }, [isInitialized])

  const getUserByMatricula = useCallback(async (matricula: string) => {
    if (!isInitialized) return null
    return await localDB.getUserByMatricula(matricula)
  }, [isInitialized])

  const getAllUsers = useCallback(async () => {
    if (!isInitialized) return []
    return await localDB.getAllUsers()
  }, [isInitialized])

  const updateUser = useCallback(async (user: User) => {
    if (!isInitialized) return
    // Prevent editing predefined user
    if (user.id === KRAKENROV_USER_ID) {
      throw new Error('No se puede editar el usuario predefinido del sistema')
    }
    const withUpdated = { ...user, updatedAt: new Date().toISOString() }
    await localDB.saveUser(withUpdated)
    await logSystemEvent("USER_UPDATED", "Usuario actualizado", {
      user: currentUser?.username,
      context: { targetUserId: user.id, username: user.username }
    })
  }, [isInitialized, currentUser?.username, logSystemEvent])

  // Profile operations
  const getAllProfiles = useCallback(async () => {
    if (!isInitialized) return []
    return await localDB.getAllProfiles()
  }, [isInitialized])

  const getProfileById = useCallback(async (id: string) => {
    if (!isInitialized) return null
    return await localDB.getProfileById(id)
  }, [isInitialized])

  const saveProfile = useCallback(async (profile: Profile) => {
    if (!isInitialized) return
    await localDB.saveProfile(profile)
    await logSystemEvent("CONFIG_CHANGED", "Perfil/permisos actualizados", {
      user: currentUser?.username,
      context: { profileId: profile.id, profileName: profile.name }
    })
  }, [isInitialized, currentUser?.username, logSystemEvent])

  const getUsersByProfileId = useCallback(async (profileId: string) => {
    if (!isInitialized) return []
    return await localDB.getUsersByProfileId(profileId)
  }, [isInitialized])

  const deleteProfile = useCallback(async (id: string) => {
    if (!isInitialized) return
    // Get all users with this profile
    const usersWithProfile = await getUsersByProfileId(id)
    
    // Assign default operator profile to all users with the deleted profile
    const PROFILE_OPERATOR_ID = 'profile-operator'
    for (const user of usersWithProfile) {
      const updatedUser: User = {
        ...user,
        profileId: PROFILE_OPERATOR_ID,
        role: 'operator',
        updatedAt: new Date().toISOString()
      }
      await localDB.saveUser(updatedUser)
    }
    
    await localDB.deleteProfile(id)
    await logSystemEvent("CONFIG_CHANGED", "Perfil eliminado", {
      severity: "WARN",
      user: currentUser?.username,
      context: { profileId: id, reassignedUsers: usersWithProfile.length }
    })
  }, [isInitialized, getUsersByProfileId, currentUser?.username, logSystemEvent])

  const deleteUser = useCallback(async (userId: string) => {
    if (!isInitialized) return { success: false, error: 'Database not initialized' }
    
    try {
      // Prevent deleting the current user
      if (currentUser && currentUser.id === userId) {
        await logSystemEvent("UNAUTHORIZED_ACCESS", "Intento de eliminar su propio usuario", {
          severity: "SECURITY",
          user: currentUser.username,
          context: { userId }
        })
        return { success: false, error: 'No puedes eliminar tu propio usuario' }
      }
      
      // Prevent deleting predefined user
      if (userId === KRAKENROV_USER_ID) {
        await logSystemEvent("UNAUTHORIZED_ACCESS", "Intento de eliminar usuario predefinido", {
          severity: "SECURITY",
          user: currentUser?.username,
          context: { userId }
        })
        return { success: false, error: 'No se puede eliminar el usuario predefinido del sistema' }
      }
      
      await localDB.deleteUser(userId)
      await logSystemEvent("USER_DELETED", "Usuario eliminado", {
        severity: "WARN",
        user: currentUser?.username,
        context: { deletedUserId: userId }
      })
      return { success: true }
    } catch (error) {
      console.error('Error deleting user:', error)
      await logSystemEvent("USER_DELETE_ERROR", "Error al eliminar usuario", {
        severity: "ERROR",
        user: currentUser?.username,
        context: { userId, error: error instanceof Error ? error.message : "Unknown error" }
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar usuario'
      }
    }
  }, [isInitialized, currentUser, logSystemEvent])

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
    const username = currentUser?.username
    const userId = currentUser?.id
    await localDB.clearSession()
    setCurrentUser(null)
    setCurrentUserPermissions(null)
    console.log('Session cleared and currentUser reset')
    await logSystemEvent("LOGOUT", "Cierre de sesión", {
      user: username,
      context: { userId }
    })
  }, [isInitialized, currentUser?.username, currentUser?.id, logSystemEvent])

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
    await logSystemEvent("INSPECCION_CREATED", "Inspección guardada", {
      user: currentUser.username,
      context: { inspeccionId: dbInspeccion.id, nombre: dbInspeccion.nombreInspeccion }
    })
    return dbInspeccion
  }, [isInitialized, currentUser, logSystemEvent])

  const getAllInspecciones = useCallback(async () => {
    if (!isInitialized) {
      console.log('Database not initialized, returning empty array for inspecciones')
      return []
    }
    if (!currentUser) {
      console.log('No current user, returning empty array for inspecciones')
      return []
    }
    const effectiveRole = currentUserPermissions?.canViewAllInspecciones ? 'superuser' : currentUser.role
    console.log('Getting inspecciones for user:', currentUser.username, 'with role:', effectiveRole)
    const data = await localDB.getInspeccionesByUser(currentUser.id, effectiveRole)
    console.log('Retrieved inspecciones from database:', data.length)
    return data
  }, [isInitialized, currentUser, currentUserPermissions])

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
    if (!currentUser) throw new Error('Debe iniciar sesión para editar una inspección')
    const previous = await localDB.getInspeccionById(inspeccion.id)
    if (!previous) {
      throw new Error('Inspección no encontrada')
    }
    const canEditAll = Boolean(currentUserPermissions?.canEditAllInspecciones)
    const canCreateAndOwn = Boolean(currentUserPermissions?.canCreateInspecciones) && inspeccion.createdBy === currentUser.id
    if (!canEditAll && !canCreateAndOwn) {
      await logSystemEvent("UNAUTHORIZED_ACCESS", "Intento de editar inspección sin permisos", {
        severity: "SECURITY",
        user: currentUser.username,
        context: { inspeccionId: inspeccion.id }
      })
      throw new Error('No tiene permiso para editar esta inspección')
    }

    const canEditMedia = Boolean(
      currentUserPermissions?.canEditInspecciones || currentUserPermissions?.canEditAllInspecciones,
    )
    const mediaOrChartsChanged =
      arraysContentChanged(previous.capturedFrames, inspeccion.capturedFrames) ||
      arraysContentChanged(previous.recordings, inspeccion.recordings) ||
      arraysContentChanged(previous.reportImages, inspeccion.reportImages) ||
      JSON.stringify(previous.sensorCharts ?? null) !== JSON.stringify(inspeccion.sensorCharts ?? null)

    if (mediaOrChartsChanged && !canEditMedia) {
      await logSystemEvent("UNAUTHORIZED_ACCESS", "Intento de modificar capturas, grabaciones o gráficos sin permiso Editar inspecciones", {
        severity: "SECURITY",
        user: currentUser.username,
        context: { inspeccionId: inspeccion.id },
      })
      throw new Error('No tiene permiso para modificar capturas, grabaciones o gráficos de la inspección')
    }
    const updatedInspeccion = {
      ...inspeccion,
      // La fecha de inspección es inmutable: corresponde al día en que se creó el registro.
      fechaInspeccion: previous.fechaInspeccion,
      updatedAt: new Date().toISOString()
    }
    await localDB.updateInspeccion(updatedInspeccion)
    const cambios = summarizeInspeccionChanges(previous, updatedInspeccion)
    await logSystemEvent("INSPECCION_UPDATED", "Inspección actualizada", {
      user: currentUser.username,
      context: {
        inspeccionId: inspeccion.id,
        nombreInspeccion: updatedInspeccion.nombreInspeccion,
        cambios,
      }
    })
    return updatedInspeccion
  }, [isInitialized, currentUser, currentUserPermissions, logSystemEvent])

  const deleteInspeccion = useCallback(async (id: string) => {
    if (!isInitialized) return
    if (!currentUser) throw new Error('Debe iniciar sesión para eliminar una inspección')
    if (!currentUserPermissions?.canDeleteInspecciones) {
      await logSystemEvent("UNAUTHORIZED_ACCESS", "Intento de eliminar inspección sin permisos", {
        severity: "SECURITY",
        user: currentUser.username,
        context: { inspeccionId: id }
      })
      throw new Error('No tiene permiso para eliminar inspecciones')
    }
    await localDB.deleteInspeccion(id)
    await logSystemEvent("INSPECCION_DELETED", "Inspección eliminada", {
      severity: "WARN",
      user: currentUser.username,
      context: { inspeccionId: id }
    })
  }, [isInitialized, currentUser, currentUserPermissions, logSystemEvent])

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
      if (result.success) {
        await logSystemEvent("DATA_EXPORTED", "Exportación de datos exitosa", {
          user: currentUser?.username,
          context: { filename: result.filename }
        })
      }
      return result
    } catch (error) {
      console.error('Error during data export:', error)
      await logSystemEvent("DATA_EXPORT_ERROR", "Error al exportar datos", {
        severity: "ERROR",
        user: currentUser?.username,
        context: { error: error instanceof Error ? error.message : "Unknown error" }
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [isInitialized, currentUser?.username, logSystemEvent])

  const importData = useCallback(async (file: File) => {
    if (!isInitialized) return { success: false, error: 'Database not initialized' }
    
    try {
      console.log('Starting data import...')
      const result = await backupService.importData(file)
      console.log('Data import result:', result)
      if (result.success) {
        await logSystemEvent("DATA_IMPORTED", "Importación de datos exitosa", {
          user: currentUser?.username,
          context: { filename: file.name, importedCount: result.importedCount ?? null }
        })
      }
      return result
    } catch (error) {
      console.error('Error during data import:', error)
      await logSystemEvent("DATA_IMPORT_ERROR", "Error al importar datos", {
        severity: "ERROR",
        user: currentUser?.username,
        context: { filename: file.name, error: error instanceof Error ? error.message : "Unknown error" }
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [isInitialized, currentUser?.username, logSystemEvent])

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
      if (result.success) {
        await logSystemEvent("DATA_CLEARED", "Limpieza total de datos ejecutada", {
          severity: "WARN",
          user: currentUser?.username
        })
      }
      return result
    } catch (error) {
      console.error('Error during data clear:', error)
      await logSystemEvent("DATA_CLEAR_ERROR", "Error al limpiar todos los datos", {
        severity: "ERROR",
        user: currentUser?.username,
        context: { error: error instanceof Error ? error.message : "Unknown error" }
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [isInitialized, currentUser?.username, logSystemEvent])

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
    register,
    reloadCurrentUser,
    getUserPermissions,
    hasPermission,
    saveUser,
    updateUser,
    getUser,
    getUserByMatricula,
    getAllUsers,
    deleteUser,
    getAllProfiles,
    getProfileById,
    saveProfile,
    deleteProfile,
    getUsersByProfileId,
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
