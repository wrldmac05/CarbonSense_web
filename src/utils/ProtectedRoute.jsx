// components/ProtectedRoute.jsx
import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Center, Spinner, Flex, Text} from '@chakra-ui/react'
import {supabase} from '../supabase'

export default function ProtectedRoute({children}) {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const verifySession = async () => {
      try {
        const {
          data: {session}
        } = await supabase.auth.getSession()
        if (session) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          navigate('/login', {replace: true})
        }
      } catch (error) {
        setIsAuthenticated(false)
        navigate('/login', {replace: true})
      } finally {
        setIsChecking(false)
      }
    }

    verifySession()
  }, [navigate])

  if (isChecking) {
    return (
      <Center minH="100vh" bg="#F4F9F5">
        <Flex direction="column" align="center" gap={4}>
          <Spinner size="xl" color="#38A169" thickness="4px" />
          <Text fontWeight="600" color="#1C4532">
            Verifying security session...
          </Text>
        </Flex>
      </Center>
    )
  }

  return isAuthenticated ? children : null
}
