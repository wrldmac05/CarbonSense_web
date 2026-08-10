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

  const MINIMAL_ROUTES = ['/admin', '/update-password', '/2YBnrUJH4WFa']
  const isMinimalRoute = MINIMAL_ROUTES.includes(location.pathname)

  const isBooting = useRef(true)

  useEffect(() => {
    let isMounted = true

    // 🟢 ENHANCED ACCESS CHECK: Fetches role AND checks if the account is archived OR banned
    const checkAccountStatus = async userId => {
      try {
        const {data, error} = await supabase.from('user_profiles').select('role, is_archived, is_banned').eq('user_id', userId).single()

        if (error) throw error

        // ⛔ BANNED ACCOUNT BOOT: Force sign out banned users immediately
        if (data?.is_banned) {
          await supabase.auth.signOut()
          alert('Account Suspended: Your account has been suspended due to violations of platform terms.')
          return {isRestricted: true, role: null}
        }

        // ⛔ ARCHIVED ACCOUNT BOOT: Force sign out archived users immediately
        if (data?.is_archived) {
          await supabase.auth.signOut()
          return {isRestricted: true, role: null}
        }

        return {isRestricted: false, role: data?.role || 'user'}
      } catch (err) {
        return {isRestricted: false, role: 'user'}
      }
    }

    // 1. The Reliable Boot Routine
    const bootApp = async () => {
      const {
        data: {session}
      } = await supabase.auth.getSession()

      if (session?.user) {
        const status = await checkAccountStatus(session.user.id)
        if (isMounted) {
          if (status.isRestricted) {
            setIsLoggedIn(false)
            setUserRole(null)
          } else {
            setIsLoggedIn(true)
            setUserRole(status.role)
          }
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

    // 2. Realtime Auth State Listener
    const {
      data: {subscription}
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) {
        if (session?.user) {
          checkAccountStatus(session.user.id).then(status => {
            if (isMounted) {
              if (status.isRestricted) {
                setIsLoggedIn(false)
                setUserRole(null)
              } else {
                setIsLoggedIn(true)
                setUserRole(status.role)
              }
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

    // 3. Tab Visibility Reload Check
    let sleepTimer
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sleepTimer = Date.now()
      } else {
        if (sleepTimer && Date.now() - sleepTimer > 30000) {
          console.log('Tab woke from deep sleep. Refreshing security state...')
          bootApp()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [location.pathname])

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
      {/* Navbar hides for Admin or Minimal Routes */}
      {showPublicLayout && <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}

      <Box flex="1">
        <Routes>
          {/* Ironclad Admin Bounce */}
          <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <Home />} />
          <Route path="/dashboard" element={isAdmin ? <Navigate to="/admin" replace /> : <Dashboard />} />

          {/* Protected Login Route */}
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

          <Route path="/2YBnrUJH4WFa" element={<AdminRegister />} />

          {/* Protected Consumer Route */}
          <Route path="/profile" element={isLoggedIn ? isAdmin ? <Navigate to="/admin" replace /> : <Profile /> : <Navigate to="/login" replace />} />

          <Route path="/update-password" element={<UpdatePassword />} />
        </Routes>
      </Box>

      {/* Public Footer hides for Admin or Minimal Routes */}
      {showPublicLayout && <Footer />}
    </Flex>
  )
}
