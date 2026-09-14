/* eslint-disable react-hooks/set-state-in-effect */
// pages/Home.jsx
import {useState, useEffect, useRef} from 'react'
import {supabase} from '../supabase'
import {Box, Heading, Text, Stack, Flex, Button, SimpleGrid, Center} from '@chakra-ui/react'
import {Link} from 'react-router-dom'
import {keyframes} from '@emotion/react'

// 🟢 Entry & Ambient Animation Definitions
const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-40px); }
  to { opacity: 1; transform: translateX(0); }
`

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

// Slow levitation for the hero cards
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`

// Slow drift for the background aurora glows
const auroraDrift = keyframes`
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
`

// 🟢 Reusable Live Number Roller Engine
const AnimatedNumber = ({value, suffix = ''}) => {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)
  const numericTarget = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0

  useEffect(() => {
    const startValue = prevValue.current
    if (startValue === numericTarget) {
      setDisplayValue(numericTarget)
      return
    }

    const duration = 1500
    let startTime
    let frameId

    const updateNumber = currentTime => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 4)

      setDisplayValue(startValue + (numericTarget - startValue) * easeOut)

      if (progress < 1) {
        frameId = requestAnimationFrame(updateNumber)
      } else {
        prevValue.current = numericTarget
      }
    }

    frameId = requestAnimationFrame(updateNumber)
    return () => cancelAnimationFrame(frameId)
  }, [value, numericTarget])

  const isK = String(value).includes('k')
  if (isNaN(numericTarget)) return <>{value}</>

  return (
    <>
      {isK ? displayValue.toFixed(1) : Math.round(displayValue)}
      {suffix || (isK ? 'k' : '')}
    </>
  )
}

