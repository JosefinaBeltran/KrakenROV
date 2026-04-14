// Predefined users for the application
import { User } from './database'
import { hashPassword } from './password'

// ID del usuario predefinido del sistema (no se puede editar ni eliminar)
export const KRAKENROV_USER_ID = 'krakenrov-001'

// Helper function to create predefined users with hashed passwords
// This will be called during initialization
export async function getPredefinedUsers(): Promise<User[]> {
  const krakenrovPasswordHash = await hashPassword('krakenrov123')

  const now = new Date().toISOString()
  return [
    {
      id: KRAKENROV_USER_ID,
      username: 'KrakenROV',
      name: 'KrakenROV',
      role: 'superuser' as const,
      displayName: 'KrakenROV',
      passwordHash: krakenrovPasswordHash,
      matricula: 'KRAKEN001',
      profileId: 'profile-superuser',
      active: true,
      createdAt: now,
      updatedAt: now
    }
  ]
}

// Legacy support - kept for backward compatibility but passwords should be hashed
export const DEFAULT_PASSWORDS: Record<string, string> = {
  [KRAKENROV_USER_ID]: 'krakenrov123'
}

// User permissions
export const USER_PERMISSIONS = {
  superuser: {
    canViewAllInspecciones: true,
    canCreateInspecciones: true,
    canEditAllInspecciones: true,
    canEditInspecciones: true,
    canDeleteInspecciones: true,
    canExportData: true,
    canImportData: true,
    canManageUsers: true,
    canClearAllData: true
  },
  operator: {
    canViewAllInspecciones: false,
    canCreateInspecciones: true,
    canEditAllInspecciones: false,
    canEditInspecciones: false,
    canDeleteInspecciones: false,
    canExportData: false,
    canImportData: false,
    canManageUsers: false,
    canClearAllData: false
  }
} as const

export type UserRole = keyof typeof USER_PERMISSIONS
