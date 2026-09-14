// pages/Login.jsx
import {useState} from 'react'
import {Heading, Text, Input, Button, VStack, Spinner} from '@chakra-ui/react'
import {Flex, Box} from '@chakra-ui/react'
import {Link, useNavigate} from 'react-router-dom'
import {supabase} from '../supabase'
import {keyframes} from '@emotion/react'

// Custom Authentication Keyframes
const cardPop = keyframes`
  from { opacity: 0; transform: scale(0.96) translateY(15px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`

const fieldFadeIn = keyframes`
  from { opacity: 0; transform: translateY(-8px); max-height: 0px; margin-bottom: 0px; }
  to { opacity: 1; transform: translateY(0); max-height: 100px; margin-bottom: 16px; }
`

const alertSlide = keyframes`
  from { opacity: 0; transform: scale(0.98) translateY(-6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const navigate = useNavigate()

  // Validations
  const hasMinLen = password.length >= 6
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
  const isValidEmail = emailStr => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)

  const handleAuth = async e => {
    e.preventDefault()

    if (loading) return

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. FORGOT PASSWORD FLOW
      if (isResetting) {
        if (!email.trim()) throw new Error('Please enter your email address.')
        if (!isValidEmail(email)) throw new Error('Please enter a valid email address.')

        const {error} = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`
        })
        if (error) throw error

        setSuccessMsg('Check your email for the password reset link.')
        setLoading(false)
        return
      }

      // 2. SIGN UP FLOW
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('Please enter your full name.')
        if (!email.trim()) throw new Error('Please enter your email address.')
        if (!isValidEmail(email)) throw new Error('Please enter a valid email address.')
        if (!password) throw new Error('Please enter a password.')
        if (!hasMinLen || !hasUpper || !hasLower || !hasSpecialChar) {
          throw new Error('Please ensure your password meets all requirements.')
        }

        const {error} = await supabase.auth.signUp({
          email,
          password,
          options: {data: {full_name: fullName}}
        })
        if (error) throw error

        setIsRegistrationSuccess(true)
        setLoading(false)
        return
      }

      // 3. LOGIN FLOW
      if (!email.trim() && !password.trim()) {
        throw new Error('Please enter your email and password.')
      }
      if (!email.trim()) {
        throw new Error('Please enter your email address.')
      }
      if (!password.trim()) {
        throw new Error('Please enter your password.')
      }

      const {data, error} = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })
      if (error) throw error

      // ARCHIVE GUARD: Query user role and archive status
      const {data: profile} = await supabase.from('user_profiles').select('role, is_archived').eq('user_id', data.user.id).maybeSingle()

      if (profile?.is_archived) {
        await supabase.auth.signOut()
        throw new Error('Account Login Error')
      }

      if (profile?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/tracker')
      }
    } catch (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg('Invalid email or password. Please try again.')
      } else {
        setErrorMsg(error.message)
      }
      setLoading(false)
    }
  }

  if (isRegistrationSuccess) {
    return (
      <Box minH="100vh" w="100%" display="flex" alignItems="center" justifyContent="center" position="relative" overflow="hidden" bgGradient="linear(to-br, #E6FFFA, #C6F6D5, #81E6D9)" p={4}>
        <Box position="absolute" top="-10%" left="-10%" w="500px" h="500px" bg="#38A169" opacity="0.15" filter="blur(80px)" borderRadius="full" />
        <Box position="absolute" bottom="-20%" right="-10%" w="600px" h="600px" bg="#319795" opacity="0.15" filter="blur(100px)" borderRadius="full" />

        <Box
          w="100%"
          maxW="450px"
          bg="white"
          p={{base: 6, sm: 8, md: 10}}
          borderRadius="3xl"
          boxShadow="0 25px 50px -12px rgba(49, 151, 149, 0.25)"
          position="relative"
          zIndex={1}
          textAlign="center"
          animation={`${cardPop} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both`}
        >
          <Heading size="lg" color="#1A202C" letterSpacing="tight" mb={3} mt={2}>
            Check your inbox
          </Heading>
          <Text color="#718096" fontSize={{base: 'sm', md: 'md'}} mb={8} lineHeight="tall">
            We sent a verification link to <b>{email}</b>. Please click the link in that email to activate your account.
          </Text>
          <Button
            w="100%"
            bg="#1A202C"
            color="white"
            borderRadius="xl"
            py={6}
            fontWeight="bold"
            transition="all 0.2s"
            _hover={{bg: '#2D3748', transform: 'translateY(-2px)'}}
            _active={{transform: 'translateY(0)'}}
            onClick={() => {
              setIsRegistrationSuccess(false)
              setIsSignUp(false)
              setEmail('')
              setPassword('')
              setFullName('')
            }}
          >
            Return to Login
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      minH="100vh"
      w="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflow="hidden"
      bg="#F4F9F5"
      backgroundImage="url('https://www.transparenttextures.com/patterns/cubes.png')"
      backgroundBlendMode="multiply"
      py={{base: 10, md: 16}}
      px={4}
    >
      <Box position="absolute" top="-10%" left="-10%" w={{base: '350px', md: '700px'}} h={{base: '350px', md: '700px'}} bgGradient="radial(#48BB78 0%, transparent 65%)" opacity="0.18" borderRadius="full" pointerEvents="none" />
      <Box position="absolute" bottom="-20%" right="-10%" w={{base: '350px', md: '700px'}} h={{base: '350px', md: '700px'}} bgGradient="radial(#319795 0%, transparent 65%)" opacity="0.15" borderRadius="full" pointerEvents="none" />

      {/* Back Link */}
      <Box position="absolute" top={{base: 4, md: 8}} left={{base: 4, md: 10}} zIndex={10}>
        <Flex align="center" gap={2} as={Link} to="/" transition="all 0.2s" _hover={{opacity: 0.7, transform: 'translateX(-4px)'}}>
          <Text fontSize="lg" color="#1C4532">
            ←
          </Text>
          <Text fontWeight="bold" color="#1C4532" fontSize="xs">
            Back to Home
          </Text>
        </Flex>
      </Box>

      {/* Login Card */}
      <Box
        w="100%"
        maxW="450px"
        bg="rgba(255, 255, 255, 0.9)"
        backdropFilter="blur(16px)"
        p={{base: 6, sm: 8, md: 10}}
        mt={{base: 8, md: 0}}
        borderRadius="3xl"
        border="1px solid rgba(72, 187, 120, 0.25)"
        boxShadow="0 25px 50px -12px rgba(28, 69, 50, 0.15)"
        position="relative"
        zIndex={1}
        animation={`${cardPop} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both`}
      >
        <VStack spacing={2} mb={{base: 6, md: 8}} align="center" textAlign="center">
          <Flex w="48px" h="48px" bg="#F0FFF4" border="1px solid #C6F6D5" borderRadius="xl" align="center" justify="center" mb={1} transition="all 0.3s" _hover={{transform: 'rotate(10deg)'}}>
            <img
              src="/Logo.png"
              alt="CarbonSense Logo"
              style={{
                width: '28px',
                height: '28px',
                objectFit: 'contain',
                borderRadius: '6px'
              }}
            />
          </Flex>
          <Heading size={{base: 'lg', sm: 'xl'}} color="#1C4532" letterSpacing="tight" fontWeight="black">
            {isResetting ? 'Reset Password' : isSignUp ? 'Join CarbonSense' : 'Welcome Back'}
          </Heading>
          <Text color="#4A5568" fontSize="xs" px={2}>
            {isResetting ? "Enter your email and we'll send you a recovery link." : isSignUp ? 'Start tracking your footprint and changing the world today.' : 'Log in to your dashboard to log your daily activities.'}
          </Text>
        </VStack>

        {/* Text-Only Alert Messages */}
        {errorMsg && (
          <Text color="#E53E3E" fontSize="xs" fontWeight="medium" textAlign="center" mb={4} animation={`${alertSlide} 0.3s ease-out both`}>
            {errorMsg}
          </Text>
        )}

        {successMsg && (
          <Text color="#2F855A" fontSize="xs" fontWeight="medium" textAlign="center" mb={4} animation={`${alertSlide} 0.3s ease-out both`}>
            {successMsg}
          </Text>
        )}

        <form onSubmit={handleAuth} noValidate>
          <VStack spacing={4} align="stretch">
            {isSignUp && !isResetting && (
              <Box animation={`${fieldFadeIn} 0.35s ease-out both`} overflow="hidden">
                <Text fontSize="xs" fontWeight="bold" color="#1C4532" textTransform="uppercase" mb={2} ml={1}>
                  Full Name
                </Text>
                <Input
                  value={fullName}
                  onChange={e => {
                    let value = e.target.value
                    value = value.replace(/^\s+/, '')
                    value = value.replace(/\s{2,}/g, ' ')

                    if (/^[A-Za-zÀ-ÿ\s'.-]*$/.test(value)) {
                      setFullName(value)
                    }
                  }}
                  autoComplete="name"
                  maxLength={100}
                  spellCheck={false}
                  placeholder="Juan Dela Cruz"
                  bg="#F4F9F5"
                  border="1px solid rgba(72, 187, 120, 0.2)"
                  _focus={{
                    bg: 'white',
                    borderColor: '#38A169',
                    boxShadow: '0 0 0 1px #38A169'
                  }}
                  _hover={{bg: '#E6FFFA'}}
                  py={5}
                  borderRadius="xl"
                  fontSize="sm"
                  transition="all 0.2s"
                  isDisabled={loading}
                />
              </Box>
            )}

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#1C4532" textTransform="uppercase" mb={2} ml={1}>
                Email Address
              </Text>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                bg="#F4F9F5"
                border="1px solid rgba(72, 187, 120, 0.2)"
                _focus={{bg: 'white', borderColor: '#38A169', boxShadow: '0 0 0 1px #38A169'}}
                _hover={{bg: '#E6FFFA'}}
                py={5}
                borderRadius="xl"
                fontSize="sm"
                transition="all 0.2s"
                isDisabled={loading}
              />
            </Box>

            {!isResetting && (
              <Box>
                <Flex justify="space-between" align="center" mb={2} px={1}>
                  <Text fontSize="xs" fontWeight="bold" color="#1C4532" textTransform="uppercase">
                    Password
                  </Text>
                  {!isSignUp && (
                    <Text
                      as="span"
                      fontSize="xs"
                      color={loading ? '#A0AEC0' : '#276749'}
                      fontWeight="bold"
                      cursor={loading ? 'not-allowed' : 'pointer'}
                      transition="color 0.15s"
                      _hover={{textDecoration: loading ? 'none' : 'underline', color: loading ? '#A0AEC0' : '#1C4532'}}
                      onClick={() => {
                        if (loading) return
                        setIsResetting(true)
                        setErrorMsg('')
                        setSuccessMsg('')
                      }}
                    >
                      Forgot password?
                    </Text>
                  )}
                </Flex>

                <Box position="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    bg="#F4F9F5"
                    border="1px solid rgba(72, 187, 120, 0.2)"
                    _focus={{bg: 'white', borderColor: '#38A169', boxShadow: '0 0 0 1px #38A169'}}
                    _hover={{bg: '#E6FFFA'}}
                    py={5}
                    pr="4.5rem"
                    borderRadius="xl"
                    fontSize="sm"
                    transition="all 0.2s"
                    isDisabled={loading}
                  />
                  <Button
                    position="absolute"
                    right="0.5rem"
                    top="50%"
                    transform="translateY(-50%)"
                    h="1.75rem"
                    size="xs"
                    onClick={() => setShowPassword(!showPassword)}
                    bg="transparent"
                    color="#4A5568"
                    fontWeight="bold"
                    _hover={{bg: 'transparent', color: '#276749'}}
                    _active={{bg: 'transparent'}}
                    zIndex={2}
                    isDisabled={loading}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </Box>

                {isSignUp && (
                  <Box mt={3} px={1} animation={`${fieldFadeIn} 0.3s ease-out both`}>
                    <Text fontSize="xs" fontWeight="bold" color="#4A5568" mb={2}>
                      Password Requirements:
                    </Text>
                    <VStack align="start" spacing={1.5}>
                      <Flex align="center" gap={2}>
                        <Flex
                          minW="14px"
                          w="14px"
                          h="14px"
                          borderRadius="full"
                          align="center"
                          justify="center"
                          bg={hasMinLen ? '#F0FFF4' : 'transparent'}
                          border={hasMinLen ? '1px solid #9AE6B4' : '1.5px solid #CBD5E0'}
                          color="#38A169"
                          fontSize="9px"
                          fontWeight="700"
                          flexShrink={0}
                        >
                          {hasMinLen ? '✓' : null}
                        </Flex>
                        <Text fontSize="2xs" color={hasMinLen ? '#1C4532' : '#718096'} fontWeight={hasMinLen ? '600' : '400'}>
                          At least 6 characters
                        </Text>
                      </Flex>

                      <Flex align="center" gap={2}>
                        <Flex
                          minW="14px"
                          w="14px"
                          h="14px"
                          borderRadius="full"
                          align="center"
                          justify="center"
                          bg={hasUpper ? '#F0FFF4' : 'transparent'}
                          border={hasUpper ? '1px solid #9AE6B4' : '1.5px solid #CBD5E0'}
                          color="#38A169"
                          fontSize="9px"
                          fontWeight="700"
                          flexShrink={0}
                        >
                          {hasUpper ? '✓' : null}
                        </Flex>
                        <Text fontSize="2xs" color={hasUpper ? '#1C4532' : '#718096'} fontWeight={hasUpper ? '600' : '400'}>
                          One uppercase letter
                        </Text>
                      </Flex>

                      <Flex align="center" gap={2}>
                        <Flex
                          minW="14px"
                          w="14px"
                          h="14px"
                          borderRadius="full"
                          align="center"
                          justify="center"
                          bg={hasLower ? '#F0FFF4' : 'transparent'}
                          border={hasLower ? '1px solid #9AE6B4' : '1.5px solid #CBD5E0'}
                          color="#38A169"
                          fontSize="9px"
                          fontWeight="700"
                          flexShrink={0}
                        >
                          {hasLower ? '✓' : null}
                        </Flex>
                        <Text fontSize="2xs" color={hasLower ? '#1C4532' : '#718096'} fontWeight={hasLower ? '600' : '400'}>
                          One lowercase letter
                        </Text>
                      </Flex>

                      <Flex align="center" gap={2}>
                        <Flex
                          minW="14px"
                          w="14px"
                          h="14px"
                          borderRadius="full"
                          align="center"
                          justify="center"
                          bg={hasSpecialChar ? '#F0FFF4' : 'transparent'}
                          border={hasSpecialChar ? '1px solid #9AE6B4' : '1.5px solid #CBD5E0'}
                          color="#38A169"
                          fontSize="9px"
                          fontWeight="700"
                          flexShrink={0}
                        >
                          {hasSpecialChar ? '✓' : null}
                        </Flex>
                        <Text fontSize="2xs" color={hasSpecialChar ? '#1C4532' : '#718096'} fontWeight={hasSpecialChar ? '600' : '400'}>
                          One special character (!@#$%...)
                        </Text>
                      </Flex>
                    </VStack>
                  </Box>
                )}
              </Box>
            )}

            <Button
              type="submit"
              isDisabled={loading}
              bg="#22543D"
              color="white"
              borderRadius="xl"
              py={6}
              mt={2}
              fontSize="sm"
              fontWeight="black"
              boxShadow={loading ? 'none' : '0 8px 20px rgba(34, 84, 61, 0.2)'}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{
                bg: loading ? '#22543D' : '#1C4532',
                transform: loading ? 'none' : 'translateY(-2px)'
              }}
              _active={{transform: 'translateY(0)'}}
            >
              {loading ? (
                <Flex align="center" gap={3}>
                  <Spinner size="sm" color="white" />
                  <Text fontSize="xs">{isResetting ? 'Sending...' : isSignUp ? 'Creating Account...' : 'Signing In...'}</Text>
                </Flex>
              ) : isResetting ? (
                'Send Reset Link'
              ) : isSignUp ? (
                'Create Free Account'
              ) : (
                'Sign In'
              )}
            </Button>
          </VStack>
        </form>

        <Text textAlign="center" mt={6} fontSize="xs" color="#4A5568">
          {isResetting ? 'Remembered your password? ' : isSignUp ? 'Already have an account? ' : "Don't have an account? "}

          <Text
            as="span"
            color={loading ? '#A0AEC0' : '#276749'}
            fontWeight="black"
            cursor={loading ? 'not-allowed' : 'pointer'}
            transition="color 0.15s"
            _hover={{textDecoration: loading ? 'none' : 'underline', color: loading ? '#A0AEC0' : '#1C4532'}}
            onClick={() => {
              if (loading) return
              if (isResetting) {
                setIsResetting(false)
                setIsSignUp(false)
              } else {
                setIsSignUp(!isSignUp)
              }
              setErrorMsg('')
              setSuccessMsg('')
              setPassword('')
              setShowPassword(false)
            }}
          >
            {isResetting ? 'Log In' : isSignUp ? 'Log In' : 'Sign Up'}
          </Text>
        </Text>
      </Box>
    </Box>
  )
}
