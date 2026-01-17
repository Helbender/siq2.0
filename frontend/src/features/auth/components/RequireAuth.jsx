import { useAuth } from '@/features/auth/contexts/AuthContext'
import { Navigate } from 'react-router'

export function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  return children
}
