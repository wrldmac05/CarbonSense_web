import {useState} from 'react'
import {Box, Heading, Text, Input, Button, VStack, Flex, Icon, Spinner} from '@chakra-ui/react'
import {useNavigate} from 'react-router-dom'
import {supabase} from '../supabase'

// Zero-dependency SVG Eye Icons
const ViewIcon = props => (
  <Icon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" boxSize="5" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

const ViewOffIcon = props => (
  <Icon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" boxSize="5" {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </Icon>
)

export default function AdminRegister() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [securityCode, setSecurityCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // UI States
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const navigate = useNavigate()

  // 🔍 Field Validation Rules
  const validateForm = () => {
    const errors = {}

    // 1. Check Empty Fields
    if (!securityCode.trim()) errors.securityCode = 'Master Passcode is required.'
    if (!fullName.trim()) errors.fullName = 'Full Name is required.'
    if (!email.trim()) errors.email = 'Official Email is required.'
    if (!password) errors.password = 'Password is required.'
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.'

    // 2. Full Name Rules (Letters and single spaces only)
    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/
    if (fullName.trim() && !nameRegex.test(fullName)) {
      errors.fullName = 'Letters and single spaces only (no numbers, special characters, or extra spaces).'
    }

    // 3. Email Format
    const emailRegex = /^\S+@\S+\.\S+$/
    if (email.trim() && !emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address.'
    }

    // 4. Password Rules
    if (password) {
      if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters long.'
      } else if (!/[A-Z]/.test(password)) {
        errors.password = 'Password must contain at least one uppercase letter.'
      } else if (!/[a-z]/.test(password)) {
        errors.password = 'Password must contain at least one lowercase letter.'
      } else if (!/^[A-Za-z0-9]+$/.test(password)) {
        errors.password = 'Password must not contain special characters (letters and numbers only).'
      }
    }

    // 5. Confirm Password Match
    if (password && confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAdminRegistration = async e => {
    e.preventDefault()
    setServerError('')

    if (!validateForm()) return

    setLoading(true)

    try {
      const {data, error} = await supabase.functions.invoke('provision-admin', {
        body: {
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          securityCode: securityCode.trim()
        }
      })

      if (error) {
        let errMsg = error.message || ''
        try {
          const errJson = await error.context?.json()
          if (errJson?.error) errMsg = errJson.error
        } catch (_) {}

        if (errMsg.includes('non-2xx') || errMsg.toLowerCase().includes('passcode') || errMsg.toLowerCase().includes('unauthorized') || errMsg.includes('401')) {
          throw new Error('Wrong or expired master passcode, please contact an admin for help.')
        }

        throw new Error(errMsg)
      }

      if (data?.error) {
        if (data.error.toLowerCase().includes('passcode')) {
          throw new Error('Wrong or expired master passcode, please contact an admin for help.')
        }
        throw new Error(data.error)
      }

      alert('Admin Account Created Successfully! Please log in.')
      navigate('/login')
    } catch (err) {
      setServerError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box minH="100vh" w="100%" display="flex" alignItems="center" justifyContent="center" position="relative" overflow="hidden" bgGradient="linear(to-br, #1A202C, #2D3748, #4A5568)" py={10}>
      <Box w="90%" maxW="480px" bg="white" p={{base: 8, md: 10}} borderRadius="3xl" boxShadow="2xl">
        <VStack spacing={2} mb={6} align="center" textAlign="center">
          <Box px={3} py={1} bg="#FFF5F5" color="#E53E3E" borderRadius="md" fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider">
            Restricted Access
          </Box>
          <Heading size="xl" color="#1A202C" letterSpacing="tight" fontWeight="black">
            Staff Provisioning
          </Heading>
          <Text color="#718096" fontSize="sm">
            Create a new system administrator account.
          </Text>
        </VStack>

        {/* Server Error Alert */}
        {serverError && (
          <Flex align="center" gap={3} borderRadius="xl" mb={6} bg="#FFF5F5" color="#C53030" border="1px solid #FEB2B2" p={4}>
            <Text fontSize="lg">⚠️</Text>
            <Text fontSize="sm" fontWeight="bold">
              {serverError}
            </Text>
          </Flex>
        )}

        <form onSubmit={handleAdminRegistration} noValidate>
          <VStack spacing={4} align="stretch">
            {/* Master Passcode */}
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#4A5568" textTransform="uppercase" mb={1}>
                Master Passcode
              </Text>
              <Input
                type="password"
                value={securityCode}
                onChange={e => {
                  setSecurityCode(e.target.value)
                  if (fieldErrors.securityCode) setFieldErrors(prev => ({...prev, securityCode: null}))
                }}
                placeholder="Enter authorization code"
                bg="#F7FAFC"
                py={6}
                borderRadius="xl"
                borderColor={fieldErrors.securityCode ? 'red.400' : 'gray.200'}
              />
              {fieldErrors.securityCode && (
                <Text color="red.500" fontSize="xs" mt={1}>
                  {fieldErrors.securityCode}
                </Text>
              )}
            </Box>

            <Box borderTop="1px solid #E2E8F0" my={1} />

            {/* Admin Full Name */}
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#4A5568" textTransform="uppercase" mb={1}>
                Admin Full Name
              </Text>
              <Input
                type="text"
                value={fullName}
                onChange={e => {
                  // 🟢 Real-time input sanitization:
                  const sanitized = e.target.value
                    .replace(/[^A-Za-z\s]/g, '') // Strips all numbers & special characters
                    .replace(/\s+/g, ' ') // Prevents double/multiple spaces
                    .replace(/^\s+/, '') // Prevents leading spaces

                  setFullName(sanitized)

                  if (fieldErrors.fullName) {
                    setFieldErrors(prev => ({...prev, fullName: null}))
                  }
                }}
                placeholder="e.g. John Doe"
                bg="#F7FAFC"
                py={6}
                borderRadius="xl"
                borderColor={fieldErrors.fullName ? 'red.400' : 'gray.200'}
              />
              {fieldErrors.fullName && (
                <Text color="red.500" fontSize="xs" mt={1}>
                  {fieldErrors.fullName}
                </Text>
              )}
            </Box>

            {/* Official Email */}
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#4A5568" textTransform="uppercase" mb={1}>
                Official Email
              </Text>
              <Input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors(prev => ({...prev, email: null}))
                }}
                placeholder="name@carbonsense.com"
                bg="#F7FAFC"
                py={6}
                borderRadius="xl"
                borderColor={fieldErrors.email ? 'red.400' : 'gray.200'}
              />
              {fieldErrors.email && (
                <Text color="red.500" fontSize="xs" mt={1}>
                  {fieldErrors.email}
                </Text>
              )}
            </Box>

            {/* Password */}
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#4A5568" textTransform="uppercase" mb={1}>
                Secure Password
              </Text>
              <Box position="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors(prev => ({...prev, password: null}))
                  }}
                  placeholder="••••••••"
                  bg="#F7FAFC"
                  py={6}
                  pr="3rem"
                  borderRadius="xl"
                  borderColor={fieldErrors.password ? 'red.400' : 'gray.200'}
                />
                <Box
                  position="absolute"
                  right="3"
                  top="50%"
                  transform="translateY(-50%)"
                  cursor="pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  color="gray.500"
                  _hover={{color: 'gray.700'}}
                  zIndex={2}
                  display="flex"
                  alignItems="center"
                >
                  {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                </Box>
              </Box>
              {fieldErrors.password && (
                <Text color="red.500" fontSize="xs" mt={1}>
                  {fieldErrors.password}
                </Text>
              )}
            </Box>

            {/* Confirm Password */}
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#4A5568" textTransform="uppercase" mb={1}>
                Confirm Password
              </Text>
              <Box position="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value)
                    if (fieldErrors.confirmPassword) setFieldErrors(prev => ({...prev, confirmPassword: null}))
                  }}
                  placeholder="••••••••"
                  bg="#F7FAFC"
                  py={6}
                  pr="3rem"
                  borderRadius="xl"
                  borderColor={fieldErrors.confirmPassword ? 'red.400' : 'gray.200'}
                />
                <Box
                  position="absolute"
                  right="3"
                  top="50%"
                  transform="translateY(-50%)"
                  cursor="pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  color="gray.500"
                  _hover={{color: 'gray.700'}}
                  zIndex={2}
                  display="flex"
                  alignItems="center"
                >
                  {showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                </Box>
              </Box>
              {fieldErrors.confirmPassword && (
                <Text color="red.500" fontSize="xs" mt={1}>
                  {fieldErrors.confirmPassword}
                </Text>
              )}
            </Box>

            {/* Password Requirements Legend */}
            <Box bg="#EDF2F7" p={3} borderRadius="lg" fontSize="xs" color="#4A5568">
              <Text fontWeight="bold" mb={1}>
                Password Requirements:
              </Text>
              <Text>• At least 6 characters long</Text>
              <Text>• Minimum 1 uppercase & 1 lowercase letter</Text>
              <Text>• Letters and numbers only (no special characters)</Text>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              isLoading={loading}
              isDisabled={loading}
              pointerEvents={loading ? 'none' : 'auto'}
              bg="#1A202C"
              color="white"
              _hover={{bg: loading ? '#1A202C' : '#2D3748'}}
              _active={{bg: '#1A202C'}}
              _disabled={{opacity: 0.65, cursor: 'not-allowed', bg: '#1A202C'}}
              borderRadius="xl"
              py={7}
              mt={2}
              fontSize="md"
              fontWeight="black"
            >
              {loading ? (
                <Flex align="center" gap={3}>
                  <Spinner size="sm" color="white" thickness="2px" />
                  <Text>Provisioning Account...</Text>
                </Flex>
              ) : (
                'Provision Admin Account'
              )}
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  )
}
