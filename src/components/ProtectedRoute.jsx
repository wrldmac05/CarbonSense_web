// components/ProtectedRoute.jsx
import {useEffect, useState} from 'react'
import {Navigate, useLocation} from 'react-router-dom'
import {Spinner, Center} from '@chakra-ui/react'
import {supabase} from '../supabase'

export default function ProtectedRoute({children, requireAdmin = false}) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        // 1. Check if user has an active session
        const {
          data: {user},
          error: authError
        } = await supabase.auth.getUser()
        if (authError || !user) {
          setAuthorized(false)
          setLoading(false)
          return
        }

        // 2. Fetch role and archived status
        const {data: profile} = await supabase.from('user_profiles').select('role, is_archived').eq('user_id', user.id).single()

        // 3. Kick out if archived or unauthorized
        if (profile?.is_archived) {
          await supabase.auth.signOut()
          setAuthorized(false)
        } else if (requireAdmin && profile?.role !== 'admin') {
          setAuthorized(false)
        } else {
          setAuthorized(true)
        }
      } catch (err) {
        setAuthorized(false)
      } finally {
        setLoading(false)
      }
    }

    verifyAccess()
  }, [location.pathname, requireAdmin])

  if (loading) {
    return (
      <Center h="100vh" bg="#F3F5F8">
        <Spinner size="xl" color="#38A169" />
      </Center>
    )
  }

  if (!authorized) {
    return <Navigate to="/login" replace />
  }

  return children
}
