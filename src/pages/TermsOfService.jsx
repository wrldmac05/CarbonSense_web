// pages/TermsOfService.jsx
import {Box, Heading, Text, VStack, Flex, Link as ChakraLink, Separator, List} from '@chakra-ui/react' // 🟢 FIXED: Changed UnorderedList/ListItem to List
import {Link as RouterLink} from 'react-router-dom'

export default function TermsOfService() {
  const lastUpdated = 'May 18, 2026'

  return (
    <Box minH="100vh" bg="#FCFDFD" pb={20}>
      {/* Header */}
      <Box w="100%" pt={16} pb={8} px={10} borderBottom="1px solid rgba(226, 232, 240, 0.6)" bg="white">
        <Box maxW="800px" mx="auto" position="relative">
          <Flex
            align="center"
            gap={2}
            as={RouterLink}
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
            Terms of Service
          </Heading>
          <Text color="#718096" fontSize="sm" mt={2}>
            Last Updated: {lastUpdated}
          </Text>
        </Box>
      </Box>

      {/* Content */}
      <Box maxW="800px" mx="auto" px={10} pt={12}>
        <VStack align="stretch" spacing={8} color="#4A5568" lineHeight="tall">
          {/* AGREEMENT TO OUR LEGAL TERMS */}
          <Box>
            <Heading size="lg" color="#1A202C" mb={4}>
              AGREEMENT TO OUR LEGAL TERMS
            </Heading>
            <Text mb={4}>
              We are <strong>CarbonSense corp.</strong> ("<strong>Company</strong>," "<strong>we</strong>," "<strong>us</strong>," "
              <strong>our</strong>"), a company registered in the Philippines at Imus, Cavite 4103.
            </Text>
            <Text mb={4}>
              We operate the website{' '}
              <ChakraLink color="#3182ce" href="http://www.carbonsense.com" isExternal>
                http://www.carbonsense.com
              </ChakraLink>{' '}
              (the "<strong>Site</strong>"), the mobile application CarbonSense (the "<strong>App</strong>"), as well as any other related
              products and services that refer or link to these legal terms (the "<strong>Legal Terms</strong>") (collectively, the "
              <strong>Services</strong>").
            </Text>
            <Text mb={4}>
              CarbonSense is a Utility app used for tracking your Carbon Footprint through your daily activities, to help save the
              environment and make a big impact on nature. CarbonSense also provides an AI-generated summary of your total Carbon Footprint
              emissions and gives alternatives that will reduce your Footprint emissions.
            </Text>
            <Text mb={4}>
              You can contact us by email at{' '}
              <ChakraLink color="#3182ce" href="mailto:carbonsense@gmail.com">
                carbonsense@gmail.com
              </ChakraLink>{' '}
              or by mail to Imus, Cavite 4103, Philippines.
            </Text>
            <Text mb={4}>
              These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("
              <strong>you</strong>"), and CarbonSense corp., concerning your access to and use of the Services. You agree that by accessing
              the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE WITH ALL OF
              THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.
            </Text>
            <Text mb={4}>
              We will provide you with prior notice of any scheduled changes to the Services you are using. The modified Legal Terms will
              become effective upon posting or notifying you by email. By continuing to use the Services after the effective date of any
              changes, you agree to be bound by the modified terms.
            </Text>
            <Text>
              All users who are minors in the jurisdiction in which they reside (generally under the age of 18) must have the permission of,
              and be directly supervised by, their parent or guardian to use the Services.
            </Text>
          </Box>

          <Separator borderColor="#E2E8F0" />

          {/* TABLE OF CONTENTS */}
          <Box>
            <Heading size="md" color="#1A202C" mb={4}>
              TABLE OF CONTENTS
            </Heading>
            <VStack align="start" spacing={2}>
              <ChakraLink color="#3182ce" href="#services">
                1. OUR SERVICES
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#ip">
                2. INTELLECTUAL PROPERTY RIGHTS
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#userreps">
                3. USER REPRESENTATIONS
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#userreg">
                4. USER REGISTRATION
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#purchases">
                5. PURCHASES AND PAYMENT
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#software">
                6. SOFTWARE
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#prohibited">
                7. PROHIBITED ACTIVITIES
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#ugc">
                8. USER GENERATED CONTRIBUTIONS
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#license">
                9. CONTRIBUTION LICENSE
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#mobile">
                10. MOBILE APPLICATION LICENSE
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#sitemanage">
                11. SERVICES MANAGEMENT
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#terms">
                12. TERM AND TERMINATION
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#modifications">
                13. MODIFICATIONS AND INTERRUPTIONS
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#law">
                14. GOVERNING LAW
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#disputes">
                15. DISPUTE RESOLUTION
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#corrections">
                16. CORRECTIONS
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#disclaimer">
                17. DISCLAIMER
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#liability">
                18. LIMITATIONS OF LIABILITY
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#indemnification">
                19. INDEMNIFICATION
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#userdata">
                20. USER DATA
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#electronic">
                21. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#misc">
                22. MISCELLANEOUS
              </ChakraLink>
              <ChakraLink color="#3182ce" href="#contact">
                23. CONTACT US
              </ChakraLink>
            </VStack>
          </Box>

          {/* 1. OUR SERVICES */}
          <Box id="services" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              1. OUR SERVICES
            </Heading>
            <Text>
              The information provided when using the Services is not intended for distribution to or use by any person or entity in any
              jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any
              registration requirement within such jurisdiction or country.
            </Text>
          </Box>

          {/* 2. INTELLECTUAL PROPERTY RIGHTS */}
          <Box id="ip" pt={6}>
            <Heading size="md" color="#1A202C" mb={4}>
              2. INTELLECTUAL PROPERTY RIGHTS
            </Heading>
            <Heading size="sm" color="#2D3748" mb={2}>
              Our intellectual property
            </Heading>
            <Text mb={4}>
              We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases,
              functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the
              "Content"), as well as the trademarks, service marks, and logos contained therein (the "Marks").
            </Text>
            <Heading size="sm" color="#2D3748" mb={2}>
              Your use of our Services
            </Heading>
            <Text mb={2}>
              Subject to your compliance with these Legal Terms, including the "PROHIBITED ACTIVITIES" section below, we grant you a
              non-exclusive, non-transferable, revocable license to:
            </Text>

            {/* 🟢 FIXED: Using List.Root and List.Item compound tags */}
            <List.Root pl={5} mb={4} style={{listStyleType: 'disc'}}>
              <List.Item>access the Services; and</List.Item>
              <List.Item>download or print a copy of any portion of the Content to which you have properly gained access.</List.Item>
            </List.Root>

            <Heading size="sm" color="#2D3748" mb={2}>
              Your submissions
            </Heading>
            <Text mb={2}>
              By directly sending us any question, comment, suggestion, idea, feedback, or other information about the Services
              ("Submissions"), you agree to assign to us all intellectual property rights in such Submission.
            </Text>
          </Box>

          {/* 3. USER REPRESENTATIONS */}
          <Box id="userreps" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              3. USER REPRESENTATIONS
            </Heading>
            <Text>
              By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate,
              current, and complete; (2) you will maintain the accuracy of such information; (3) you have the legal capacity and agree to
              comply with these Legal Terms; (4) you are not a minor; (5) you will not access the Services through automated or non-human
              means; (6) you will not use the Services for any illegal or unauthorized purpose; and (7) your use of the Services will not
              violate any applicable law or regulation.
            </Text>
          </Box>

          {/* 4. USER REGISTRATION */}
          <Box id="userreg" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              4. USER REGISTRATION
            </Heading>
            <Text>
              You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for
              all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we
              determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
            </Text>
          </Box>

          {/* 5. PURCHASES AND PAYMENT */}
          <Box id="purchases" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              5. PURCHASES AND PAYMENT
            </Heading>
            <Text mb={2}>
              You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services.
              We may change prices at any time. We reserve the right to refuse any order placed through the Services.
            </Text>
          </Box>

          {/* 6. SOFTWARE */}
          <Box id="software" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              6. SOFTWARE
            </Heading>
            <Text>
              We may include software for use in connection with our Services. If such software is accompanied by an end user license
              agreement ("EULA"), the terms of the EULA will govern your use of the software.
            </Text>
          </Box>

          {/* 7. PROHIBITED ACTIVITIES */}
          <Box id="prohibited" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              7. PROHIBITED ACTIVITIES
            </Heading>
            <Text mb={3}>As a user of the Services, you agree not to:</Text>

            {/* 🟢 FIXED: Using List.Root and List.Item compound tags */}
            <List.Root pl={5} spacing={2} style={{listStyleType: 'disc'}}>
              <List.Item>
                Systematically retrieve data or other content from the Services to create or compile a collection, database, or directory
                without written permission.
              </List.Item>
              <List.Item>
                Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user
                passwords.
              </List.Item>
              <List.Item>Circumvent, disable, or otherwise interfere with security-related features of the Services.</List.Item>
              <List.Item>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</List.Item>
              <List.Item>Use any information obtained from the Services in order to harass, abuse, or harm another person.</List.Item>
              <List.Item>Use the Services in a manner inconsistent with any applicable laws or regulations.</List.Item>
              <List.Item>
                Upload or transmit viruses, Trojan horses, or other material that interferes with any party’s uninterrupted use of the
                Services.
              </List.Item>
              <List.Item>
                Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining
                robots.
              </List.Item>
              <List.Item>Attempt to impersonate another user or person or use the username of another user.</List.Item>
              <List.Item>Sell or otherwise transfer your profile.</List.Item>
              <List.Item>Deliberately sabotage the system's service/Trolling.</List.Item>
            </List.Root>
          </Box>

          {/* 8. USER GENERATED CONTRIBUTIONS */}
          <Box id="ugc" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              8. USER GENERATED CONTRIBUTIONS
            </Heading>
            <Text>
              The Services may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or
              broadcast content and materials ("Contributions"). You are solely responsible for ensuring these do not infringe on
              intellectual property rights, violate privacy, or contain offensive material.
            </Text>
          </Box>

          {/* 9. CONTRIBUTION LICENSE */}
          <Box id="license" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              9. CONTRIBUTION LICENSE
            </Heading>
            <Text>
              By submitting suggestions or other feedback regarding the Services, you agree that we can use and share such feedback for any
              purpose without compensation to you. We do not assert any ownership over your Contributions.
            </Text>
          </Box>

          {/* 10. MOBILE APPLICATION LICENSE */}
          <Box id="mobile" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              10. MOBILE APPLICATION LICENSE
            </Heading>
            <Text>
              If you access the Services via the App, we grant you a revocable, non-exclusive, non-transferable, limited right to install
              and use the App on wireless electronic devices owned or controlled by you strictly in accordance with the terms of this
              license.
            </Text>
          </Box>

          {/* 11. SERVICES MANAGEMENT */}
          <Box id="sitemanage" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              11. SERVICES MANAGEMENT
            </Heading>
            <Text>
              We reserve the right, but not the obligation, to: (1) monitor the Services for violations; (2) take appropriate legal action
              against anyone who violates the law or these Terms; and (3) otherwise manage the Services in a manner designed to protect our
              rights and property.
            </Text>
          </Box>

          {/* 12. TERM AND TERMINATION */}
          <Box id="terms" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              12. TERM AND TERMINATION
            </Heading>
            <Text>
              These Legal Terms shall remain in full force and effect while you use the Services. We reserve the right to deny access to and
              use of the Services to any person for any reason, including for breach of any representation contained in these terms.
            </Text>
          </Box>

          {/* 13. MODIFICATIONS AND INTERRUPTIONS */}
          <Box id="modifications" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              13. MODIFICATIONS AND INTERRUPTIONS
            </Heading>
            <Text>
              We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole
              discretion without notice. We cannot guarantee the Services will be available at all times.
            </Text>
          </Box>

          {/* 14. GOVERNING LAW */}
          <Box id="law" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              14. GOVERNING LAW
            </Heading>
            <Text>
              These Legal Terms shall be governed by and defined following the laws of the Philippines. CarbonSense corp. and yourself
              irrevocably consent that the courts of the Philippines shall have exclusive jurisdiction to resolve any dispute.
            </Text>
          </Box>

          {/* 15. DISPUTE RESOLUTION */}
          <Box id="disputes" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              15. DISPUTE RESOLUTION
            </Heading>
            <Text>
              Any dispute arising out of or in connection with these Legal Terms shall be finally resolved by binding arbitration. The seat
              of arbitration shall be Manila, Philippines, and the language of the proceedings shall be English.
            </Text>
          </Box>

          {/* 16 - 22: COMBINED MISC SECTIONS */}
          <Box id="corrections" pt={6}>
            <Heading size="md" color="#1A202C" mb={3}>
              16-22. DISCLAIMERS & MISCELLANEOUS
            </Heading>
            <Text mb={4}>
              <strong>16. CORRECTIONS:</strong> We reserve the right to correct any typographical errors, inaccuracies, or omissions on the
              Services without prior notice.
            </Text>
            <Text mb={4}>
              <strong>17. DISCLAIMER:</strong> THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE
              SERVICES WILL BE AT YOUR SOLE RISK.
            </Text>
            <Text mb={4}>
              <strong>18. LIMITATIONS OF LIABILITY:</strong> In no event will we be liable to you or any third party for any direct,
              indirect, consequential, or punitive damages arising from your use of the Services.
            </Text>
            <Text mb={4}>
              <strong>19. INDEMNIFICATION:</strong> You agree to defend, indemnify, and hold us harmless from and against any loss, damage,
              liability, or claim made by any third party due to your use of the Services.
            </Text>
            <Text mb={4}>
              <strong>20. USER DATA:</strong> We will maintain certain data that you transmit to the Services, but you are solely
              responsible for all data that you transmit.
            </Text>
            <Text mb={4}>
              <strong>21. ELECTRONIC COMMUNICATIONS:</strong> You consent to receive electronic communications, and you agree that all
              agreements and notices we provide to you electronically satisfy any legal requirement that such communication be in writing.
            </Text>
            <Text>
              <strong>22. MISCELLANEOUS:</strong> These Legal Terms constitute the entire agreement and understanding between you and us.
            </Text>
          </Box>

          {/* 23. CONTACT US */}
          <Box id="contact" pt={6} pb={10}>
            <Heading size="md" color="#1A202C" mb={3}>
              23. CONTACT US
            </Heading>
            <Text mb={2}>
              In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please
              contact us at:
            </Text>
            <Text fontWeight="bold" color="#2D3748">
              CarbonSense corp.
            </Text>
            <Text>Imus, Cavite 4103</Text>
            <Text>Philippines</Text>
            <Text mt={2}>
              <ChakraLink color="#3182ce" href="mailto:carbonsense@gmail.com">
                carbonsense@gmail.com
              </ChakraLink>
            </Text>
          </Box>

          <Separator borderColor="#E2E8F0" />

          <Box pb={8} pt={2} textAlign="center">
            <Text color="#A0AEC0" fontSize="xs">
              This Terms and Conditions was created using Termly's{' '}
              <ChakraLink href="https://termly.io/products/terms-and-conditions-generator/" isExternal textDecoration="underline">
                Terms and Conditions Generator
              </ChakraLink>
              .
            </Text>
          </Box>
        </VStack>
      </Box>
    </Box>
  )
}
