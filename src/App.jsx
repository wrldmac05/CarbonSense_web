/* eslint-disable no-unused-vars */
// App.jsx
import {Box, Flex, Center, Spinner, Text, Heading, Button} from '@chakra-ui/react'
import {Routes, Route, Navigate, useLocation, useNavigate} from 'react-router-dom'
import {useState, useEffect} from 'react'

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

  // Custom Ban/Restriction Modal State
  const [banNotice, setBanNotice] = useState(null) // { title, message }

  const location = useLocation()
  const navigate = useNavigate()

  const MINIMAL_ROUTES = ['/admin', '/update-password', '/2YBnrUJH4WFa']
  const isMinimalRoute = MINIMAL_ROUTES.includes(location.pathname)

  useEffect(() => {
    let isMounted = true
    let profileSubscription = null

    // Helper to purge session and redirect safely with notice modal
    const handleRestrictionKick = async (title, message) => {
      await supabase.auth.signOut()
      if (isMounted) {
        setIsLoggedIn(false)
        setUserRole(null)
        setBanNotice({title, message})
        navigate('/login', {replace: true})
      }
    }

    // 🟢 ENHANCED ACCESS CHECK: Checks if account is archived OR banned
    const checkAccountStatus = async userId => {
      try {
        const {data, error} = await supabase.from('user_profiles').select('role, is_archived, is_banned').eq('user_id', userId).maybeSingle()

        if (error) {
          await handleRestrictionKick('Unable to Verify Account', "We couldn't verify your account status. Please try signing in again in a moment.")
          return {isRestricted: true, role: null}
        }

        if (!data) {
          return {isRestricted: false, role: 'user'}
        }

        // ⛔ BANNED ACCOUNT BOOT (Displays suspension modal)
        if (data.is_banned) {
          await handleRestrictionKick('Account Suspended', 'Your account has been suspended due to violations of platform terms and conditions. If you believe this is an error, please contact support.')
          return {isRestricted: true, role: null}
        }

        // ⛔ ARCHIVED ACCOUNT CHECK (Silently rejects session; message handled by login UI)
        if (data.is_archived) {
          await supabase.auth.signOut()
          if (isMounted) {
            setIsLoggedIn(false)
            setUserRole(null)
          }
          return {isRestricted: true, role: null}
        }

        return {isRestricted: false, role: data.role || 'user'}
      } catch (err) {
        await handleRestrictionKick('Unable to Verify Account', "We couldn't verify your account status. Please try signing in again in a moment.")
        return {isRestricted: true, role: null}
      }
    }

    // ⚡ REALTIME LISTENER: Listens for live ban actions
    const ensureProfileSubscription = userId => {
      if (profileSubscription) return
      profileSubscription = supabase
        .channel(`security_user_${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_profiles',
            filter: `user_id=eq.${userId}`
          },
          async payload => {
            if (payload.new?.is_banned) {
              await handleRestrictionKick('Account Suspended', 'Your account has been suspended by an administrator. You have been automatically signed out.')
            }
          }
        )
        .subscribe()
    }

    // Single source of truth for session and auth state
    const applyAuthResult = async session => {
      if (!session?.user) {
        if (isMounted) {
          setIsLoggedIn(false)
          setUserRole(null)
        }
        return
      }

      const status = await checkAccountStatus(session.user.id)
      if (!isMounted) return

      if (status.isRestricted) {
        setIsLoggedIn(false)
        setUserRole(null)
      } else {
        setIsLoggedIn(true)
        setUserRole(status.role)
        ensureProfileSubscription(session.user.id)
      }
    }

    // 1. Reliable Boot Routine
    const bootApp = async () => {
      const hasAuthParams = window.location.search.includes('code=') || window.location.hash.includes('access_token=') || window.location.hash.includes('type=recovery')

      const {
        data: {session}
      } = await supabase.auth.getSession()

      if (!session && hasAuthParams) return

      await applyAuthResult(session)
      if (isMounted) setIsAuthLoading(false)
    }

    bootApp()

    // 2. Realtime Auth State Listener
    const {
      data: {subscription}
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION', 'PASSWORD_RECOVERY'].includes(event)) {
        applyAuthResult(session).then(() => {
          if (isMounted) setIsAuthLoading(false)
        })
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
          bootApp()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      if (profileSubscription) supabase.removeChannel(profileSubscription)
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
    <Flex direction="column" minH="100vh" bg="#FFFFFF" color="gray.800" position="relative">
      {showPublicLayout && <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}

      <Box flex="1">
        <Routes>
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

          {/* 🟢 Protected Password Reset Route */}
          <Route path="/update-password" element={isLoggedIn ? <UpdatePassword /> : <Navigate to="/login" replace />} />
        </Routes>
      </Box>

      {showPublicLayout && <Footer />}

      {/* 🚫 CUSTOM BAN & RESTRICTION NOTIFICATION MODAL */}
      {banNotice && (
        <Flex position="fixed" top={0} left={0} w="100vw" h="100vh" bg="rgba(15, 23, 42, 0.7)" backdropFilter="blur(8px)" zIndex={99999} align="center" justify="center" px={4} onClick={() => setBanNotice(null)}>
          <Box bg="white" p={8} borderRadius="3xl" maxW="420px" w="100%" boxShadow="0 25px 50px -12px rgba(229, 62, 62, 0.3)" onClick={e => e.stopPropagation()} textAlign="center">
            <Flex w="16" h="16" bg="#FFF5F5" border="4px solid white" outline="1px solid #FED7D7" borderRadius="full" align="center" justify="center" mx="auto" mb={5} boxShadow="lg">
              <Text fontSize="2xl">🚫</Text>
            </Flex>

            <Heading size="md" color="#1A202C" mb={3} letterSpacing="tight">
              {banNotice.title}
            </Heading>

            <Text color="#718096" fontSize="sm" mb={6} lineHeight="tall">
              {banNotice.message}
            </Text>

            <Button w="100%" size="lg" bg="#E53E3E" color="white" borderRadius="xl" _hover={{bg: '#C53030'}} onClick={() => setBanNotice(null)}>
              Acknowledge & Continue
            </Button>
          </Box>
        </Flex>
      )}
    </Flex>
  )
}
