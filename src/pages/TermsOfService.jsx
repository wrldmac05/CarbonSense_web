// pages/TermsOfService.jsx
import {Box, Heading, Text, VStack, Flex, Link as ChakraLink, Separator} from '@chakra-ui/react'
import {Link as RouterLink} from 'react-router-dom'

export default function TermsOfService() {
  const lastUpdated = 'August 10, 2026'

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
            Legal
          </Text>
          <Heading size={{base: 'xl', sm: '2xl'}} color="#1A202C" mt={2} letterSpacing="tighter">
            Terms of Service
          </Heading>
          <Text color="#718096" fontSize="xs" mt={2}>
            Last Updated: {lastUpdated}
          </Text>
        </Box>
      </Box>

      {/* Content */}
      <Box maxW="800px" mx="auto" px={{base: 4, sm: 6, md: 10}} pt={{base: 6, md: 12}}>
        <VStack align="stretch" spacing={{base: 6, md: 8}} color="#4A5568" lineHeight="tall" fontSize={{base: 'sm', md: 'md'}}>
          {/* WELCOME / INTRO */}
          <Box>
            <Text mb={4}>
              Welcome to <strong>CarbonSense: An AI-Driven Recommendation System for Personal Carbon Footprint Mitigation Based on Self-Reported Activities</strong> ("CarbonSense," "we," "us," or "our").
            </Text>
            <Text mb={4}>
              CarbonSense is an AI-driven system developed as a capstone project by students of National University Dasmariñas (NU Dasmariñas). The system is designed to help users understand, monitor, and mitigate their personal carbon
              footprint based on their self-reported activities and AI-assisted activity analysis.
            </Text>
            <Text>By creating an account, accessing, or using CarbonSense, you agree to these Terms of Use. If you do not agree with these Terms, please do not use the system.</Text>
          </Box>

          <Separator borderColor="#E2E8F0" />

          {/* TABLE OF CONTENTS */}
          <Box bg="#F8FAFC" p={{base: 4, md: 6}} borderRadius="2xl" border="1px solid #E2E8F0">
            <Heading size="xs" color="#1A202C" mb={4} textTransform="uppercase" letterSpacing="wider">
              Table of Contents
            </Heading>
            <VStack align="start" spacing={1.5} fontSize="xs">
              <ChakraLink color="#38A169" href="#section-1">
                1. Acceptance of Terms
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-2">
                2. About CarbonSense
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-3">
                3. Eligibility
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-4">
                4. Account Registration and Security
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-5">
                5. Information and Activities Submitted by Users
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-6">
                6. AI-Assisted Features
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-7">
                7. Carbon Footprint Estimates and AI Disclaimer
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-8">
                8. Location and GPS Data
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-9">
                9. Weekly Missions
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-10">
                10. Acceptable Use
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-11">
                11. Account Suspension and Termination
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-12">
                12. Account Deletion and Data Retention
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-13">
                13. Research and System Improvement
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-14">
                14. Intellectual Property
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-15">
                15. Third-Party Services
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-16">
                16. Availability and Changes to the System
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-17">
                17. Disclaimer of Warranties
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-18">
                18. Limitation of Liability
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-19">
                19. Privacy
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-20">
                20. Governing Law
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-21">
                21. Changes to These Terms
              </ChakraLink>
              <ChakraLink color="#38A169" href="#section-22">
                22. Contact Us
              </ChakraLink>
            </VStack>
          </Box>

          <Separator borderColor="#E2E8F0" />

          {/* 1. ACCEPTANCE OF TERMS */}
          <Box id="section-1" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              1. Acceptance of Terms
            </Heading>
            <Text mb={3}>By accessing or using CarbonSense, you confirm that you have read, understood, and agreed to be bound by these Terms of Use.</Text>
            <Text>
              We may update or modify these Terms from time to time as CarbonSense is developed, improved, or made available to a wider audience. Continued use of the system after changes are posted constitutes acceptance of the updated
              Terms.
            </Text>
          </Box>

          {/* 2. ABOUT CARBONSENSE */}
          <Box id="section-2" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              2. About CarbonSense
            </Heading>
            <Text mb={3}>CarbonSense is an AI-driven recommendation system that helps users estimate and better understand their personal carbon footprint. The system may allow users to:</Text>
            <VStack align="start" pl={4} spacing={1.5} mb={3}>
              <Text>• Log daily activities manually through forms;</Text>
              <Text>• Use AI-assisted analysis to identify and process certain activities;</Text>
              <Text>• Analyze food images to estimate food items, ingredients, categories, estimated weight, and associated carbon footprint;</Text>
              <Text>• Analyze electricity bills to estimate electricity consumption and related carbon emissions;</Text>
              <Text>• Record transportation habits and activities;</Text>
              <Text>• Record food and dietary activities;</Text>
              <Text>• Track electricity usage;</Text>
              <Text>• View summaries of their carbon footprint;</Text>
              <Text>• Receive general, daily, weekly, monthly, and other activity-based summaries;</Text>
              <Text>• Participate in weekly carbon-footprint mitigation missions; and</Text>
              <Text>• Receive AI-driven recommendations based on available activity data.</Text>
            </VStack>
            <Text>CarbonSense may also include administrative dashboards and global or aggregated summaries for system monitoring, research, and analysis purposes.</Text>
          </Box>

          {/* 3. ELIGIBILITY */}
          <Box id="section-3" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              3. Eligibility
            </Heading>
            <Text mb={3}>CarbonSense is intended for users who are at least 12 years old. By using CarbonSense, you confirm that you meet this minimum age requirement.</Text>
            <Text>If you are below the age required to independently provide consent under applicable laws, you should use the system only with appropriate permission or supervision from a parent or legal guardian where required.</Text>
          </Box>

          {/* 4. ACCOUNT REGISTRATION AND SECURITY */}
          <Box id="section-4" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              4. Account Registration and Security
            </Heading>
            <Text mb={3}>To access certain features of CarbonSense, you may be required to create an account using your email address and password. You agree to:</Text>
            <VStack align="start" pl={4} spacing={1.5} mb={3}>
              <Text>• Provide accurate and truthful information;</Text>
              <Text>• Keep your account credentials confidential;</Text>
              <Text>• Not share your password with unauthorized individuals;</Text>
              <Text>• Notify us of any suspected unauthorized access to your account; and</Text>
              <Text>• Take reasonable steps to protect your account and device.</Text>
            </VStack>
            <Text mb={3}>You are responsible for activities performed through your account unless the activity resulted from unauthorized access that was not caused by your negligence.</Text>
            <Text>CarbonSense currently does not support third-party or social media sign-in services.</Text>
          </Box>

          {/* 5. INFORMATION AND ACTIVITIES SUBMITTED BY USERS */}
          <Box id="section-5" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              5. Information and Activities Submitted by Users
            </Heading>
            <Text mb={3}>
              CarbonSense may collect and process information necessary for its operation, including: full name, email address, profile picture, location/GPS information, daily activities, transportation habits, dietary data, electricity
              usage, and voluntarily submitted images/bills.
            </Text>
            <Text mb={3}>Users are responsible for ensuring that the information and activities they submit are accurate to the best of their knowledge.</Text>
            <Text>
              Because CarbonSense relies partly on self-reported activities, inaccurate, incomplete, or misleading information may affect the accuracy of carbon footprint calculations, summaries, recommendations, and other results.
            </Text>
          </Box>

          {/* 6. AI-ASSISTED FEATURES */}
          <Box id="section-6" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              6. AI-Assisted Features
            </Heading>
            <Text mb={3}>CarbonSense uses Google's Gemini AI through an API to support certain system features. Depending on the feature used, the AI may assist in:</Text>
            <VStack align="start" pl={4} spacing={1.5} mb={3}>
              <Text>• Identifying food from submitted images, detecting ingredients, and estimating food weight;</Text>
              <Text>• Identifying emission-factor categories and associated carbon footprints;</Text>
              <Text>• Analyzing electricity bills to estimate consumption and emissions;</Text>
              <Text>• Generating personal activity, monthly, and dashboard aggregated summaries; and</Text>
              <Text>• Assisting administrators with system briefing prescriptions.</Text>
            </VStack>
            <Text>By using AI-assisted features, you understand that information submitted to those features may be processed as necessary to provide the requested functionality and operate the CarbonSense system.</Text>
          </Box>

          {/* 7. CARBON FOOTPRINT ESTIMATES AND AI DISCLAIMER */}
          <Box id="section-7" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              7. Carbon Footprint Estimates and AI Disclaimer
            </Heading>
            <Text mb={3}>CarbonSense provides estimates, not exact or guaranteed measurements of carbon emissions.</Text>
            <Text mb={3}>
              Although CarbonSense uses emission factors and information based on legitimate and credible sources where applicable, results should still be understood as estimates. AI-generated results, recommendations, summaries, and
              analyses may occasionally be incomplete, inaccurate, or incorrect.
            </Text>
            <Text>CarbonSense should not be considered a substitute for professional environmental, scientific, legal, financial, or other expert advice.</Text>
          </Box>

          {/* 8. LOCATION AND GPS DATA */}
          <Box id="section-8" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              8. Location and GPS Data
            </Heading>
            <Text mb={3}>CarbonSense may collect location or GPS-related information for research, future development, system improvement, and other features supported by the application.</Text>
            <Text>Location data may be used to study activity patterns, improve carbon-footprint estimation methods, improve recommendations, and support future research and development.</Text>
          </Box>

          {/* 9. WEEKLY MISSIONS */}
          <Box id="section-9" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              9. Weekly Missions
            </Heading>
            <Text mb={3}>CarbonSense may provide weekly missions designed to encourage users to reduce or mitigate their estimated carbon footprint.</Text>
            <Text mb={3}>
              Upon successful completion of an eligible mission, the system may apply a corresponding reduction to the user's total estimated carbon footprint for the applicable month. These mission-related reductions are system-generated
              calculations, not monetary rewards, and are not exchangeable for cash or real-world compensation.
            </Text>
            <Text>Users must not attempt to manipulate, falsify, exploit, or bypass mission requirements.</Text>
          </Box>

          {/* 10. ACCEPTABLE USE */}
          <Box id="section-10" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              10. Acceptable Use
            </Heading>
            <Text mb={3}>When using CarbonSense, you agree not to:</Text>
            <VStack align="start" pl={4} spacing={1.5}>
              <Text>• Provide deliberately false or misleading activity information;</Text>
              <Text>• Manipulate activity logs, missions, calculations, or footprint results;</Text>
              <Text>• Create or use multiple accounts for abusing system features;</Text>
              <Text>• Attempt to gain unauthorized access to accounts, databases, or administrative features;</Text>
              <Text>• Introduce malicious code, viruses, or harmful software;</Text>
              <Text>• Reverse engineer or exploit the system; or</Text>
              <Text>• Use the system for illegal, fraudulent, or harmful purposes.</Text>
            </VStack>
          </Box>

          {/* 11. ACCOUNT SUSPENSION AND TERMINATION */}
          <Box id="section-11" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              11. Account Suspension and Termination
            </Heading>
            <Text>
              We reserve the right to suspend, restrict, or terminate an account when we reasonably believe that a user has violated these Terms of Use, submitted fraudulent information, attempted unauthorized access, or compromised system
              security.
            </Text>
          </Box>

          {/* 12. ACCOUNT DELETION AND DATA RETENTION */}
          <Box id="section-12" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              12. Account Deletion and Data Retention
            </Heading>
            <Text mb={3}>Users may request or initiate deletion of their CarbonSense account through available system features.</Text>
            <Text>
              When an account is deleted, the account may be removed from active use and archived. Certain information associated with deleted accounts may be retained for research, system evaluation, and improving AI-assisted feature
              accuracy, subject to anonymization and de-identification where appropriate.
            </Text>
          </Box>

          {/* 13. RESEARCH AND SYSTEM IMPROVEMENT */}
          <Box id="section-13" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              13. Research and System Improvement
            </Heading>
            <Text>
              CarbonSense was originally developed as a capstone project for National University Dasmariñas and may continue to be improved. The system may use appropriately processed user data, activity patterns, and aggregated information
              for academic research and system testing.
            </Text>
          </Box>

          {/* 14. INTELLECTUAL PROPERTY */}
          <Box id="section-14" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              14. Intellectual Property
            </Heading>
            <Text>
              The CarbonSense name, system design, software, interface, content, features, and branding are owned by or used with authorization by the CarbonSense development team. Users may not copy, reproduce, distribute, or commercially
              exploit CarbonSense materials without prior written authorization.
            </Text>
          </Box>

          {/* 15. THIRD-PARTY SERVICES */}
          <Box id="section-15" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              15. Third-Party Services
            </Heading>
            <Text>
              CarbonSense may rely on third-party technologies including Google's Gemini AI, Firebase Cloud Messaging, Supabase, and Vercel infrastructure. CarbonSense is not responsible for the independent actions or practices of
              third-party service providers.
            </Text>
          </Box>

          {/* 16. AVAILABILITY AND CHANGES TO THE SYSTEM */}
          <Box id="section-16" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              16. Availability and Changes to the System
            </Heading>
            <Text>We may add, modify, or remove features, update emission factors, or temporarily suspend access for maintenance. We do not guarantee that CarbonSense will always be available without interruption or error.</Text>
          </Box>

          {/* 17. DISCLAIMER OF WARRANTIES */}
          <Box id="section-17" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              17. Disclaimer of Warranties
            </Heading>
            <Text>CarbonSense is provided on an "as is" and "as available" basis. We do not guarantee that carbon footprint estimates or AI-generated results will always be exact or completely free from errors.</Text>
          </Box>

          {/* 18. LIMITATION OF LIABILITY */}
          <Box id="section-18" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              18. Limitation of Liability
            </Heading>
            <Text>
              To the extent permitted by applicable law, CarbonSense and its developers will not be liable for losses, damages, or decisions resulting solely from reliance on estimated carbon footprint calculations or AI-generated
              recommendations.
            </Text>
          </Box>

          {/* 19. PRIVACY */}
          <Box id="section-19" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              19. Privacy
            </Heading>
            <Text>Your use of CarbonSense is also subject to our Privacy Policy, which explains how personal information, activity data, and location data are collected, protected, and processed.</Text>
          </Box>

          {/* 20. GOVERNING LAW */}
          <Box id="section-20" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              20. Governing Law
            </Heading>
            <Text>These Terms of Use shall be governed by and interpreted in accordance with the laws of the Republic of the Philippines.</Text>
          </Box>

          {/* 21. CHANGES TO THESE TERMS */}
          <Box id="section-21" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              21. Changes to These Terms
            </Heading>
            <Text>We may revise these Terms of Use as CarbonSense develops or operational requirements change. Notice of significant revisions will be indicated by the "Last Updated" date at the top of these Terms.</Text>
          </Box>

          {/* 22. CONTACT US */}
          <Box id="section-22" pt={2} pb={8}>
            <Heading size="md" color="#1A202C" mb={3}>
              22. Contact Us
            </Heading>
            <Text mb={2}>If you have questions, concerns, or requests regarding these Terms of Use or the CarbonSense system, please contact us at:</Text>
            <Text fontWeight="bold" color="#1C4532">
              CarbonSense Capstone Research Team
            </Text>
            <Text fontSize="sm">National University Dasmariñas (NU Dasmariñas)</Text>
            <Text fontSize="sm">Dasmariñas City, Cavite, Philippines</Text>
            <Text mt={2}>
              <ChakraLink color="#38A169" href="mailto:ph.carbonsense@gmail.com" fontWeight="bold">
                ph.carbonsense@gmail.com
              </ChakraLink>
            </Text>
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