export default function Home() {
  const [totalOffset, setTotalOffset] = useState(0)
  const [isKFormat, setIsKFormat] = useState(false)
  const [monthTrend, setMonthTrend] = useState(0)
  const [trendSign, setTrendSign] = useState('')
  const [trendColor, setTrendColor] = useState('#38A169')
  const [treesEquivalent, setTreesEquivalent] = useState(0)

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const {data: logs, error} = await supabase.from('activity_logs').select('total_co2e, logged_at')

        if (error) throw error

        const totalCO2 = logs?.reduce((sum, log) => sum + Number(log.total_co2e), 0) || 0
        setTreesEquivalent(Math.max(1, Math.round(totalCO2 / 22)))

        if (totalCO2 >= 1000) {
          setTotalOffset(totalCO2 / 1000)
          setIsKFormat(true)
        } else {
          setTotalOffset(totalCO2)
          setIsKFormat(false)
        }

        const now = new Date()
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()

        let thisMonthSum = 0
        let lastMonthSum = 0

        logs?.forEach(log => {
          const logDate = new Date(log.logged_at)
          const logMonth = logDate.getMonth()
          const logYear = logDate.getFullYear()

          if (logYear === thisYear && logMonth === thisMonth) {
            thisMonthSum += Number(log.total_co2e)
          } else if ((logYear === thisYear && logMonth === thisMonth - 1) || (logYear === thisYear - 1 && thisMonth === 0 && logMonth === 11)) {
            lastMonthSum += Number(log.total_co2e)
          }
        })

        if (lastMonthSum === 0 && thisMonthSum > 0) {
          setMonthTrend(100)
          setTrendSign('+')
          setTrendColor('#E53E3E')
        } else if (lastMonthSum === 0 && thisMonthSum === 0) {
          setMonthTrend(0)
          setTrendSign('')
          setTrendColor('#718096')
        } else {
          const diff = thisMonthSum - lastMonthSum
          const percentChange = (diff / lastMonthSum) * 100

          setTrendSign(percentChange > 0 ? '+' : '')
          setMonthTrend(Math.abs(Math.round(percentChange)))
          setTrendColor(percentChange <= 0 ? '#38A169' : '#E53E3E')
        }
      } catch (error) {
        console.error('Error fetching live home stats:', error)
      }
    }

    fetchLiveStats()
  }, [])

  return (
    <Box minH="100vh" bg="#F4F9F5" backgroundImage="url('https://www.transparenttextures.com/patterns/cubes.png')" backgroundBlendMode="multiply" pb={20} overflowX="hidden" position="relative">
      {/* 🌿 Ambient Glows */}
      <Box
        position="absolute"
        top="-5%"
        left="-10%"
        w={{base: '350px', md: '700px'}}
        h={{base: '350px', md: '700px'}}
        bgGradient="radial(#48BB78 0%, transparent 65%)"
        opacity="0.15"
        borderRadius="full"
        zIndex={0}
        pointerEvents="none"
        animation={`${auroraDrift} 20s ease-in-out infinite alternate`}
      />
      <Box
        position="absolute"
        bottom="0%"
        right="-10%"
        w={{base: '350px', md: '650px'}}
        h={{base: '350px', md: '650px'}}
        bgGradient="radial(#319795 0%, transparent 65%)"
        opacity="0.12"
        borderRadius="full"
        zIndex={0}
        pointerEvents="none"
        animation={`${auroraDrift} 25s ease-in-out infinite alternate-reverse`}
      />

      {/* 🟢 Hero Section */}
      <Box maxW="1200px" mx="auto" px={{base: 4, sm: 6, md: 10}} pt={{base: 12, md: 32}} pb={{base: 6, md: 20}} position="relative" zIndex={1}>
        <Stack direction={{base: 'column', md: 'row'}} spacing={{base: 10, md: 16}} align="center">
          {/* Left Side: Main Typography & Call-To-Action */}
          <Box flex="1" w="100%" animation={`${slideInLeft} 0.8s cubic-bezier(0.16, 1, 0.3, 1) both`}>
            <Heading size={{base: '2xl', md: '3xl'}} color="#1C4532" letterSpacing="tighter" lineHeight="1.1" mb={6}>
              Track your impact. <br />
              <Text as="span" color="#38A169">
                Shape the future.
              </Text>
            </Heading>
            <Text fontSize={{base: 'lg', md: 'xl'}} color="#4A5568" mb={8} maxW="400px" lineHeight="tall">
              A clean, data-driven approach to understanding and reducing your daily carbon footprint in real-time.
            </Text>
            <Flex gap={4} wrap="wrap">
              <Button
                as={Link}
                to="/tracker"
                size="lg"
                flex={{base: '1', sm: 'initial'}}
                bg="#22543D"
                color="white"
                borderRadius="xl"
                px={8}
                boxShadow="0 10px 20px rgba(34, 84, 61, 0.15)"
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{bg: '#1C4532', transform: 'translateY(-3px)', boxShadow: '0 15px 30px rgba(34, 84, 61, 0.25)'}}
                _active={{transform: 'translateY(0)'}}
              >
                My Tracker
              </Button>
              <Button
                as={Link}
                to="/dashboard"
                size="lg"
                flex={{base: '1', sm: 'initial'}}
                bg="white"
                color="#22543D"
                border="2px solid #C6F6D5"
                borderRadius="xl"
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  bg: '#F0FFF4',
                  borderColor: '#9AE6B4',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 10px 20px rgba(72, 187, 120, 0.1)'
                }}
                _active={{transform: 'translateY(0)'}}
              >
                Global Stats
              </Button>
            </Flex>
          </Box>

          {/* Right Side: Floating Live Stat Cards (Now Visible & Fully Responsive) */}
          <Box flex="1" w="100%" mt={{base: 6, md: 0}} position="relative" animation={`${slideInRight} 0.8s cubic-bezier(0.16, 1, 0.3, 1) both`}>
            {/* Background Blob (Only displayed on tablet/desktop to avoid layout clashing) */}
            <Box
              display={{base: 'none', md: 'block'}}
              w="450px"
              h="450px"
              bg="linear-gradient(135deg, #C6F6D5 0%, #81E6D9 100%)"
              borderRadius="40% 60% 70% 30% / 40% 50% 60% 50%"
              position="absolute"
              top="-30px"
              right="-20px"
              zIndex={0}
              opacity="0.7"
              animation={`${auroraDrift} 15s ease-in-out infinite alternate`}
            />
            {/* Cards Flex Container: Disable float on base, enable on md */}
            <Flex direction="column" gap={{base: 4, md: 6}} position="relative" zIndex={1} animation={`${float} 6s ease-in-out infinite`}>
              {/* Monthly Trend Box */}
              <Box
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                p={{base: 6, md: 8}}
                borderRadius="3xl"
                boxShadow="0 25px 50px -12px rgba(28, 69, 50, 0.12)"
                border="1px solid rgba(72, 187, 120, 0.2)"
                w={{base: '100%', md: '85%'}}
                ml="auto"
                transition="all 0.3s ease"
                _hover={{transform: 'scale(1.02)', boxShadow: '0 30px 60px -12px rgba(28, 69, 50, 0.18)'}}
              >
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="xs" color="#4A5568" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                    Monthly Trend
                  </Text>
                  <Box px={2.5} py={1} bg={trendColor === '#38A169' ? '#F0FFF4' : '#FFF5F5'} borderRadius="md" border="1px solid" borderColor={trendColor === '#38A169' ? '#9AE6B4' : '#FEB2B2'}>
                    <Text fontSize="xs" fontWeight="black" color={trendColor}>
                      {trendColor === '#38A169' ? '↓ REDUCTION' : '↑ INCREASE'}
                    </Text>
                  </Box>
                </Flex>
                <Text fontSize={{base: '4xl', md: '5xl'}} fontWeight="black" color={trendColor} lineHeight="1">
                  {trendSign}
                  <AnimatedNumber value={monthTrend} suffix="%" />
                </Text>
              </Box>

              {/* Community Impact Box */}
              <Box
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                p={{base: 6, md: 8}}
                borderRadius="3xl"
                boxShadow="0 25px 50px -12px rgba(28, 69, 50, 0.12)"
                border="1px solid rgba(72, 187, 120, 0.2)"
                w={{base: '100%', md: '90%'}}
                transition="all 0.3s ease"
                _hover={{transform: 'scale(1.02)', boxShadow: '0 30px 60px -12px rgba(28, 69, 50, 0.18)'}}
              >
                <Flex align="center" gap={3} mb={4}>
                  <Center w="8" h="8" bg="#F0FFF4" color="#38A169" borderRadius="full" fontSize="sm">
                    🌍
                  </Center>
                  <Text fontSize="xs" color="#4A5568" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                    Total Community Impact
                  </Text>
                </Flex>
                <Text fontSize={{base: '4xl', md: '5xl'}} fontWeight="black" color="#1C4532" lineHeight="1">
                  <AnimatedNumber value={totalOffset} suffix={isKFormat ? 'k' : ''} />{' '}
                  <Text as="span" fontSize={{base: 'xl', md: '2xl'}} color="#718096">
                    kg
                  </Text>
                </Text>
                <Box mt={6} p={4} bg="#F4F9F5" borderRadius="xl" border="1px dashed #9AE6B4">
                  <Text fontSize="sm" color="#2F855A" fontWeight="medium">
                    <Text as="span" fontSize="lg" mr={2}>
                      🌳
                    </Text>
                    Equivalent to planting{' '}
                    <Text as="span" fontWeight="black" color="#22543D">
                      <AnimatedNumber value={treesEquivalent} /> {treesEquivalent === 1 ? 'tree' : 'trees'}
                    </Text>{' '}
                    this year.
                  </Text>
                </Box>
              </Box>
            </Flex>
          </Box>
        </Stack>
      </Box>

      {/* 🟢 Premium Feature Cards Section */}
      <Box maxW="1200px" mx="auto" px={{base: 4, sm: 6, md: 10}} mt={{base: 2, md: 10}} position="relative" zIndex={1} animation={`${fadeIn} 0.8s ease-out 0.3s both`}>
        <Box borderTop="2px solid #E2E8F0" pt={{base: 10, md: 16}}>
          <SimpleGrid columns={{base: 1, md: 2}} gap={{base: 6, md: 16}}>
            <Box
              role="group"
              cursor="pointer"
              p={{base: 6, md: 8}}
              bg="white"
              border="1px solid #E2E8F0"
              borderRadius="2xl"
              transition="all 0.3s"
              _hover={{
                bg: '#F4F9F5',
                borderColor: '#9AE6B4',
                transform: 'translateY(-5px)',
                boxShadow: '0 20px 40px -10px rgba(72, 187, 120, 0.15)'
              }}
            >
              <Flex align="center" gap={4} mb={6}>
                <Center w="12" h="12" bg="#F0FFF4" color="#38A169" borderRadius="full" transition="all 0.3s" _groupHover={{bg: '#38A169', color: 'white'}}>
                  🍃
                </Center>
                <Heading size="md" color="#1C4532">
                  Personal Accountability
                </Heading>
              </Flex>
              <Text color="#4A5568" fontSize={{base: 'md', md: 'lg'}} lineHeight="tall">
                Log your daily transport, diet, and energy use. Watch your personal tracker adapt in real-time to help you stay under your monthly carbon ceiling.
              </Text>
            </Box>
            <Box
              role="group"
              cursor="pointer"
              p={{base: 6, md: 8}}
              bg="white"
              border="1px solid #E2E8F0"
              borderRadius="2xl"
              transition="all 0.3s"
              _hover={{
                bg: '#E6FFFA',
                borderColor: '#81E6D9',
                transform: 'translateY(-5px)',
                boxShadow: '0 20px 40px -10px rgba(49, 151, 149, 0.15)'
              }}
            >
              <Flex align="center" gap={4} mb={6}>
                <Center w="12" h="12" bg="#E6FFFA" color="#319795" borderRadius="full" transition="all 0.3s" _groupHover={{bg: '#319795', color: 'white'}}>
                  🤝
                </Center>
                <Heading size="md" color="#1C4532">
                  Community Intelligence
                </Heading>
              </Flex>
              <Text color="#4A5568" fontSize={{base: 'md', md: 'lg'}} lineHeight="tall">
                Zoom out to the global dashboard. See how your efforts combine with hundreds of other users to create massive, measurable environmental change.
              </Text>
            </Box>
          </SimpleGrid>
        </Box>
      </Box>
    </Box>
  )
}
