import {Box, Heading, Text, VStack, Flex} from '@chakra-ui/react'
import {Link} from 'react-router-dom'

export default function PrivacyPolicy() {
  const lastUpdated = 'March 2026'

  return (
    <Box minH="100vh" bg="#FCFDFD" pb={20}>
      {/* Header */}
      <Box w="100%" pt={16} pb={8} px={10} borderBottom="1px solid rgba(226, 232, 240, 0.6)" bg="white">
        <Box maxW="800px" mx="auto" position="relative">
          <Flex
            align="center"
            gap={2}
            as={Link}
            to="/"
            position="absolute"
            top="-40px"
            left="0"
            _hover={{opacity: 0.7}}
            transition="opacity 0.2s"
          >
            <Text fontSize="lg" color="#2D3748">
              ←
            </Text>
            <Text fontWeight="bold" color="#2D3748" fontSize="sm">
              Back
            </Text>
          </Flex>
          <Text color="#38A169" fontWeight="bold" letterSpacing="widest" fontSize="xs" textTransform="uppercase">
            Legal
          </Text>
          <Heading size="2xl" color="#1A202C" mt={2} letterSpacing="tighter">
            Privacy Policy
          </Heading>
          <Text color="#718096" fontSize="sm" mt={2}>
            Last Updated: {lastUpdated}
          </Text>
        </Box>
      </Box>

      {/* Content */}
      <Box maxW="800px" mx="auto" px={10} pt={12}>
        <VStack align="stretch" spacing={8} color="#2D3748" lineHeight="tall">
          <Box>
            <Text>
              At Carbonsense, we are committed to protecting your personal information and your right to privacy. This Privacy Policy
              explains how we collect, use, and safeguard your information when you use our web and mobile applications.
            </Text>
          </Box>

          <Box>
            <Heading size="md" color="#1A202C" mb={3}>
              1. Information We Collect
            </Heading>
            <Text mb={2}>
              We collect personal information that you voluntarily provide to us when you register for an account, including:
            </Text>
            <VStack align="start" pl={5} spacing={1}>
              <Text>
                • <b>Account Data:</b> Your name, email address, and password.
              </Text>
              <Text>
                • <b>Carbon Tracking Data:</b> The daily activities you log (e.g., transport, diet, energy usage) to calculate your carbon
                footprint.
              </Text>
              <Text>
                • <b>Profile Information:</b> Your bio, display name, and custom reduction targets.
              </Text>
              <Text>
                • <b>Location Data:</b> Broad location data (e.g., city or region) to provide localized community analytics, if enabled.
              </Text>
            </VStack>
          </Box>

          <Box>
            <Heading size="md" color="#1A202C" mb={3}>
              2. How We Use Your Information
            </Heading>
            <Text>
              We use the information we collect to operate, maintain, and improve our services. This includes calculating your personal
              carbon footprint, displaying anonymized global community analytics, and securing your account.
            </Text>
          </Box>

          <Box>
            <Heading size="md" color="#1A202C" mb={3}>
              3. Data Security & Storage
            </Heading>
            <Text>
              We implement industry-standard security measures, including Row Level Security (RLS) on our databases, to protect your
              personal information. Your password is cryptographically hashed and never stored in plain text.
            </Text>
          </Box>

          <Box>
            <Heading size="md" color="#1A202C" mb={3}>
              4. Your Rights & Account Deletion
            </Heading>
            <Text>
              You have the right to access, update, or delete your personal information at any time. You can permanently delete your account
              and all associated carbon tracking data directly from your User Profile page using the "Danger Zone" feature. This action is
              irreversible.
            </Text>
          </Box>

          {/* 🟢 FIXED: Bulletproof Box Divider */}
          <Box w="100%" borderBottom="1px solid #E2E8F0" my={4} />

          <Box pb={8}>
            <Text color="#718096" fontSize="sm">
              If you have any questions or concerns about this Privacy Policy, please contact our team for your capstone defense.
            </Text>
          </Box>
        </VStack>
      </Box>
    </Box>
  )
}
