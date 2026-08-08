// pages/Login.jsx
import {useEffect, useState} from 'react'
import {Heading, Text, Input, Button, VStack, Badge, Spinner} from '@chakra-ui/react'
import {Flex, Box, Image as ChakraImage} from '@chakra-ui/react'
import {Link, useNavigate, useSearchParams} from 'react-router-dom'
import {supabase} from '../supabase'
import {keyframes} from '@emotion/react'

// 🟢 Custom Fine-Tuned Authentication Keyframes
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
  const [searchParams, setSearchParams] = useSearchParams()

  // 🔒 Display Success Banner on Email Confirmation
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      // Display user notification
      setSuccessMsg('Account confirmed! Please log in with your credentials to continue.')

      // Clean query param from address bar without reloading page
      setSearchParams({}, {replace: true})
    }
  }, [searchParams, setSearchParams])

  // Validations
  const hasMinLen = password.length >= 6
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const noSpecialChars = /^[a-zA-Z0-9]+$/.test(password)
  const isValidEmail = emailStr => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)

  const handleAuth = async e => {
    e.preventDefault()

    // 🟢 Hard Guard: Prevent execution if already loading (stops spam clicks)
    if (loading) return

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. FORGOT PASSWORD FLOW
      if (isResetting) {
        if (!isValidEmail(email)) throw new Error('Please enter a valid email address.')
        const {error} = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`
        })
        if (error) throw error

        setSuccessMsg('Check your email for the password reset link!')
        setLoading(false) // Re-enable so they can click "Log In"
        return
      }

      // 2. SIGN UP FLOW
      if (isSignUp) {
        if (!isValidEmail(email)) throw new Error('Please enter a valid email address.')
        if (!hasMinLen || !hasUpper || !hasLower || !noSpecialChars) {
          throw new Error('Please ensure your password meets all requirements.')
        }

        const {error} = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {full_name: fullName},
            // 🟢 Redirect user back to login page after confirmation click
            emailRedirectTo: `${window.location.origin}/login?verified=true`
          }
        })
        if (error) throw error

        setIsRegistrationSuccess(true)
        setLoading(false) // Safe to disable loading since the UI flips to the success screen
        return
      }

      // 3. LOGIN FLOW
      const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error

      const {data: profile} = await supabase.from('user_profiles').select('role').eq('user_id', data.user.id).maybeSingle()

      if (profile?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/tracker')
      }
      // 🟢 DELIBERATELY omit setLoading(false) here so the spinner stays active during routing transition
    } catch (error) {
      setErrorMsg(error.message)
      // 🟢 Turn off the spinner ONLY if there was an error so the user can try again
      setLoading(false)
    }
  }

  if (isRegistrationSuccess) {
    return (
      <Box minH="100vh" w="100%" display="flex" alignItems="center" justifyContent="center" position="relative" overflow="hidden" bgGradient="linear(to-br, #E6FFFA, #C6F6D5, #81E6D9)">
        <Box position="absolute" top="-10%" left="-10%" w="500px" h="500px" bg="#38A169" opacity="0.15" filter="blur(80px)" borderRadius="full" />
        <Box position="absolute" bottom="-20%" right="-10%" w="600px" h="600px" bg="#319795" opacity="0.15" filter="blur(100px)" borderRadius="full" />

        <Box
          w="90%"
          maxW="450px"
          bg="white"
          p={{base: 8, md: 10}}
          borderRadius="3xl"
          boxShadow="0 25px 50px -12px rgba(49, 151, 149, 0.25)"
          position="relative"
          zIndex={1}
          textAlign="center"
          animation={`${cardPop} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both`}
        >
          <Flex w="60px" h="60px" bg="#F0FFF4" border="1px solid #C6F6D5" borderRadius="full" align="center" justify="center" mx="auto" mb={6}>
            <Text fontSize="2xl">📧</Text>
          </Flex>
          <Heading size="lg" color="#1A202C" letterSpacing="tight" mb={3}>
            Check your inbox
          </Heading>
          <Text color="#718096" fontSize="md" mb={8} lineHeight="tall">
            We just sent a verification link to <b>{email}</b>. Please click the link in that email to activate your account.
          </Text>
          <Button
            w="100%"
            bg="#1A202C"
            color="white"
            borderRadius="xl"
            py={7}
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
      py={{base: 12, md: 16}}
    >
      <Box position="absolute" top="-10%" left="-10%" w="700px" h="700px" bgGradient="radial(#48BB78 0%, transparent 65%)" opacity="0.18" borderRadius="full" pointerEvents="none" />
      <Box position="absolute" bottom="-20%" right="-10%" w="700px" h="700px" bgGradient="radial(#319795 0%, transparent 65%)" opacity="0.15" borderRadius="full" pointerEvents="none" />

      <Box position="absolute" top={8} left={{base: 6, md: 10}} zIndex={10}>
        <Flex align="center" gap={2} as={Link} to="/" transition="all 0.2s" _hover={{opacity: 0.7, transform: 'translateX(-4px)'}}>
          <Text fontSize="lg" color="#1C4532">
            ←
          </Text>
          <Text fontWeight="bold" color="#1C4532" fontSize="sm">
            Back to Home
          </Text>
        </Flex>
      </Box>

      <Box
        w="90%"
        maxW="450px"
        bg="rgba(255, 255, 255, 0.9)"
        backdropFilter="blur(16px)"
        p={{base: 8, md: 10}}
        borderRadius="3xl"
        border="1px solid rgba(72, 187, 120, 0.25)"
        boxShadow="0 25px 50px -12px rgba(28, 69, 50, 0.15)"
        position="relative"
        zIndex={1}
        animation={`${cardPop} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both`}
      >
        <VStack spacing={2} mb={8} align="center" textAlign="center">
          <Flex w="50px" h="50px" bg="#F0FFF4" border="1px solid #C6F6D5" borderRadius="xl" align="center" justify="center" mb={2} transition="all 0.3s" _hover={{transform: 'rotate(10deg)'}}>
            <img
              src="/Logo.png"
              alt="Carbonsense Logo"
              style={{
                width: '30px',
                height: '30px',
                objectFit: 'contain',
                borderRadius: '6px'
              }}
            />
          </Flex>
          <Heading size="xl" color="#1C4532" letterSpacing="tight" fontWeight="black">
            {isResetting ? 'Reset Password' : isSignUp ? 'Join Carbonsense' : 'Welcome Back'}
          </Heading>
          <Text color="#4A5568" fontSize="sm" px={4}>
            {isResetting ? "Enter your email and we'll send you a recovery link." : isSignUp ? 'Start tracking your footprint and changing the world today.' : 'Log in to your dashboard to log your daily activities.'}
          </Text>
        </VStack>

        {errorMsg && (
          <Flex align="center" gap={3} borderRadius="xl" mb={6} bg="#FFF5F5" color="#C53030" border="1px solid #FEB2B2" p={4} animation={`${alertSlide} 0.3s ease-out both`}>
            <Text fontSize="lg">⚠️</Text>
            <Text fontSize="sm" fontWeight="bold">
              {errorMsg}
            </Text>
          </Flex>
        )}

        {successMsg && (
          <Flex align="center" gap={3} borderRadius="xl" mb={6} bg="#F0FFF4" color="#276749" border="1px solid #9AE6B4" p={4} animation={`${alertSlide} 0.3s ease-out both`}>
            <Text fontSize="lg">✅</Text>
            <Text fontSize="sm" fontWeight="bold">
              {successMsg}
            </Text>
          </Flex>
        )}

        <form onSubmit={handleAuth}>
          <VStack spacing={4} align="stretch">
            {isSignUp && !isResetting && (
              <Box animation={`${fieldFadeIn} 0.35s ease-out both`} overflow="hidden">
                <Text fontSize="xs" fontWeight="bold" color="#1C4532" textTransform="uppercase" mb={2} ml={1}>
                  Full Name
                </Text>
                <Input
                  required
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
                  py={6}
                  borderRadius="xl"
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
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                bg="#F4F9F5"
                border="1px solid rgba(72, 187, 120, 0.2)"
                _focus={{bg: 'white', borderColor: '#38A169', boxShadow: '0 0 0 1px #38A169'}}
                _hover={{bg: '#E6FFFA'}}
                py={6}
                borderRadius="xl"
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
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    bg="#F4F9F5"
                    border="1px solid rgba(72, 187, 120, 0.2)"
                    _focus={{bg: 'white', borderColor: '#38A169', boxShadow: '0 0 0 1px #38A169'}}
                    _hover={{bg: '#E6FFFA'}}
                    py={6}
                    pr="4.5rem"
                    borderRadius="xl"
                    transition="all 0.2s"
                    isDisabled={loading}
                  />
                  <Button
                    position="absolute"
                    right="0.5rem"
                    top="50%"
                    transform="translateY(-50%)"
                    h="1.75rem"
                    size="sm"
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
                  <Box mt={3} px={2} animation={`${fieldFadeIn} 0.3s ease-out both`}>
                    <Text fontSize="xs" fontWeight="bold" color="#4A5568" mb={3}>
                      Password Requirements:
                    </Text>
                    <VStack align="start" spacing={2}>
                      <Flex align="center" gap={2}>
                        <Flex
                          minW="16px"
                          w="16px"
                          h="16px"
                          borderRadius="full"
                          align="center"
                          justify="center"
                          bg={hasMinLen ? '#F0FFF4' : 'transparent'}
                          border={hasMinLen ? '1px solid #9AE6B4' : '1.5px solid #CBD5E0'}
                          color="#38A169"
                          fontSize="10px"
                          fontWeight="700"
                          lineHeight="1"
                          flexShrink={0}
                          transition="all 0.2s"
                        >
                          {hasMinLen ? (
                            <Text m={0} p={0} lineHeight="1" fontSize="10px" fontWeight="700">
                              ✓
                            </Text>
                          ) : null}
                        </Flex>
                        <Text fontSize="xs" lineHeight="1.2" color={hasMinLen ? '#1C4532' : '#718096'} fontWeight={hasMinLen ? '600' : '400'} transition="color 0.2s">
                          {hasMinLen ? 'Success:' : 'Required:'} At least 6 characters
                        </Text>
                      </Flex>

                      <Flex align="center" gap={2}>
                        <Flex
                          minW="16px"
                          w="16px"
                          h="16px"
                          borderRadius="full"
                          align="center"
                          justify="center"
                          bg={hasUpper ? '#F0FFF4' : 'transparent'}
                          border={hasUpper ? '1px solid #9AE6B4' : '1.5px solid #CBD5E0'}
                          color="#38A169"
                          fontSize="10px"
                          fontWeight="700"
                          lineHeight="1"
                          flexShrink={0}
                          transition="all 0.2s"
                        >
                          {hasUpper ? (
                            <Text m={0} p={0} lineHeight="1" fontSize="10px" fontWeight="700">
                              ✓
                            </Text>
                          ) : null}
                        </Flex>
                        <Text fontSize="xs" lineHeight="1.2" color={hasUpper ? '#1C4532' : '#718096'} fontWeight={hasUpper ? '600' : '400'} transition="color 0.2s">
                          {hasUpper ? 'Success:' : 'Required:'} One uppercase letter
                        </Text>
                      </Flex>

                      <Flex align="center" gap={2}>
                        <Flex
                          minW="16px"
                          w="16px"
                          h="16px"
                          borderRadius="full"
                          align="center"
                          justify="center"
                          bg={hasLower ? '#F0FFF4' : 'transparent'}
                          border={hasLower ? '1px solid #9AE6B4' : '1.5px solid #CBD5E0'}
                          color="#38A169"
                          fontSize="10px"
                          fontWeight="700"
                          lineHeight="1"
                          flexShrink={0}
                          transition="all 0.2s"
                        >
                          {hasLower ? (
                            <Text m={0} p={0} lineHeight="1" fontSize="10px" fontWeight="700">
                              ✓
                            </Text>
                          ) : null}
                        </Flex>
                        <Text fontSize="xs" lineHeight="1.2" color={hasLower ? '#1C4532' : '#718096'} fontWeight={hasLower ? '600' : '400'} transition="color 0.2s">
                          {hasLower ? 'Success:' : 'Required:'} One lowercase letter
                        </Text>
                      </Flex>

                      <Flex align="center" gap={2}>
                        <Flex
                          minW="16px"
                          w="16px"
                          h="16px"
                          borderRadius="full"
                          align="center"
                          justify="center"
                          bg={noSpecialChars ? '#F0FFF4' : 'transparent'}
                          border={noSpecialChars ? '1px solid #9AE6B4' : '1.5px solid #CBD5E0'}
                          color="#38A169"
                          fontSize="10px"
                          fontWeight="700"
                          lineHeight="1"
                          flexShrink={0}
                          transition="all 0.2s"
                        >
                          {noSpecialChars ? (
                            <Text m={0} p={0} lineHeight="1" fontSize="10px" fontWeight="700">
                              ✓
                            </Text>
                          ) : null}
                        </Flex>
                        <Text fontSize="xs" lineHeight="1.2" color={noSpecialChars ? '#1C4532' : '#718096'} fontWeight={noSpecialChars ? '600' : '400'} transition="color 0.2s">
                          {noSpecialChars ? 'Success:' : 'Required:'} No special characters (!@#$)
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
              py={7}
              mt={4}
              fontSize="md"
              fontWeight="black"
              boxShadow={loading ? 'none' : '0 8px 20px rgba(34, 84, 61, 0.2)'}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{
                bg: loading ? '#22543D' : '#1C4532',
                transform: loading ? 'none' : 'translateY(-3px)',
                boxShadow: loading ? 'none' : '0 15px 30px rgba(34, 84, 61, 0.25)'
              }}
              _active={{transform: 'translateY(0)'}}
            >
              {loading ? (
                <Flex align="center" gap={3}>
                  <Spinner size="sm" color="white" />
                  <Text>{isResetting ? 'Sending...' : isSignUp ? 'Creating Account...' : 'Signing In...'}</Text>
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

        <Text textAlign="center" mt={8} fontSize="sm" color="#4A5568">
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
