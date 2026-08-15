// pages/PrivacyPolicy.jsx
import {Box, Heading, Text, VStack, Flex, Link as ChakraLink, Separator} from '@chakra-ui/react'
import {Link as RouterLink} from 'react-router-dom'

export default function PrivacyPolicy() {
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
            Privacy Policy
          </Heading>
          <Text color="#718096" fontSize="xs" mt={2}>
            Last Updated: {lastUpdated}
          </Text>
        </Box>
      </Box>

      {/* Content */}
      <Box maxW="800px" mx="auto" px={{base: 4, sm: 6, md: 10}} pt={{base: 6, md: 12}}>
        <VStack align="stretch" spacing={{base: 6, md: 8}} color="#4A5568" lineHeight="tall" fontSize={{base: 'sm', md: 'md'}}>
          {/* INTRO */}
          <Box>
            <Text mb={4}>
              Welcome to <strong>CarbonSense: An AI-Driven Recommendation System for Personal Carbon Footprint Mitigation Based on Self-Reported Activities</strong> ("CarbonSense," "we," "us," or "our").
            </Text>
            <Text mb={4}>
              CarbonSense is an AI-driven recommendation system originally developed as a capstone project by students of National University Dasmariñas (NU Dasmariñas). The system is designed to help users understand, monitor, and mitigate
              their personal carbon footprint based on self-reported activities and AI-assisted analysis.
            </Text>
            <Text mb={4}>This Privacy Policy explains how CarbonSense collects, uses, stores, processes, shares, and protects information when you use our mobile application, website, and related services.</Text>
            <Text>By creating an account or using CarbonSense, you acknowledge the data practices described in this Privacy Policy.</Text>
          </Box>

          <Separator borderColor="#E2E8F0" />

          {/* TABLE OF CONTENTS */}
          <Box bg="#F8FAFC" p={{base: 4, md: 6}} borderRadius="2xl" border="1px solid #E2E8F0">
            <Heading size="xs" color="#1A202C" mb={4} textTransform="uppercase" letterSpacing="wider">
              Table of Contents
            </Heading>
            <VStack align="start" spacing={1.5} fontSize="xs">
              <ChakraLink color="#38A169" href="#policy-1">
                1. Information We Collect
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-2">
                2. How We Collect Information
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-3">
                3. How We Use Your Information
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-4">
                4. AI Processing and Google Gemini
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-5">
                5. Carbon Footprint Calculations
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-6">
                6. Firebase Cloud Messaging
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-7">
                7. Vercel and Website Infrastructure
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-8">
                8. How We Share or Disclose Information
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-9">
                9. Aggregated and De-Identified Information
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-10">
                10. Account Deletion and Archived Research Data
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-11">
                11. Data Retention
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-12">
                12. Data Security
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-13">
                13. Children's Privacy
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-14">
                14. Your Choices and Controls
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-15">
                15. Third-Party Services
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-16">
                16. International Data Processing
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-17">
                17. Philippine Privacy Law
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-18">
                18. Changes to This Privacy Policy
              </ChakraLink>
              <ChakraLink color="#38A169" href="#policy-19">
                19. Contact Us
              </ChakraLink>
            </VStack>
          </Box>

          <Separator borderColor="#E2E8F0" />

          {/* 1. INFORMATION WE COLLECT */}
          <Box id="policy-1" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              1. Information We Collect
            </Heading>
            <Text mb={3}>Depending on how you use CarbonSense, we may collect the following information:</Text>

            <Box mb={4}>
              <Heading size="xs" color="#1C4532" mb={2}>
                1.1 Account and Profile Information
              </Heading>
              <VStack align="start" pl={4} spacing={1} fontSize="sm">
                <Text>• Full name, email address, profile picture</Text>
                <Text>• Account credentials (securely managed authentication)</Text>
                <Text>• Information voluntarily provided in your profile</Text>
              </VStack>
            </Box>

            <Box mb={4}>
              <Heading size="xs" color="#1C4532" mb={2}>
                1.2 Activity and Carbon Footprint Information
              </Heading>
              <VStack align="start" pl={4} spacing={1} fontSize="sm">
                <Text>• Daily activity entries (transportation, diet, electricity usage)</Text>
                <Text>• Electricity bill data submitted for AI estimation</Text>
                <Text>• Carbon footprint logs, weekly mission progress, and estimated footprint results</Text>
              </VStack>
            </Box>

            <Box mb={4}>
              <Heading size="xs" color="#1C4532" mb={2}>
                1.3 Images and Documents Submitted for AI Analysis
              </Heading>
              <Text mb={2}>Voluntarily submitted food photos or electricity utility bills used for feature processing. Please avoid uploading unnecessary sensitive personal content.</Text>
            </Box>

            <Box mb={4}>
              <Heading size="xs" color="#1C4532" mb={2}>
                1.4 Location and GPS Data
              </Heading>
              <Text mb={2}>Geographical data enabled via device permissions, used for research, improving footprint estimations, understanding location activity patterns, and supporting regional analytical features.</Text>
            </Box>

            <Box>
              <Heading size="xs" color="#1C4532" mb={2}>
                1.5 Device and Technical Information
              </Heading>
              <Text>Limited technical logs (IP address, operating system, diagnostic error reports, notification identifiers) necessary for system operation and security monitoring.</Text>
            </Box>
          </Box>

          {/* 2. HOW WE COLLECT INFORMATION */}
          <Box id="policy-2" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              2. How We Collect Information
            </Heading>
            <VStack align="start" pl={4} spacing={1.5}>
              <Text>• Directly from account registration entries and manual activity forms</Text>
              <Text>• From food photos and utility bills voluntarily uploaded for AI evaluation</Text>
              <Text>• From GPS permissions granted on your mobile device</Text>
              <Text>• Automatically generated calculations, mission metrics, and error diagnostics</Text>
            </VStack>
          </Box>

          {/* 3. HOW WE USE YOUR INFORMATION */}
          <Box id="policy-3" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              3. How We Use Your Information
            </Heading>
            <Text mb={3}>We process collected data to:</Text>
            <VStack align="start" pl={4} spacing={1.5}>
              <Text>• Manage user profiles and authenticate platform access</Text>
              <Text>• Compute personal carbon estimates and AI-driven reduction recommendations</Text>
              <Text>• Evaluate food images and analyze electricity consumption documents</Text>
              <Text>• Generate individual, weekly, monthly, and system-wide summary telemetry</Text>
              <Text>• Track and validate gamified weekly mission achievements</Text>
              <Text>• Conduct academic research, system testing, and model refinements</Text>
            </VStack>
          </Box>

          {/* 4. AI PROCESSING AND GOOGLE GEMINI */}
          <Box id="policy-4" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              4. AI Processing and Google Gemini
            </Heading>
            <Text mb={3}>CarbonSense connects to Google's Gemini AI API to support intelligent image, document, and recommendation features.</Text>
            <Text mb={3}>
              AI evaluations estimate food weights, ingredient composition, electricity consumption, and prescription briefings. Submissions processed by Gemini AI are used solely to fulfill app functionality and improve system accuracy.
            </Text>
            <Text>AI-generated results are estimates and should not be interpreted as absolute scientific measurements.</Text>
          </Box>

          {/* 5. CARBON FOOTPRINT CALCULATIONS */}
          <Box id="policy-5" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              5. Carbon Footprint Calculations
            </Heading>
            <Text>
              Emission estimates are derived from user logs, emission factor matrices, and AI interpretations. Accuracy depends on the quality of self-reported data and document scans. Results are intended for educational and personal habit
              modification.
            </Text>
          </Box>

          {/* 6. FIREBASE CLOUD MESSAGING */}
          <Box id="policy-6" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              6. Firebase Cloud Messaging
            </Heading>
            <Text>Firebase Cloud Messaging (FCM) is utilized to send push notifications regarding weekly missions, habit reminders, and system alerts. Device tokens managed by FCM can be disabled via mobile system settings.</Text>
          </Box>

          {/* 7. VERCEL AND WEBSITE INFRASTRUCTURE */}
          <Box id="policy-7" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              7. Vercel and Website Infrastructure
            </Heading>
            <Text>Web services are deployed via Vercel infrastructure, which collects standard network server logs (IP address, web requests, user-agent details) to maintain network stability and service security.</Text>
          </Box>

          {/* 8. HOW WE SHARE OR DISCLOSE INFORMATION */}
          <Box id="policy-8" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              8. How We Share or Disclose Information
            </Heading>
            <Text mb={3}>
              <strong>CarbonSense does not sell user personal data.</strong> Disclosures are limited to:
            </Text>
            <VStack align="start" pl={4} spacing={1.5}>
              <Text>
                • <strong>Service Providers:</strong> Cloud infrastructure (Supabase, Vercel), AI engines (Google Gemini), and notifications (Firebase).
              </Text>
              <Text>
                • <strong>Academic Research:</strong> De-identified or aggregated data used for capstone presentation and environmental research publications.
              </Text>
              <Text>
                • <strong>Legal Requirements:</strong> Disclosures mandated by law enforcement or system security investigations.
              </Text>
            </VStack>
          </Box>

          {/* 9. AGGREGATED AND DE-IDENTIFIED INFORMATION */}
          <Box id="policy-9" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              9. Aggregated and De-Identified Information
            </Heading>
            <Text>Anonymized statistical datasets (e.g., regional emission averages, overall diet habits) are retained for long-term capstone analytics and administrative dashboard reports without exposing individual identities.</Text>
          </Box>

          {/* 10. ACCOUNT DELETION AND ARCHIVED RESEARCH DATA */}
          <Box id="policy-10" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              10. Account Deletion and Archived Research Data
            </Heading>
            <Text mb={3}>When account deletion is requested, active access credentials are destroyed.</Text>
            <Text>Certain activity metrics may be archived in an anonymized, de-identified format strictly for historical research continuity, accuracy evaluation, and capstone compliance.</Text>
          </Box>

          {/* 11. DATA RETENTION */}
          <Box id="policy-11" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              11. Data Retention
            </Heading>
            <Text>Active profile data is stored as long as your account is maintained. Anonymized logs and research metrics may be retained indefinitely to support institutional research and long-term carbon trend analysis.</Text>
          </Box>

          {/* 12. DATA SECURITY */}
          <Box id="policy-12" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              12. Data Security
            </Heading>
            <Text>
              We implement industry-standard security measures including database Row Level Security (RLS), encrypted API key handling in Supabase Edge secrets, and secure HTTPS transmission. However, no internet transmission is 100% immune
              to all security vulnerabilities.
            </Text>
          </Box>

          {/* 13. CHILDREN'S PRIVACY */}
          <Box id="policy-13" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              13. Children's Privacy
            </Heading>
            <Text>CarbonSense is intended for users who are at least 12 years old. Minors should access the application with legal parent or guardian supervision where required.</Text>
          </Box>

          {/* 14. YOUR CHOICES AND CONTROLS */}
          <Box id="policy-14" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              14. Your Choices and Controls
            </Heading>
            <Text>You have the right to access, edit, or delete your account records, disable mobile GPS tracking via system permissions, or manage push notifications.</Text>
          </Box>

          {/* 15. THIRD-PARTY SERVICES */}
          <Box id="policy-15" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              15. Third-Party Services
            </Heading>
            <Text>CarbonSense integrates third-party tools (Google Gemini, Supabase, Vercel, Firebase). We encourage users to inspect the individual privacy policies of these service infrastructure providers.</Text>
          </Box>

          {/* 16. INTERNATIONAL DATA PROCESSING */}
          <Box id="policy-16" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              16. International Data Processing
            </Heading>
            <Text>Some cloud hosting and AI services store data on secure servers operating outside the Philippines. By using CarbonSense, you acknowledge international processing in compliance with privacy protocols.</Text>
          </Box>

          {/* 17. PHILIPPINE PRIVACY LAW */}
          <Box id="policy-17" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              17. Philippine Privacy Law
            </Heading>
            <Text>CarbonSense adheres to the provisions of the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and its Implementing Rules and Regulations.</Text>
          </Box>

          {/* 18. CHANGES TO THIS PRIVACY POLICY */}
          <Box id="policy-18" pt={2}>
            <Heading size="md" color="#1A202C" mb={3}>
              18. Changes to This Privacy Policy
            </Heading>
            <Text>This policy may be modified as CarbonSense expands. Material updates will be reflected in the "Last Updated" date at the top of this document.</Text>
          </Box>

          {/* 19. CONTACT US */}
          <Box id="policy-19" pt={2} pb={8}>
            <Heading size="md" color="#1A202C" mb={3}>
              19. Contact Us
            </Heading>
            <Text mb={2}>For privacy inquiries, data deletion requests, or capstone research questions, contact us at:</Text>
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
