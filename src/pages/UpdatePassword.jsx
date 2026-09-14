// pages/UpdatePassword.jsx
import {useState, useEffect} from 'react'
import {Box, Heading, Text, Input, Button, VStack, Flex, Spinner} from '@chakra-ui/react'
import {useNavigate} from 'react-router-dom'
import {supabase} from '../supabase'
import {keyframes} from '@emotion/react'

// Ambient & Entry Animation Definitions
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

const auroraDrift = keyframes`
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
`

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const navigate = useNavigate()

  // Component-Level Guard: Verify active session on direct mount
  useEffect(() => {
    let isMounted = true

    const verifySession = async () => {
      const {
        data: {session}
      } = await supabase.auth.getSession()

      if (!isMounted) return

      if (!session) {
        navigate('/login', {replace: true})
      }
    }

    verifySession()

    return () => {
      isMounted = false
    }
  }, [navigate])

  // Real-time Password Validation Checks
  const hasMinLen = newPassword.length >= 6
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword)

  const handleUpdate = async e => {
    e.preventDefault()

    if (loading) return

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (!newPassword.trim() && !confirmPassword.trim()) {
        throw new Error('Please enter and confirm your new password.')
      }

      if (!newPassword.trim()) {
        throw new Error('Please enter your new password.')
      }

      if (!confirmPassword.trim()) {
        throw new Error('Please confirm your new password.')
      }

      if (!hasMinLen || !hasUpper || !hasLower || !hasSpecialChar) {
        throw new Error('Please ensure your new password meets all requirements.')
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match. Please try again.')
      }

      const {error} = await supabase.auth.updateUser({password: newPassword})
      if (error) throw error

      await supabase.auth.signOut()

      setSuccessMsg('Password updated successfully. Redirecting to login...')

      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      setErrorMsg(error.message)
      setLoading(false)
    }
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
    >
      <Box
        position="absolute"
        top="-10%"
        left="-10%"
        w="700px"
        h="700px"
        bgGradient="radial(#48BB78 0%, transparent 65%)"
        opacity="0.15"
        borderRadius="full"
        zIndex={0}
        pointerEvents="none"
        animation={`${auroraDrift} 20s ease-in-out infinite alternate`}
      />
      <Box
        position="absolute"
        bottom="-20%"
        right="-10%"
        w="650px"
        h="650px"
        bgGradient="radial(#319795 0%, transparent 65%)"
        opacity="0.12"
        borderRadius="full"
        zIndex={0}
        pointerEvents="none"
        animation={`${auroraDrift} 25s ease-in-out infinite alternate-reverse`}
      />

      <Box
        w="90%"
        maxW="450px"
        bg="rgba(255, 255, 255, 0.9)"
        backdropFilter="blur(10px)"
        p={{base: 8, md: 10}}
        borderRadius="3xl"
        boxShadow="0 25px 50px -12px rgba(28, 69, 50, 0.12)"
        border="1px solid rgba(72, 187, 120, 0.2)"
        position="relative"
        zIndex={1}
        animation={`${fadeIn} 0.8s ease-out both`}
      >
        <VStack spacing={2} mb={8} align="center" textAlign="center">
          <Heading size="xl" color="#1C4532" letterSpacing="tight" fontWeight="black">
            Set New Password
          </Heading>
          <Text color="#4A5568" fontSize="sm">
            Create a strong new password to secure your account.
          </Text>
        </VStack>

        {/* Text-Only Alert Messages */}
        {errorMsg && (
          <Text color="#E53E3E" fontSize="xs" fontWeight="medium" textAlign="center" mb={4} animation={`${fadeIn} 0.3s ease-out both`}>
            {errorMsg}
          </Text>
        )}

        {successMsg && (
          <Text color="#2F855A" fontSize="xs" fontWeight="medium" textAlign="center" mb={4} animation={`${fadeIn} 0.3s ease-out both`}>
            {successMsg}
          </Text>
        )}

        <form onSubmit={handleUpdate} noValidate>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#4A5568" textTransform="uppercase" mb={2} ml={1}>
                New Password
              </Text>
              <Box position="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  bg="#F7FAFC"
                  border="1px solid transparent"
                  focusBorderColor="#48BB78"
                  _hover={{bg: '#EDF2F7'}}
                  py={6}
                  pr="4.5rem"
                  borderRadius="xl"
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
                  color="#718096"
                  fontWeight="bold"
                  _hover={{bg: 'transparent', color: '#276749'}}
                  zIndex={2}
                  isDisabled={loading}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </Box>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#4A5568" textTransform="uppercase" mb={2} ml={1}>
                Confirm Password
              </Text>
              <Box position="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  bg="#F7FAFC"
                  border="1px solid transparent"
                  focusBorderColor="#48BB78"
                  _hover={{bg: '#EDF2F7'}}
                  py={6}
                  pr="4.5rem"
                  borderRadius="xl"
                  isDisabled={loading}
                />
              </Box>

              <Box mt={3} px={2}>
                <Text fontSize="xs" fontWeight="bold" color="#718096" mb={1}>
                  Password Requirements:
                </Text>
                <VStack align="start" spacing={1}>
                  <Flex align="center" gap={2}>
                    <Text fontSize="xs" color={hasMinLen ? '#38A169' : '#A0AEC0'}>
                      {hasMinLen ? '✓' : '○'}
                    </Text>
                    <Text fontSize="xs" color={hasMinLen ? '#1C4532' : '#A0AEC0'} fontWeight={hasMinLen ? 'bold' : 'normal'}>
                      At least 6 characters
                    </Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Text fontSize="xs" color={hasUpper ? '#38A169' : '#A0AEC0'}>
                      {hasUpper ? '✓' : '○'}
                    </Text>
                    <Text fontSize="xs" color={hasUpper ? '#1C4532' : '#A0AEC0'} fontWeight={hasUpper ? 'bold' : 'normal'}>
                      One uppercase letter
                    </Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Text fontSize="xs" color={hasLower ? '#38A169' : '#A0AEC0'}>
                      {hasLower ? '✓' : '○'}
                    </Text>
                    <Text fontSize="xs" color={hasLower ? '#1C4532' : '#A0AEC0'} fontWeight={hasLower ? 'bold' : 'normal'}>
                      One lowercase letter
                    </Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Text fontSize="xs" color={hasSpecialChar ? '#38A169' : '#A0AEC0'}>
                      {hasSpecialChar ? '✓' : '○'}
                    </Text>
                    <Text fontSize="xs" color={hasSpecialChar ? '#1C4532' : '#A0AEC0'} fontWeight={hasSpecialChar ? 'bold' : 'normal'}>
                      One special character (!@#$%...)
                    </Text>
                  </Flex>
                </VStack>
              </Box>
            </Box>

            <Button
              type="submit"
              isDisabled={loading}
              bg="#22543D"
              color="white"
              _hover={{
                bg: loading ? '#22543D' : '#1C4532',
                transform: loading ? 'none' : 'translateY(-3px)',
                boxShadow: loading ? 'none' : '0 15px 30px rgba(34, 84, 61, 0.25)'
              }}
              _active={{transform: 'translateY(0)'}}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              borderRadius="xl"
              py={7}
              mt={4}
              fontSize="md"
              fontWeight="black"
            >
              {loading ? (
                <Flex align="center" gap={3}>
                  <Spinner size="sm" color="white" />
                  <Text>{successMsg ? 'Redirecting...' : 'Updating...'}</Text>
                </Flex>
              ) : (
                'Save New Password'
              )}
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  )
}
