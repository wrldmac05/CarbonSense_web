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
import AdminRoute from './components/AdminRoute' // 🟢 Bring it back

import {supabase} from './supabase'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const location = useLocation()

  // 🟢 Defines which routes are allowed to hide the standard Navbar and Footer
  const isMinimalRoute = location.pathname === '/admin' || location.pathname === '/update-password' || location.pathname === '/staff-setup'

  // Add this inside your component (above the useEffect)
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

    // 1. The Reliable Boot: Fixes your normal data fetching
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
      // Drop shield
      if (isMounted) setIsAuthLoading(false)
    }

    bootApp()

    // 🟢 THE "NON-BLOCKING" FIX
    const {
      data: {subscription}
    } = supabase.auth.onAuthStateChange((event, session) => {
      // We do NOT use 'async' here, and we do NOT 'await' anything inside.
      // We use '.then()' so the Supabase thread remains free to release its locks.

      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) {
        if (session?.user) {
          // Perform the side-effect via .then()
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

    // 3. 🟢 THE "CLEAN WAKE" HACK
    // This tracks how long the user was on another tab.
    let sleepTimer
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs. Start the stopwatch.
        sleepTimer = Date.now()
      } else {
        // User came back.
        // If they were on another tab for more than 30 seconds, the Supabase lock
        // is likely corrupted. Force a clean, instant reload to fix it automatically.
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
  // Prevents the browser from flashing protected or login routes while checking auth state on reload
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

  // 🟢 FIXED: Add these two lines back in right here!
  // 🛡️ GATEKEEPER LOGIC
  const isAdmin = isLoggedIn && userRole === 'admin'
  const showPublicLayout = !isMinimalRoute && !isAdmin

  // EXACTLY ONE CLEAN RETURN LAYOUT
  return (
    <Flex direction="column" minH="100vh" bg="#FFFFFF" color="gray.800">
      {/* 🟢 Main Navbar hides completely when viewing the Admin Panel or if user is an Admin */}
      {showPublicLayout && <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}

      <Box flex="1">
        <Routes>
          {/* 🛡️ IRONCLAD ROUTE INJECTIONS: Admin accounts are instantly bounced to /admin */}
          <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <Home />} />
          <Route path="/dashboard" element={isAdmin ? <Navigate to="/admin" replace /> : <Dashboard />} />

          {/* 🟢 Protected Login Route: Prevents logged-in users or reloading users from accessing login page */}
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

          {/* Protected Consumer Route */}
          <Route path="/profile" element={isLoggedIn ? isAdmin ? <Navigate to="/admin" replace /> : <Profile /> : <Navigate to="/login" replace />} />

          <Route path="/update-password" element={<UpdatePassword />} />

          {/* Protected Admin Control Room Route */}
          {/* 🟢 FIXED: The Ultimate Admin Route. No secondary components needed! */}
        </Routes>
      </Box>

      {/* 🟢 Public Footer hides completely when viewing the Admin Panel or if user is an Admin */}
      {showPublicLayout && <Footer />}
    </Flex>
  )
}
