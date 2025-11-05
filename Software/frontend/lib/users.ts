// Predefined users for the application
import { User } from './database'

export const PREDEFINED_USERS: User[] = [
  {
    id: 'superuser-001',
    username: 'admin',
    name: 'Administrador',
    role: 'superuser',
    displayName: 'Super Usuario',
    createdAt: new Date().toISOString()
  },
  {
    id: 'operator-001',
    username: 'operador',
    name: 'Operador',
    role: 'operator',
    displayName: 'Operador Invitado',
    createdAt: new Date().toISOString()
  }
]

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
