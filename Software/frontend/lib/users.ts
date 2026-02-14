// Predefined users for the application
import { User } from './database'
import { hashPassword } from './password'

// Helper function to create predefined users with hashed passwords
// This will be called during initialization
export async function getPredefinedUsers(): Promise<User[]> {
  const adminPasswordHash = await hashPassword('admin123')
  const operatorPasswordHash = await hashPassword('operador123')

  const now = new Date().toISOString()
  return [
    {
      id: 'superuser-001',
      username: 'admin',
      name: 'Administrador',
      role: 'superuser' as const,
      displayName: 'Super Usuario',
      passwordHash: adminPasswordHash,
      matricula: 'ADMIN001',
      profileId: 'profile-superuser',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'operator-001',
      username: 'operador',
      name: 'Operador',
      role: 'operator' as const,
      displayName: 'Operador Invitado',
      passwordHash: operatorPasswordHash,
      matricula: 'OPER001',
      profileId: 'profile-operator',
      createdAt: now,
      updatedAt: now
    }
  ]
}

// Legacy support - kept for backward compatibility but passwords should be hashed
export const DEFAULT_PASSWORDS: Record<string, string> = {
  'superuser-001': 'admin123',
  'operator-001': 'operador123'
}

// User permissions
export const USER_PERMISSIONS = {
  superuser: {
    canViewAllInspecciones: true,
    canCreateInspecciones: true,
    canEditAllInspecciones: true,
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
    canDeleteInspecciones: false,
    canExportData: false,
    canImportData: false,
    canManageUsers: false,
    canClearAllData: false
  }
} as const

export type UserRole = keyof typeof USER_PERMISSIONS
