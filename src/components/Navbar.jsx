// components/Navbar.jsx
import {Box, Flex, Button, Text, VStack, Image} from '@chakra-ui/react'
import {Link, useNavigate, useLocation} from 'react-router-dom'
import {useState, useEffect, useRef} from 'react'
import {supabase} from '../supabase'
import {keyframes} from '@emotion/react'

// 🟢 Fluid dropdown slide from ceiling
const navbarDrop = keyframes`
  from { opacity: 0; transform: translateY(-15px); }
  to { opacity: 1; transform: translateY(0); }
`

// Vector icon component for theme toggle
const ThemeToggleIcon = ({isDark, size = 18}) => {
  if (isDark) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function Navbar({isLoggedIn, setIsLoggedIn, isDarkMode, toggleTheme}) {
  const navigate = useNavigate()
  const location = useLocation()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userInitial, setUserInitial] = useState('?')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (!isLoggedIn) return
      const {
        data: {user}
      } = await supabase.auth.getUser()
      if (user) {
        const {data} = await supabase.from('user_profiles').select('display_name, avatar_url').eq('user_id', user.id).single()

        if (data) {
          if (data.avatar_url) setAvatarUrl(data.avatar_url)

          if (data.display_name) {
            setUserInitial(data.display_name.charAt(0).toUpperCase())
          } else if (user.email) {
            setUserInitial(user.email.charAt(0).toUpperCase())
          }
        } else if (user.email) {
          setUserInitial(user.email.charAt(0).toUpperCase())
        }
      }
    }
    fetchUser()
  }, [isLoggedIn])

  useEffect(() => {
    const handleClickOutside = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    navigate('/')
  }

  return (
    <Box
      w="100%"
      bg={isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(244, 249, 245, 0.85)'}
      backdropFilter="blur(12px)"
      borderBottom={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(72, 187, 120, 0.15)'}`}
      position="sticky"
      top={0}
      zIndex={100}
      animation={`${navbarDrop} 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`}
      transition="background-color 0.3s ease, border-color 0.3s ease"
    >
      <Flex maxW="100%" px={{base: 6, md: 10}} h="72px" align="center" justify="space-between">
        {/* Left Side: Logo */}
        <Flex align="center" gap={1.5} as={Link} to="/" transition="all 0.2s" _hover={{opacity: 0.8, transform: 'scale(1.02)'}} _active={{transform: 'scale(0.98)'}}>
          <Image src="/Logo.png" fallbackSrc="https://via.placeholder.com/32x32.png?text=CS" alt="Carbonsense Logo" boxSize="30px" objectFit="contain" borderRadius="md" />
          <Text fontSize="xl" fontWeight="600" color={isDarkMode ? '#F8FAFC' : '#000000'} letterSpacing="tight">
            CarbonSense
          </Text>
        </Flex>

        {/* Right Side: Actions & Navigation */}
        <Flex align="center" gap={3}>
          {/* 🌙 Night Mode Toggle Button */}
          <Button
            size="sm"
            variant="ghost"
            borderRadius="full"
            w="38px"
            h="38px"
            p={0}
            color={isDarkMode ? '#F59E0B' : '#4A5568'}
            bg={isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.6)'}
            border={`1px solid ${isDarkMode ? '#334155' : 'rgba(72, 187, 120, 0.2)'}`}
            _hover={{
              bg: isDarkMode ? '#334155' : '#E6EBE6',
              color: isDarkMode ? '#FBBF24' : '#1A202C',
              transform: 'scale(1.05)'
            }}
            _active={{transform: 'scale(0.95)'}}
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            transition="all 0.2s ease"
          >
            <ThemeToggleIcon isDark={isDarkMode} size={17} />
          </Button>

          {isLoggedIn ? (
            <Box position="relative" ref={menuRef}>
              <Box
                as="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                w="40px"
                h="40px"
                borderRadius="full"
                bg={isDarkMode ? '#1E293B' : isMenuOpen ? '#E6FFFA' : '#F0FFF4'}
                border={`1px solid ${isDarkMode ? '#475569' : '#C6F6D5'}`}
                color={isDarkMode ? '#9AE6B4' : '#1C4532'}
                fontWeight="700"
                fontSize="16px"
                lineHeight="1"
                display="flex"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                _hover={{
                  bg: isDarkMode ? '#334155' : '#E6FFFA',
                  transform: 'scale(1.04)',
                  borderColor: isDarkMode ? '#68D391' : '#9AE6B4'
                }}
                _active={{transform: 'scale(0.96)'}}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                overflow="hidden"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="User Avatar" boxSize="100%" objectFit="cover" />
                ) : (
                  <Text m={0} p={0} lineHeight="1" fontWeight="700" fontSize="16px">
                    {userInitial}
                  </Text>
                )}
              </Box>

              {/* Dropdown Menu */}
              <Box
                position="absolute"
                top="52px"
                right={0}
                w="220px"
                bg={isDarkMode ? '#1E293B' : 'rgba(255, 255, 255, 0.95)'}
                backdropFilter="blur(10px)"
                borderRadius="2xl"
                border={`1px solid ${isDarkMode ? '#334155' : 'rgba(72, 187, 120, 0.2)'}`}
                boxShadow={isDarkMode ? '0 15px 35px -5px rgba(0, 0, 0, 0.4)' : '0 15px 35px -5px rgba(28, 69, 50, 0.12)'}
                py={2}
                overflow="hidden"
                transition="all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
                transform={isMenuOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)'}
                opacity={isMenuOpen ? 1 : 0}
                pointerEvents={isMenuOpen ? 'auto' : 'none'}
              >
                <VStack align="stretch" spacing={0}>
                  <Text px={4} py={2} fontSize="10px" fontWeight="black" color={isDarkMode ? '#94A3B8' : '#4A5568'} textTransform="uppercase" letterSpacing="wider">
                    My Account
                  </Text>

                  <Box
                    as={Link}
                    to="/tracker"
                    px={4}
                    py={3}
                    fontSize="sm"
                    fontWeight="600"
                    color={isDarkMode ? '#F8FAFC' : '#1C4532'}
                    _hover={{bg: isDarkMode ? '#334155' : '#F4F9F5', color: isDarkMode ? '#68D391' : '#276749', pl: 5}}
                    transition="all 0.2s ease"
                  >
                    Personal Tracker
                  </Box>
                  <Box
                    as={Link}
                    to="/profile"
                    px={4}
                    py={3}
                    fontSize="sm"
                    fontWeight="600"
                    color={isDarkMode ? '#F8FAFC' : '#1C4532'}
                    _hover={{bg: isDarkMode ? '#334155' : '#F4F9F5', color: isDarkMode ? '#68D391' : '#276749', pl: 5}}
                    transition="all 0.2s ease"
                  >
                    Profile Settings
                  </Box>

                  <Box h="1px" bg={isDarkMode ? '#334155' : 'rgba(72, 187, 120, 0.1)'} my={1} />

                  <Box as="button" onClick={handleLogout} textAlign="left" px={4} py={3} fontSize="sm" fontWeight="600" color="#E53E3E" _hover={{bg: isDarkMode ? '#3B1E22' : '#FFF5F5', pl: 5}} transition="all 0.2s ease">
                    Log Out
                  </Box>
                </VStack>
              </Box>
            </Box>
          ) : (
            <Button
              as={Link}
              to="/login"
              bg={isDarkMode ? '#2F855A' : '#22543D'}
              color="white"
              borderRadius="full"
              px={6}
              size="sm"
              transition="all 0.2s"
              _hover={{
                bg: isDarkMode ? '#38A169' : '#1C4532',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(34, 84, 61, 0.25)'
              }}
              _active={{transform: 'translateY(0)'}}
            >
              Sign In
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}
