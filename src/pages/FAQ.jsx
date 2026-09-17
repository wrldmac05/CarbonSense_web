// pages/FAQ.jsx
import {Box, Heading, Text, VStack, Flex, Link as ChakraLink, Separator} from '@chakra-ui/react'
import {Link as RouterLink} from 'react-router-dom'

const FAQS = [
  {
    q: 'How does the AI Eco-Coach work?',
    a: 'Our AI analyzes your daily and monthly logged activities. It generates personalized insights and actionable tips to help you reduce your specific carbon footprint.'
  },
  {
    q: "Why can't I edit my Diet or Commute badges?",
    a: 'These badges are locked because they are generated dynamically. As you log your daily meals and travel, the system automatically calculates and updates your lifestyle profile to reflect your actual habits.'
  },
  {
    q: 'How is my net footprint calculated?',
    a: 'Your net footprint is your Total Emissions (from logged activities like driving or electricity use) minus your Total Savings (from completing smart eco-tasks).'
  }
]

export default function FAQ() {
  return (
    <Box minH="100vh" bg="#FCFDFD" pb={{base: 12, md: 20}}>
      {/* Header */}
      <Box w="100%" pt={{base: 12, md: 16}} pb={{base: 6, md: 8}} px={{base: 4, sm: 6, md: 10}} borderBottom="1px solid rgba(226, 232, 240, 0.6)" bg="white">
        <Box maxW="800px" mx="auto" position="relative">
          <Flex align="center" gap={2} as={RouterLink} to="/" position={{base: 'relative', sm: 'absolute'}} top={{sm: '-40px'}} left="0" mb={{base: 4, sm: 0}} _hover={{opacity: 0.7}} transition="opacity 0.2s">
            <Text fontSize="lg" color="#2D3748">
              ←
            </Text>
            <Text fontWeight="bold" color="#2D3748" fontSize="sm">
              Back
            </Text>
          </Flex>
          <Text color="#38A169" fontWeight="bold" letterSpacing="widest" fontSize="xs" textTransform="uppercase">
            Help &amp; Support
          </Text>
          <Heading size={{base: 'xl', sm: '2xl'}} color="#1A202C" mt={2} letterSpacing="tighter">
            Frequently Asked Questions
          </Heading>
          <Text color="#718096" fontSize="xs" mt={2}>
            Answers to common questions and a plain-language account of how CarbonSense handles your data.
          </Text>
        </Box>
      </Box>

      {/* Content */}
      <Box maxW="800px" mx="auto" px={{base: 4, sm: 6, md: 10}} pt={{base: 6, md: 12}}>
        <VStack align="stretch" spacing={{base: 6, md: 8}} color="#4A5568" lineHeight="tall" fontSize={{base: 'sm', md: 'md'}}>
          {/* TABLE OF CONTENTS */}
          <Box bg="#F8FAFC" p={{base: 4, md: 6}} borderRadius="2xl" border="1px solid #E2E8F0">
            <Heading size="xs" color="#1A202C" mb={4} textTransform="uppercase" letterSpacing="wider">
              Table of Contents
            </Heading>
            <VStack align="start" spacing={1.5} fontSize="xs">
              <ChakraLink color="#38A169" href="#transparency">
                1. Data Transparency
              </ChakraLink>
              <ChakraLink color="#38A169" href="#questions">
                2. Common Questions
              </ChakraLink>
              <ChakraLink color="#38A169" href="#support">
                3. Contact Support
              </ChakraLink>
            </VStack>
          </Box>

          <Separator borderColor="#E2E8F0" />

          {/* 1. DATA TRANSPARENCY */}
          <Box id="transparency" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              1. Data Transparency
            </Heading>
            <Text mb={4}>Every category of information the app touches, and what happens to it after you log an activity:</Text>

            <Box mb={5}>
              <Heading size="xs" color="#1C4532" mb={2}>
                1.1 What We Track
              </Heading>
              <VStack align="start" pl={4} spacing={1} fontSize="sm">
                <Text>• Activity logs: Meal types, commute modes, distances, and monthly electricity kilowatt-hour (kWh) values.</Text>
                <Text>• Basic account identity: Display name and verified email strictly for profile sync and authentication.</Text>
                <Text>• Gamification records: Eco-mission completions and logged activities.</Text>
              </VStack>
            </Box>

            <Box mb={5}>
              <Heading size="xs" color="#1C4532" mb={2}>
                1.2 What We Never Touch
              </Heading>
              <VStack align="start" pl={4} spacing={1} fontSize="sm">
                <Text>• Personal details on utility bills: Customer account numbers, meter serials, and billing addresses are stripped before analysis.</Text>
                <Text>• Unrelated device media: We never scan or access personal photo libraries outside the images you explicitly upload.</Text>
                <Text>• No data brokering: Your personal records are never sold, leased, or transmitted to commercial marketing vendors.</Text>
              </VStack>
            </Box>

            <Box mb={5}>
              <Heading size="xs" color="#1C4532" mb={2}>
                1.3 What Happens to Images You Take
              </Heading>
              <VStack align="start" pl={4} spacing={1} fontSize="sm">
                <Text>
                  • <strong>Zero Cloud Photo Storage:</strong> Images you capture are never uploaded to our database or saved to any cloud storage buckets.
                </Text>
                <Text>
                  • <strong>Ephemeral AI Analysis:</strong> Photos are compressed and sent as temporary, in-memory payloads directly to our secure Database Function for AI analysis.
                </Text>
                <Text>
                  • <strong>Only Metrics Are Saved:</strong> Once analysis finishes, only numerical and descriptive data (meal name, estimated weight, detected ingredients, electricity consumption, and CO₂e) are saved to your activity log.
                </Text>
                <Text>
                  • <strong>Instant Local Discard:</strong> Captured photos exist only within your device's temporary memory session and are discarded as soon as you finish logging or exit the scanner.
                </Text>
              </VStack>
            </Box>

            <Box>
              <Heading size="xs" color="#1C4532" mb={2}>
                1.4 Data Used for System Improvements
              </Heading>
              <VStack align="start" pl={4} spacing={1} fontSize="sm">
                <Text>• Only aggregated, anonymized metrics (e.g., average regional commute distances or typical household kWh ranges) are analyzed.</Text>
                <Text>• These aggregate figures assist local government and environmental research partners in calibrating localized carbon factors.</Text>
                <Text>• Anonymized logs assist in refining prompt classification accuracy for the AI Eco-Coach.</Text>
              </VStack>
            </Box>
          </Box>

          <Separator borderColor="#E2E8F0" />

          {/* 2. COMMON QUESTIONS */}
          <Box id="questions" pt={2}>
            <Heading size="md" color="#1A202C" mb={4}>
              2. Common Questions
            </Heading>
            <VStack align="stretch" spacing={4}>
              {FAQS.map(item => (
                <Box key={item.q} bg="#F8FAFC" p={{base: 4, md: 5}} borderRadius="xl" border="1px solid #E2E8F0">
                  <Heading size="xs" color="#1C4532" mb={2}>
                    {item.q}
                  </Heading>
                  <Text fontSize="sm" color="#4A5568">
                    {item.a}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>

          <Separator borderColor="#E2E8F0" />

          {/* 3. CONTACT SUPPORT */}
          <Box id="support" pt={2} pb={8}>
            <Heading size="md" color="#1A202C" mb={3}>
              3. Contact Support
            </Heading>
            <Text mb={4}>For technical inquiries, account assistance, or capstone research questions, reach out to our team:</Text>
            <Box bg="#F8FAFC" p={{base: 4, md: 6}} borderRadius="2xl" border="1px solid #E2E8F0">
              <Text fontWeight="bold" color="#1C4532">
                CarbonSense Support &amp; Research Team
              </Text>
              <Text fontSize="sm">National University Dasmariñas (NU Dasmariñas)</Text>
              <Text fontSize="sm">Dasmariñas City, Cavite, Philippines</Text>
              <Text mt={3}>
                <ChakraLink color="#38A169" href="mailto:ph.carbonsense@gmail.com" fontWeight="bold">
                  ph.carbonsense@gmail.com
                </ChakraLink>
              </Text>
            </Box>
          </Box>

          <Separator borderColor="#E2E8F0" />

          <Box pb={8} textAlign="center">
            <Text color="#A0AEC0" fontSize="2xs">
              CarbonSense © 2026 — An AI-Driven Recommendation System for Personal Carbon Footprint Mitigation.
            </Text>
          </Box>
        </VStack>
      </Box>
    </Box>
  )
}
