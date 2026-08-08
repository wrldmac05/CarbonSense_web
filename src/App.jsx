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

  // 🟢 Defines which routes are allowed to hide the standard Navbar and Footer
  const isMinimalRoute = location.pathname === '/admin' || location.pathname === '/update-password' || location.pathname === '/staff-setup'

  // 🔑 Detect if user is arriving from email verification redirect
  const isVerifyingEmail = location.search.includes('verified=true')

  const isBooting = useRef(true)

  useEffect(() => {
    let isMounted = true

    // Helper to fetch role
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

    // 2. Auth Listener
    const {
      data: {subscription}
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) {
        if (session?.user) {
          fetchRole(session.user.id).then(role => {
            if (isMounted) {
              setIsLoggedIn(true)
              setUserRole(role)
              setIsAuthLoading(false)
            }
          })
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
          console.log('Tab woke from deep sleep. Forcing clean state...')
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

  // 🛡️ GLOBAL SESSION LOADING SHIELD
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

  // 🛡️ GATEKEEPER LOGIC
  const isAdmin = isLoggedIn && userRole === 'admin'
  const showPublicLayout = !isMinimalRoute && !isAdmin

  return (
    <Flex direction="column" minH="100vh" bg="#FFFFFF" color="gray.800">
      {showPublicLayout && <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}

      <Box flex="1">
        <Routes>
          <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <Home />} />
          <Route path="/dashboard" element={isAdmin ? <Navigate to="/admin" replace /> : <Dashboard />} />

          {/* 🟢 FIXED ROUTE GUARD: Allow Login component to render if verifying email */}
          <Route path="/login" element={isLoggedIn && !isVerifyingEmail ? isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/tracker" replace /> : <Login />} />

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
