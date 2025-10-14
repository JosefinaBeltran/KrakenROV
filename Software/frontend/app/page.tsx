"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDatabase } from "@/hooks/useDatabase"

export default function HomePage() {
  const router = useRouter()
  const { getActiveSession, isInitialized, isLoading } = useDatabase()

  useEffect(() => {
    const checkSession = async () => {
      if (!isInitialized) return
      
      try {
        const session = await getActiveSession()
        if (session && session.loggedIn) {
          router.replace("/menu")
        } else {
          router.replace("/login")
        }
      } catch {
        router.replace("/login")
      }
    }

    checkSession()
  }, [router, getActiveSession, isInitialized])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return null
}