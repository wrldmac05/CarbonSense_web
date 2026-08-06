// components/AdminRoute.jsx
import {useState, useEffect} from 'react'
import {Navigate} from 'react-router-dom'
import {Center, Spinner, Text, Box} from '@chakra-ui/react'
import {supabase} from '../supabase'

export default function AdminRoute({children}) {
  const [isAdmin, setIsAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const {
          data: {user}
        } = await supabase.auth.getUser()

        if (!user) {
          setIsAdmin(false)
          return
        }

        // Fetch the user's role from the database
        const {data} = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()

        setIsAdmin(data?.role === 'admin')
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [])

  if (loading) {
    return (
      <Center minH="100vh" bg="#FCFDFD" flexDirection="column" gap={4}>
        <Spinner size="xl" color="#E53E3E" thickness="4px" />
        <Text color="#718096" fontWeight="bold">
          Verifying Admin Credentials...
        </Text>
      </Center>
    )
  }

  // If they aren't an admin, kick them back to the dashboard silently
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  // If they are an admin, render the restricted page
  return <Box>{children}</Box>
}
