// App.jsx
import {Box, Flex, Center, Spinner, Text} from '@chakra-ui/react'
import {Routes, Route, Navigate, useLocation} from 'react-router-dom'
import {useState, useEffect, useRef} from 'react'

import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import Home from './pages/Home'
import Login from './pages/Login'
import PersonalTracker from './pages/PersonalTracker'
import Profile from './pages/Profile'
import Footer from './components/Footer'
import GetApp from './pages/GetApp'
import UpdatePassword from './pages/UpdatePassword'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import AdminDashboard from './pages/AdminDashboard'
import AdminRegister from './pages/AdminRegister'
import AdminRoute from './components/AdminRoute'

import {supabase} from './supabase'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const location = useLocation()

  const isMinimalRoute = location.pathname === '/admin' || location.pathname === '/update-password' || location.pathname === '/staff-setup'

  useEffect(() => {
    let isMounted = true

    const fetchRole = async userId => {
      try {
        const {data, error} = await supabase.from('user_profiles').select('role').eq('user_id', userId).single()
        if (error) throw error
        return data?.role || 'user'
      } catch (err) {
        return 'user'
      }
    }

    // 1. Boot Application Session
    const bootApp = async () => {
      const isVerifying = window.location.search.includes('verified=true')

      // If arriving from verification link, delay boot state until signOut completes in onAuthStateChange
      if (isVerifying) return

      const {
        data: {session}
      } = await supabase.auth.getSession()

      if (session?.user) {
        const role = await fetchRole(session.user.id)
        if (isMounted) {
          setIsLoggedIn(true)
          setUserRole(role)
        }
      } else {
        if (isMounted) {
          setIsLoggedIn(false)
          setUserRole(null)
        }
      }
      if (isMounted) setIsAuthLoading(false)
    }

    bootApp()

    // 2. Auth State Listener
    const {
      data: {subscription}
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isVerifying = window.location.search.includes('verified=true')

      // 🟢 HANDLE EMAIL VERIFICATION: Wait for session creation, then terminate it safely
      if (isVerifying) {
        if (event === 'SIGNED_IN' || session) {
          await supabase.auth.signOut()
        } else if (event === 'SIGNED_OUT' || !session) {
          if (isMounted) {
            setIsLoggedIn(false)
            setUserRole(null)
            setIsAuthLoading(false)
          }
        }
        return
      }

      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) {
        if (session?.user) {
          const role = await fetchRole(session.user.id)
          if (isMounted) {
            setIsLoggedIn(true)
            setUserRole(role)
            setIsAuthLoading(false)
          }
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        if (isMounted) {
          setIsLoggedIn(false)
          setUserRole(null)
          setIsAuthLoading(false)
        }
      }
    })

    // 3. Tab Wake Listener
    let sleepTimer
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sleepTimer = Date.now()
      } else {
        if (sleepTimer && Date.now() - sleepTimer > 30000) {
          console.log('Tab woke from deep sleep.')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  if (isAuthLoading) {
    return (
      <Center minH="100vh" bg="#F4FAF6">
        <Flex direction="column" align="center" gap={4}>
          <Spinner size="xl" color="#2F855A" thickness="4px" />
          <Text fontWeight="600" color="gray.600">
            Verifying security session...
          </Text>
        </Flex>
      </Center>
    )
  }

  const isAdmin = isLoggedIn && userRole === 'admin'
  const showPublicLayout = !isMinimalRoute && !isAdmin

  return (
    <Flex direction="column" minH="100vh" bg="#FFFFFF" color="gray.800">
      {showPublicLayout && <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}

      <Box flex="1">
        <Routes>
          <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <Home />} />
          <Route path="/dashboard" element={isAdmin ? <Navigate to="/admin" replace /> : <Dashboard />} />

          <Route path="/login" element={isLoggedIn ? isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/tracker" replace /> : <Login />} />

          <Route path="/tracker" element={isAdmin ? <Navigate to="/admin" replace /> : <PersonalTracker />} />
          <Route path="/get-app" element={isAdmin ? <Navigate to="/admin" replace /> : <GetApp />} />
          <Route path="/privacy" element={isAdmin ? <Navigate to="/admin" replace /> : <PrivacyPolicy />} />
          <Route path="/terms" element={isAdmin ? <Navigate to="/admin" replace /> : <TermsOfService />} />

          <Route
            path="/admin"
            element={
              <AdminRoute isAdmin={isAdmin}>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route path="/staff-setup" element={<AdminRegister />} />

          <Route path="/profile" element={isLoggedIn ? isAdmin ? <Navigate to="/admin" replace /> : <Profile /> : <Navigate to="/login" replace />} />

          <Route path="/update-password" element={<UpdatePassword />} />
        </Routes>
      </Box>

      {showPublicLayout && <Footer />}
    </Flex>
  )
}
