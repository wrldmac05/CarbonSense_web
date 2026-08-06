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

export default function Navbar({isLoggedIn, setIsLoggedIn}) {
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
      bg="rgba(244, 249, 245, 0.85)" // Frosted sage green instead of pure white
      backdropFilter="blur(12px)" // Adds the premium glass effect
      borderBottom="1px solid rgba(72, 187, 120, 0.15)" // Subtle green border instead of gray
      position="sticky"
      top={0}
      zIndex={100}
      animation={`${navbarDrop} 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`}
    >
      <Flex maxW="100%" px={{base: 6, md: 10}} h="72px" align="center" justify="space-between">
        {/* Left Side: Logo */}
        <Flex
          align="center"
          gap={0}
          as={Link}
          to="/"
          transition="all 0.2s"
          _hover={{opacity: 0.8, transform: 'scale(1.02)'}}
          _active={{transform: 'scale(0.98)'}}
        >
          <Image
            src="/Logo.png"
            fallbackSrc="https://via.placeholder.com/32x32.png?text=CS"
            alt="Carbonsense Logo"
            boxSize="30px"
            objectFit="contain"
            borderRadius="md"
          />
          <Text fontSize="xl" fontWeight="600" color="#000000" letterSpacing="tight">
            {' '}
            {/* Deep forest green */}
            CarbonSense
          </Text>
        </Flex>

        {/* Right Side: Navigation */}
        <Flex align="center">
          {isLoggedIn ? (
            <Box position="relative" ref={menuRef}>
              <Box
                as="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                w="40px"
                h="40px"
                borderRadius="full"
                bg={isMenuOpen ? '#E6FFFA' : '#F0FFF4'} // Soft mint/green instead of gray
                border={avatarUrl ? '2px solid #C6F6D5' : '1px solid #C6F6D5'}
                color="#1C4532" // Forest green text for initials
                fontWeight="700"
                fontSize="16px"
                lineHeight="1"
                display="flex"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                _hover={{bg: '#E6FFFA', transform: 'scale(1.04)', borderColor: '#9AE6B4'}}
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

              {/* 🪄 SMOOTH DROPDOWN TRANSFORMATION LAYER */}
              <Box
                position="absolute"
                top="52px"
                right={0}
                w="220px"
                bg="rgba(255, 255, 255, 0.95)"
                backdropFilter="blur(10px)"
                borderRadius="2xl"
                border="1px solid rgba(72, 187, 120, 0.2)" // Subtle green border
                boxShadow="0 15px 35px -5px rgba(28, 69, 50, 0.12)" // Tinted shadow
                py={2}
                overflow="hidden"
                transition="all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
                transform={isMenuOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)'}
                opacity={isMenuOpen ? 1 : 0}
                pointerEvents={isMenuOpen ? 'auto' : 'none'}
              >
                <VStack align="stretch" spacing={0}>
                  <Text px={4} py={2} fontSize="10px" fontWeight="black" color="#4A5568" textTransform="uppercase" letterSpacing="wider">
                    My Account
                  </Text>

                  <Box
                    as={Link}
                    to="/tracker"
                    px={4}
                    py={3}
                    fontSize="sm"
                    fontWeight="600"
                    color="#1C4532"
                    _hover={{bg: '#F4F9F5', color: '#276749', pl: 5}}
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
                    color="#1C4532"
                    _hover={{bg: '#F4F9F5', color: '#276749', pl: 5}}
                    transition="all 0.2s ease"
                  >
                    Profile Settings
                  </Box>

                  <Box h="1px" bg="rgba(72, 187, 120, 0.1)" my={1} />

                  <Box
                    as="button"
                    onClick={handleLogout}
                    textAlign="left"
                    px={4}
                    py={3}
                    fontSize="sm"
                    fontWeight="600"
                    color="#E53E3E"
                    _hover={{bg: '#FFF5F5', pl: 5}}
                    transition="all 0.2s ease"
                  >
                    Log Out
                  </Box>
                </VStack>
              </Box>
            </Box>
          ) : (
            <Button
              as={Link}
              to="/login"
              bg="#22543D" // Deep premium green to match hero buttons
              color="white"
              borderRadius="full"
              px={6}
              size="sm"
              transition="all 0.2s"
              _hover={{bg: '#1C4532', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(34, 84, 61, 0.2)'}}
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
