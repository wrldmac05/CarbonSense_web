// pages/GetApp.jsx
import {Box, Heading, Text, Flex, Grid, GridItem, VStack, Stack, Center, Button, Badge, Image} from '@chakra-ui/react'
import {Link} from 'react-router-dom'
import {keyframes} from '@emotion/react'
import carbonSenseHero from '../assets/CarbonSense.png'

// 🟢 Custom Motion Frames
const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
`

const slideInRight = keyframes`
  from { opacity: 0; transform: translate(30px, 20px) rotate(0deg); }
  to { opacity: 1; transform: translate(0, 0) rotate(-5deg); }
`

const gridFadeUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`

// Slow drift for the background aurora glows
const auroraDrift = keyframes`
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
`

export default function GetApp() {
  return (
    <Box minH="100vh" bg="#F4F9F5" backgroundImage="url('https://www.transparenttextures.com/patterns/cubes.png')" backgroundBlendMode="multiply" position="relative" overflow="hidden" pb={{base: 12, md: 24}}>
      {/* 🌿 Background Glows */}
      <Box position="absolute" top="-10%" left="-5%" w={{base: '350px', md: '700px'}} h={{base: '350px', md: '700px'}} bgGradient="radial(#48BB78 0%, transparent 65%)" opacity="0.15" borderRadius="full" pointerEvents="none" />
      <Box position="absolute" top="20%" right="-5%" w={{base: '350px', md: '700px'}} h={{base: '350px', md: '700px'}} bgGradient="radial(#319795 0%, transparent 65%)" opacity="0.12" borderRadius="full" pointerEvents="none" />

      <Box position="relative" zIndex={1}>
        {/* 🟢 Header Section */}
        <Box
          w="100%"
          pt={{base: 12, md: 16}}
          pb={{base: 6, md: 8}}
          px={{base: 4, sm: 6, md: 10}}
          borderBottom="1px solid rgba(72, 187, 120, 0.2)"
          bg="rgba(244, 249, 245, 0.6)"
          backdropFilter="blur(12px)"
          animation={`${slideDown} 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`}
        >
          <Box maxW="1200px" mx="auto" position="relative">
            <Flex align="center" gap={2} as={Link} to="/" position="absolute" top={{base: '-32px', md: '-40px'}} left="0" transition="all 0.2s" _hover={{opacity: 0.7, transform: 'translateX(-4px)'}}>
              <Text fontSize="lg" color="#1C4532">
                ←
              </Text>
              <Text fontWeight="bold" color="#1C4532" fontSize="sm">
                Back to Home
              </Text>
            </Flex>

            <Flex justify="space-between" align={{base: 'flex-start', md: 'flex-end'}} direction={{base: 'column', md: 'row'}} gap={6}>
              <Box>
                <Flex align="center" gap={3}>
                  <Text color="#276749" fontWeight="bold" letterSpacing="widest" fontSize="xs" textTransform="uppercase">
                    Mobile Ecosystem
                  </Text>
                  <Badge bg="#E6FFFA" color="#234E52" px={2} py={0.5} borderRadius="md" border="1px solid #9AE6B4">
                    In Development
                  </Badge>
                </Flex>
                <Heading size={{base: 'xl', md: '2xl'}} color="#1C4532" mt={2} letterSpacing="tighter">
                  Get the App
                </Heading>
                <Text color="#4A5568" fontSize={{base: 'sm', md: 'md'}} mt={2} maxW="500px" lineHeight="tall">
                  The ultimate daily companion for your carbon-neutral journey. Log activities, complete challenges, and track your streak on the go.
                </Text>
              </Box>
            </Flex>
          </Box>
        </Box>

        {/* 🟢 Main Landing Area */}
        <Box maxW="1200px" mx="auto" px={{base: 4, sm: 6, md: 10}} pt={{base: 8, md: 16}}>
          <Grid templateColumns={{base: '1fr', lg: '1fr 1fr'}} gap={{base: 10, lg: 16}} alignItems="center">
            {/* Left Side: Copy and Buttons */}
            <GridItem animation={`${slideInLeft} 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both`}>
              <VStack align="flex-start" spacing={{base: 6, md: 8}}>
                <Box>
                  <Heading size={{base: '2xl', md: '3xl'}} color="#1C4532" letterSpacing="tighter" lineHeight="1.1" mb={4}>
                    CarbonSense <br />
                    <Text as="span" color="#38A169">
                      in your pocket.
                    </Text>
                  </Heading>
                  <Text fontSize={{base: 'md', md: 'lg'}} color="#4A5568" lineHeight="tall" maxW="450px">
                    We designed the mobile app to be your real-time logging tool. Complete your personalized daily challenges and let the app instantly sync your reductions back to your global web dashboard.
                  </Text>
                </Box>

                {/* App Download Buttons */}
                <Stack direction={{base: 'column', sm: 'row'}} spacing={4} pt={2} w="100%">
                  <Button
                    as="a"
                    href="/CarbonSense.apk"
                    download="CarbonSense.apk"
                    h="60px"
                    w={{base: '100%', sm: 'auto'}}
                    px={8}
                    bg="#22543D"
                    color="white"
                    borderRadius="xl"
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    boxShadow="0 8px 20px rgba(34, 84, 61, 0.15)"
                    _hover={{
                      bg: '#1C4532',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 12px 25px rgba(34, 84, 61, 0.25)',
                      textDecoration: 'none'
                    }}
                    _active={{transform: 'translateY(-1px)'}}
                    display="flex"
                    flexDirection="column"
                    alignItems={{base: 'center', sm: 'flex-start'}}
                    justifyContent="center"
                  >
                    <Text fontSize="xs" color="#9AE6B4" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
                      Download for Android
                    </Text>
                    <Text fontSize="lg" fontWeight="black" mt="-1">
                      Get the APK
                    </Text>
                  </Button>

                  <Button
                    h="60px"
                    w={{base: '100%', sm: 'auto'}}
                    px={8}
                    bg="rgba(255, 255, 255, 0.9)"
                    backdropFilter="blur(10px)"
                    color="#1C4532"
                    border="2px solid rgba(72, 187, 120, 0.3)"
                    borderRadius="xl"
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      bg: '#F0FFF4',
                      borderColor: '#48BB78',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 15px rgba(72, 187, 120, 0.1)'
                    }}
                    _active={{transform: 'translateY(-1px)'}}
                    display="flex"
                    flexDirection="column"
                    alignItems={{base: 'center', sm: 'flex-start'}}
                    justifyContent="center"
                  >
                    <Text fontSize="xs" color="#4A5568" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
                      Coming soon to
                    </Text>
                    <Text fontSize="lg" fontWeight="black" mt="-1">
                      App Store
                    </Text>
                  </Button>
                </Stack>

                <Flex align="center" gap={3} pt={2}>
                  <Box w="8px" h="8px" bg="#38A169" borderRadius="full" animation="pulse 2s infinite" />
                  <Text fontSize="sm" color="#4A5568" fontWeight="bold">
                    Flutter Mobile App currently in development
                  </Text>
                </Flex>
              </VStack>
            </GridItem>

            {/* Right Side: Phone Mockup Showcase */}
            <GridItem animation={`${slideInRight} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both`}>
              <Center position="relative">
                {/* Organic Background Morphing Blob */}
                <Box
                  position="absolute"
                  w={{base: '300px', md: '450px'}}
                  h={{base: '300px', md: '450px'}}
                  bg="linear-gradient(135deg, #C6F6D5 0%, #81E6D9 100%)"
                  borderRadius="40% 60% 70% 30% / 40% 50% 60% 50%"
                  opacity="0.6"
                  zIndex={0}
                  animation={`${auroraDrift} 15s ease-in-out infinite alternate`}
                />

                {/* The Phone Mockup */}
                <Box
                  position="relative"
                  zIndex={1}
                  w={{base: '260px', sm: '280px', md: '320px'}}
                  h={{base: '540px', sm: '580px', md: '650px'}}
                  bg="#000000"
                  borderRadius="3rem"
                  border="12px solid #1C2723"
                  boxShadow="2xl"
                  overflow="hidden"
                  transform={{base: 'rotate(0deg)', md: 'rotate(-5deg)'}}
                  transition="all 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
                  _hover={{transform: 'rotate(0deg) scale(1.02)', boxShadow: '0 25px 50px -12px rgba(28, 69, 50, 0.3)'}}
                >
                  <Box w="100%" h="100%">
                    <Image src={carbonSenseHero} alt="CarbonSense Mobile App" w="100%" h="100%" objectFit="cover" borderBottomRadius="2.2rem" />
                  </Box>
                </Box>
              </Center>
            </GridItem>
          </Grid>

          {/* 🟢 Features Grid */}
          <Box pt={{base: 12, md: 24}} pb={10} animation={`${gridFadeUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both`}>
            <Text textAlign="center" color="#276749" fontWeight="bold" letterSpacing="widest" fontSize="xs" textTransform="uppercase" mb={2}>
              Mobile Exclusives
            </Text>
            <Heading textAlign="center" size={{base: 'lg', md: 'xl'}} color="#1C4532" letterSpacing="tight" mb={{base: 8, md: 12}}>
              Why download the app?
            </Heading>

            <Grid templateColumns={{base: '1fr', md: 'repeat(3, 1fr)'}} gap={{base: 4, md: 8}}>
              {/* Feature 1 */}
              <Box
                p={{base: 5, md: 8}}
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                borderRadius="2xl"
                border="1px solid rgba(72, 187, 120, 0.2)"
                boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
                role="group"
                cursor="pointer"
                transition="all 0.25s ease"
                _hover={{borderColor: '#38A169', transform: 'translateY(-4px)', boxShadow: '0 15px 30px -5px rgba(28, 69, 50, 0.15)'}}
              >
                <Box
                  w="12"
                  h="12"
                  bg="#F0FFF4"
                  color="#38A169"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                  mb={6}
                  transition="transform 0.2s"
                  border="1px solid #C6F6D5"
                  _groupHover={{transform: 'scale(1.1) rotate(5deg)'}}
                >
                  ⚡
                </Box>
                <Heading size="md" color="#1C4532" mb={3}>
                  Lightning Fast Logging
                </Heading>
                <Text color="#4A5568" fontSize={{base: 'sm', md: 'md'}} lineHeight="tall">
                  Don't wait until you get home. Log your transit, meals, and energy use in exactly 3 taps right when they happen.
                </Text>
              </Box>

              {/* Feature 2 */}
              <Box
                p={{base: 5, md: 8}}
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                borderRadius="2xl"
                border="1px solid rgba(72, 187, 120, 0.2)"
                boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
                role="group"
                cursor="pointer"
                transition="all 0.25s ease"
                _hover={{borderColor: '#319795', transform: 'translateY(-4px)', boxShadow: '0 15px 30px -5px rgba(49, 151, 149, 0.15)'}}
              >
                <Box
                  w="12"
                  h="12"
                  bg="#E6FFFA"
                  color="#319795"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                  mb={6}
                  transition="transform 0.2s"
                  border="1px solid #B2F5EA"
                  _groupHover={{transform: 'scale(1.1) rotate(5deg)'}}
                >
                  🎯
                </Box>
                <Heading size="md" color="#1C4532" mb={3}>
                  Complete Smart Tasks
                </Heading>
                <Text color="#4A5568" fontSize={{base: 'sm', md: 'md'}} lineHeight="tall">
                  Your personalized daily challenges live on the mobile app. Check them off as you complete them to instantly lower your net footprint.
                </Text>
              </Box>

              {/* Feature 3 */}
              <Box
                p={{base: 5, md: 8}}
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                borderRadius="2xl"
                border="1px solid rgba(72, 187, 120, 0.2)"
                boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
                role="group"
                cursor="pointer"
                transition="all 0.25s ease"
                _hover={{borderColor: '#D69E2E', transform: 'translateY(-4px)', boxShadow: '0 15px 30px -5px rgba(214, 158, 46, 0.15)'}}
              >
                <Box
                  w="12"
                  h="12"
                  bg="#FEFCBF"
                  color="#D69E2E"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                  mb={6}
                  transition="transform 0.2s"
                  border="1px solid #F6E05E"
                  _groupHover={{transform: 'scale(1.1) rotate(5deg)'}}
                >
                  🔥
                </Box>
                <Heading size="md" color="#1C4532" mb={3}>
                  Build Your Streak
                </Heading>
                <Text color="#4A5568" fontSize={{base: 'sm', md: 'md'}} lineHeight="tall">
                  Enable push notifications to get gentle daily reminders. Build a long-lasting habit and maintain your daily logging streak.
                </Text>
              </Box>
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* Global CSS for the pulsing dot animation */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(56, 161, 105, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(56, 161, 105, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(56, 161, 105, 0); }
          }
        `}
      </style>
    </Box>
  )
}
