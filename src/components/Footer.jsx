// components/Footer.jsx
import {Box, Flex, Text, Button, SimpleGrid, VStack, HStack, Heading, Link as ChakraLink} from '@chakra-ui/react'
import {Link} from 'react-router-dom'
import {keyframes} from '@emotion/react'

// 🟢 Slow, comforting entry tracking for the base structure
const footerReveal = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

export default function Footer() {
  return (
    <Box w="100%" bg="#F4F9F5" borderTop="1px solid rgba(72, 187, 120, 0.2)" mt={0} animation={`${footerReveal} 0.8s ease-out both`}>
      {/* 🟢 Top Section: About + CTA */}
      <SimpleGrid columns={{base: 1, md: 2}} spacing={16} maxW="1200px" mx="auto" py={16} px={10}>
        {/* About Info */}
        <VStack align={{base: 'center', md: 'start'}} maxW="450px" spacing={4}>
          <Heading size="md" color="#1C4532" letterSpacing="tight">
            {' '}
            {/* Updated to deep forest green */}
            About Carbonsense
          </Heading>
          <Text color="#4A5568" fontSize="md" lineHeight="tall" textAlign={{base: 'center', md: 'left'}}>
            Carbonsense helps users track their carbon footprint based on their daily lifestyle. Check out our live community statistics
            above to see the collective impact we are making, and join us to start tracking your own.
          </Text>
        </VStack>

        {/* Get the App CTA */}
        <VStack align={{base: 'center', md: 'flex-end'}} spacing={4} justify="center">
          <Box textAlign={{base: 'center', md: 'right'}}>
            <Text color="#1C4532" fontWeight="900" fontSize="lg" mb={1}>
              {' '}
              {/* Replaced dark gray with forest green */}
              Ready to track your impact?
            </Text>
            <Text color="#4A5568" fontSize="sm" mb={6}>
              Download the Carbonsense mobile app today.
            </Text>
            <Button
              as={Link}
              to="/get-app"
              bg="#22543D" // Deep premium green to match Hero and Navbar buttons
              color="white"
              borderRadius="full"
              px={10}
              py={6}
              fontSize="sm"
              fontWeight="bold"
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              boxShadow="0 8px 20px rgba(34, 84, 61, 0.15)" // Green-tinted shadow
              _hover={{bg: '#1C4532', transform: 'translateY(-3px)', boxShadow: '0 12px 25px rgba(34, 84, 61, 0.25)'}}
              _active={{transform: 'translateY(-1px)'}}
            >
              Get the App
            </Button>
          </Box>
        </VStack>
      </SimpleGrid>

      {/* 🟢 Bottom Section: Legal/Copyright */}
      <Box borderTop="1px solid rgba(72, 187, 120, 0.15)" py={8} px={10}>
        {' '}
        {/* Soft green border instead of gray */}
        <Flex
          maxW="1200px"
          mx="auto"
          direction={{base: 'column', md: 'row'}}
          justify="space-between"
          align="center"
          fontSize="xs"
          fontWeight="bold"
          color="#2F855A" // Muted earthy green instead of slate gray
          textTransform="uppercase"
          letterSpacing="widest"
        >
          <Text>© {new Date().getFullYear()} Carbonsense. All rights reserved.</Text>

          <HStack spacing={8} mt={{base: 4, md: 0}}>
            <ChakraLink href="/privacy" _hover={{color: '#1C4532', transform: 'translateY(-1px)'}} transition="all 0.2s">
              Privacy Policy
            </ChakraLink>
            <ChakraLink href="/terms" _hover={{color: '#1C4532', transform: 'translateY(-1px)'}} transition="all 0.2s">
              Terms of Service
            </ChakraLink>
          </HStack>
        </Flex>
      </Box>
    </Box>
  )
}
