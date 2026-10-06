// components/Footer.jsx
import {Box, Flex, Text, Button, SimpleGrid, VStack, HStack, Heading, Link as ChakraLink} from '@chakra-ui/react'
import {Link} from 'react-router-dom'
import {keyframes} from '@emotion/react'
import {useTheme} from '../App'

// 🟢 Slow, comforting entry tracking for the base structure
const footerReveal = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

export default function Footer() {
  const {isDarkMode} = useTheme()

  return (
    <Box
      w="100%"
      bg={isDarkMode ? '#0B1120' : '#F4F9F5'}
      borderTop={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(72, 187, 120, 0.2)'}`}
      mt={0}
      animation={`${footerReveal} 0.8s ease-out both`}
      transition="background-color 0.3s ease, border-color 0.3s ease"
    >
      {/* 🟢 Top Section: About + CTA */}
      <SimpleGrid columns={{base: 1, md: 2}} spacing={16} maxW="1200px" mx="auto" py={16} px={10}>
        {/* About Info */}
        <VStack align={{base: 'center', md: 'start'}} maxW="450px" spacing={4}>
          <Heading size="md" color={isDarkMode ? '#F8FAFC' : '#1C4532'} letterSpacing="tight">
            About Carbonsense
          </Heading>
          <Text color={isDarkMode ? '#94A3B8' : '#4A5568'} fontSize="md" lineHeight="tall" textAlign={{base: 'center', md: 'left'}}>
            Carbonsense helps users track their carbon footprint based on their daily lifestyle. Check out our live community statistics above to see the collective impact we are making, and join us to start tracking your own.
          </Text>
        </VStack>

        {/* Get the App CTA */}
        <VStack align={{base: 'center', md: 'flex-end'}} spacing={4} justify="center">
          <Box textAlign={{base: 'center', md: 'right'}}>
            <Text color={isDarkMode ? '#F8FAFC' : '#1C4532'} fontWeight="900" fontSize="lg" mb={1}>
              Ready to track your impact?
            </Text>
            <Text color={isDarkMode ? '#94A3B8' : '#4A5568'} fontSize="sm" mb={6}>
              Download the Carbonsense mobile app today.
            </Text>
            <Button
              as={Link}
              to="/get-app"
              bg={isDarkMode ? '#2F855A' : '#22543D'}
              color="white"
              borderRadius="full"
              px={10}
              py={6}
              fontSize="sm"
              fontWeight="bold"
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              boxShadow={isDarkMode ? '0 8px 20px rgba(47, 133, 90, 0.3)' : '0 8px 20px rgba(34, 84, 61, 0.15)'}
              _hover={{
                bg: isDarkMode ? '#38A169' : '#1C4532',
                transform: 'translateY(-3px)',
                boxShadow: isDarkMode ? '0 12px 25px rgba(47, 133, 90, 0.4)' : '0 12px 25px rgba(34, 84, 61, 0.25)'
              }}
              _active={{transform: 'translateY(-1px)'}}
            >
              Get the App
            </Button>
          </Box>
        </VStack>
      </SimpleGrid>

      {/* 🟢 Bottom Section: Legal/Copyright */}
      <Box borderTop={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(72, 187, 120, 0.15)'}`} py={8} px={10}>
        <Flex
          maxW="1200px"
          mx="auto"
          direction={{base: 'column', md: 'row'}}
          justify="space-between"
          align="center"
          fontSize="xs"
          fontWeight="bold"
          color={isDarkMode ? '#68D391' : '#2F855A'}
          textTransform="uppercase"
          letterSpacing="widest"
        >
          <Text>© {new Date().getFullYear()} Carbonsense. All rights reserved.</Text>

          <HStack spacing={8} mt={{base: 4, md: 0}}>
            <ChakraLink as={Link} to="/faq" _hover={{color: isDarkMode ? '#A7F3D0' : '#1C4532', transform: 'translateY(-1px)'}} transition="all 0.2s">
              FAQ
            </ChakraLink>
            <ChakraLink as={Link} to="/privacy" _hover={{color: isDarkMode ? '#A7F3D0' : '#1C4532', transform: 'translateY(-1px)'}} transition="all 0.2s">
              Privacy Policy
            </ChakraLink>
            <ChakraLink as={Link} to="/terms" _hover={{color: isDarkMode ? '#A7F3D0' : '#1C4532', transform: 'translateY(-1px)'}} transition="all 0.2s">
              Terms of Service
            </ChakraLink>
          </HStack>
        </Flex>
      </Box>
    </Box>
  )
}
