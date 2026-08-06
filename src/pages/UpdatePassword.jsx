// pages/UpdatePassword.jsx
import {useState} from 'react'
import {Box, Heading, Text, Input, Button, VStack, Flex, Spinner} from '@chakra-ui/react'
import {useNavigate} from 'react-router-dom'
import {supabase} from '../supabase'
import {keyframes} from '@emotion/react'

// 🟢 Ambient & Entry Animation Definitions
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

  // 🟢 Real-time Password Validation Checks
  const hasMinLen = newPassword.length >= 6
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const noSpecialChars = /^[a-zA-Z0-9]+$/.test(newPassword)

  const handleUpdate = async e => {
    e.preventDefault()

    // 🟢 Hard Guard: Prevent execution if already loading (stops spam clicks)
    if (loading) return

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (!hasMinLen || !hasUpper || !hasLower || !noSpecialChars) {
        throw new Error('Please ensure your new password meets all requirements.')
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match. Please try again.')
      }

      const {error} = await supabase.auth.updateUser({password: newPassword})
      if (error) throw error

      await supabase.auth.signOut()

      setSuccessMsg('Password updated successfully! Redirecting to login...')

      // 🟢 Keep the button in a loading state while we wait to redirect
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      setErrorMsg(error.message)
      // 🟢 Turn off the spinner ONLY if there was an error so the user can try again
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

        {errorMsg && (
          <Flex
            align="center"
            gap={3}
            borderRadius="md"
            mb={6}
            bg="#FFF5F5"
            color="#C53030"
            border="1px solid #FEB2B2"
            p={4}
            animation={`${fadeIn} 0.3s ease-out`}
          >
            <Text fontSize="lg">⚠️</Text>
            <Text fontSize="sm" fontWeight="bold">
              {errorMsg}
            </Text>
          </Flex>
        )}

        {successMsg && (
          <Flex
            align="center"
            gap={3}
            borderRadius="md"
            mb={6}
            bg="#F0FFF4"
            color="#1C4532"
            border="1px solid #9AE6B4"
            p={4}
            animation={`${fadeIn} 0.3s ease-out`}
          >
            <Text fontSize="lg">✅</Text>
            <Text fontSize="sm" fontWeight="bold">
              {successMsg}
            </Text>
          </Flex>
        )}

        <form onSubmit={handleUpdate}>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#4A5568" textTransform="uppercase" mb={2} ml={1}>
                New Password
              </Text>
              <Box position="relative">
                <Input
                  required
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
                  required
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
                    <Text fontSize="xs" color={noSpecialChars ? '#38A169' : '#A0AEC0'}>
                      {noSpecialChars ? '✓' : '○'}
                    </Text>
                    <Text fontSize="xs" color={noSpecialChars ? '#1C4532' : '#A0AEC0'} fontWeight={noSpecialChars ? 'bold' : 'normal'}>
                      No special characters (!@#$)
                    </Text>
                  </Flex>
                </VStack>
              </Box>
            </Box>

            <Button
              type="submit"
              isDisabled={loading} // 🟢 Native Chakra disable lock
              bg="#22543D"
              color="white"
              _hover={{
                bg: loading ? '#22543D' : '#1C4532', // Don't show hover effect while loading
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
              {/* 🟢 Manual Spinner Implementation */}
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
