// pages/AdminRegister.jsx
import {useState} from 'react'
import {Box, Heading, Text, Input, Button, VStack, Flex} from '@chakra-ui/react'
import {useNavigate} from 'react-router-dom'
import {supabase} from '../supabase'

export default function AdminRegister() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [securityCode, setSecurityCode] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const navigate = useNavigate()

  // 🔴 CHANGE THIS TO WHATEVER YOU WANT YOUR SECRET CODE TO BE
  const MASTER_PASSCODE = 'CAPSTONE-ADMIN-2026'

  const handleAdminRegistration = async e => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      // 1. Gatekeeper Check
      if (securityCode !== MASTER_PASSCODE) {
        throw new Error('Invalid Master Passcode. Authorization denied.')
      }

      // 2. Register the user in Supabase Auth
      const {data: authData, error: authError} = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {full_name: fullName},
          // 🟢 NEW: Tells the email exactly where to send this specific user
          emailRedirectTo: `${window.location.origin}/admin`
        }
      })

      if (authError) throw authError

      // 3. Wait 2 seconds to ensure the Postgres trigger has finished creating the blank profile
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 4. Call the highly secure RPC to elevate the user to Admin and wipe consumer stats
      const {error: profileError} = await supabase.rpc('elevate_to_admin', {
        target_user_id: authData.user.id
      })

      if (profileError) throw profileError

      alert('Admin Account Created Successfully! You are now logged in as Staff.')

      // Navigate them straight to the admin control room
      navigate('/admin')
    } catch (error) {
      setErrorMsg(error.message)
    } finally {
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
      bgGradient="linear(to-br, #1A202C, #2D3748, #4A5568)"
    >
      {/* Dark/System Theme Background Accents */}
      <Box
        position="absolute"
        top="-10%"
        left="-10%"
        w="500px"
        h="500px"
        bg="#38A169"
        opacity="0.1"
        filter="blur(80px)"
        borderRadius="full"
      />

      <Box w="90%" maxW="450px" bg="white" p={{base: 8, md: 10}} borderRadius="3xl" boxShadow="2xl" position="relative" zIndex={1}>
        <VStack spacing={2} mb={8} align="center" textAlign="center">
          <Box
            px={3}
            py={1}
            bg="#FFF5F5"
            color="#E53E3E"
            borderRadius="md"
            fontSize="xs"
            fontWeight="black"
            textTransform="uppercase"
            letterSpacing="wider"
            mb={2}
          >
            Restricted Access
          </Box>
          <Heading size="xl" color="#1A202C" letterSpacing="tight" fontWeight="black">
            Staff Provisioning
          </Heading>
          <Text color="#718096" fontSize="sm">
            Create a new system administrator account.
          </Text>
        </VStack>

        {errorMsg && (
          <Flex align="center" gap={3} borderRadius="md" mb={6} bg="#FFF5F5" color="#C53030" border="1px solid #FEB2B2" p={4}>
            <Text fontSize="lg">⚠️</Text>
            <Text fontSize="sm" fontWeight="bold">
              {errorMsg}
            </Text>
          </Flex>
        )}

        <form onSubmit={handleAdminRegistration}>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#4A5568" textTransform="uppercase" mb={2} ml={1}>
                Master Passcode
              </Text>
              <Input
                required
                type="password"
                value={securityCode}
                onChange={e => setSecurityCode(e.target.value)}
                placeholder="Enter authorization code"
                bg="#F7FAFC"
                border="1px solid transparent"
                focusBorderColor="#E53E3E"
                _hover={{bg: '#EDF2F7'}}
                py={6}
                borderRadius="xl"
              />
            </Box>

            <Box borderTop="1px solid #E2E8F0" my={2} />

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#4A5568" textTransform="uppercase" mb={2} ml={1}>
                Admin Full Name
              </Text>
              <Input
                required
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                bg="#F7FAFC"
                border="1px solid transparent"
                focusBorderColor="#38A169"
                _hover={{bg: '#EDF2F7'}}
                py={6}
                borderRadius="xl"
              />
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#4A5568" textTransform="uppercase" mb={2} ml={1}>
                Official Email
              </Text>
              <Input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@carbonsense.com"
                bg="#F7FAFC"
                border="1px solid transparent"
                focusBorderColor="#38A169"
                _hover={{bg: '#EDF2F7'}}
                py={6}
                borderRadius="xl"
              />
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="#4A5568" textTransform="uppercase" mb={2} ml={1}>
                Secure Password
              </Text>
              <Input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                bg="#F7FAFC"
                border="1px solid transparent"
                focusBorderColor="#38A169"
                _hover={{bg: '#EDF2F7'}}
                py={6}
                borderRadius="xl"
              />
            </Box>

            <Button
              type="submit"
              isLoading={loading}
              bg="#1A202C"
              color="white"
              _hover={{bg: '#2D3748', transform: 'translateY(-2px)'}}
              borderRadius="xl"
              py={7}
              mt={4}
              fontSize="md"
              fontWeight="black"
            >
              Provision Admin Account
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  )
}
