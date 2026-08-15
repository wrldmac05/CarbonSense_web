// pages/Dashboard.jsx
import {useState, useEffect, useRef} from 'react'
import {Box, Heading, Text, Flex, Grid, VStack, Center, Spinner, Button, useBreakpointValue} from '@chakra-ui/react'
import {Link} from 'react-router-dom'
import {supabase} from '../supabase'
import {AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts'
import {keyframes} from '@emotion/react'

// 🟢 Unified Layout Entry Transitions
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(25px); }
  to { opacity: 1; transform: translateY(0); }
`

const alertPop = keyframes`
  from { opacity: 0; transform: scale(0.97) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`

// 🟢 Reusable Live Number Rolling Engine
const AnimatedNumber = ({value, decimals = 0}) => {
  const [displayValue, setDisplayValue] = useState(parseFloat(value) || 0)
  const prevValue = useRef(parseFloat(value) || 0)

  useEffect(() => {
    const target = parseFloat(value) || 0
    const startValue = prevValue.current

    if (startValue === target) {
      setDisplayValue(target)
      return
    }

    const duration = 1200
    let startTime
    let frameId

    const updateNumber = currentTime => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)

      setDisplayValue(startValue + (target - startValue) * easeOut)

      if (progress < 1) {
        frameId = requestAnimationFrame(updateNumber)
      } else {
        prevValue.current = target
      }
    }

    frameId = requestAnimationFrame(updateNumber)
    return () => cancelAnimationFrame(frameId)
  }, [value])

  return <>{displayValue.toFixed(decimals)}</>
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [aiInsight, setAiInsight] = useState('')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCO2: 0,
    avgTarget: 0,
    monthlyUsers: [],
    monthlyEmissions: [],
    categoryData: [],
    diets: {},
    commutes: {},
    locations: {}
  })

  // Responsive values for Pie Chart sizing across devices
  const isMobile = useBreakpointValue({base: true, md: false})
  const innerRadius = useBreakpointValue({base: 50, md: 80})
  const outerRadius = useBreakpointValue({base: 80, md: 120})

  const COLORS = ['#38A169', '#319795', '#2B6CB0', '#D69E2E', '#E53E3E']

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        setIsLoading(true)

        // 1. Fetch AI Insight
        const {data: insightData, error: insightError} = await supabase.from('global_insights').select('insight_text').order('created_at', {ascending: false}).limit(1).maybeSingle()

        if (insightError) {
          console.error('Error fetching global insight:', insightError.message)
        } else if (insightData) {
          setAiInsight(insightData.insight_text)
        }

        // 2. Invoke Secure Edge Function
        const {data, error} = await supabase.functions.invoke('get-global-stats')

        if (error) {
          console.error('Failed to fetch from Edge Function:', error.message)
          return
        }

        // 3. Set state using payload
        if (data) {
          setStats({
            totalUsers: data.totalUsers || 0,
            totalCO2: data.totalCO2 || 0,
            avgTarget: data.avgTarget || 0,
            monthlyUsers: data.monthlyUsers || [],
            monthlyEmissions: data.monthlyEmissions || [],
            categoryData: data.categoryData || [],
            diets: data.diets || {},
            commutes: data.commutes || {},
            locations: data.locations || {}
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGlobalData()
  }, [])

  if (isLoading) {
    return (
      <Center minH="100vh" bg="#FCFDFD" flexDirection="column" gap={4}>
        <Spinner size="xl" color="#38A169" thickness="4px" />
        <Text color="#718096" fontWeight="bold">
          Compiling Global Data...
        </Text>
      </Center>
    )
  }

  const renderCountBar = (label, count, total) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0
    return (
      <Box key={label} w="100%">
        <Flex justify="space-between" mb={1}>
          <Text fontSize="xs" fontWeight="bold" color="#4A5568">
            {label}
          </Text>
          <Text fontSize="xs" color="#718096" fontWeight="bold">
            {percentage}%{' '}
            <Text as="span" fontSize="2xs" fontWeight="normal">
              ({count})
            </Text>
          </Text>
        </Flex>
        <Box w="100%" h="6px" bg="#EDF2F7" borderRadius="full" overflow="hidden">
          <Box h="100%" w={`${percentage}%`} bg="#319795" transition="width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)" />
        </Box>
      </Box>
    )
  }

  const getTop5 = dataObj =>
    Object.entries(dataObj)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

  return (
    <Box minH="100vh" bg="#F4F9F5" backgroundImage="url('https://www.transparenttextures.com/patterns/cubes.png')" backgroundBlendMode="multiply" position="relative" overflow="hidden" pb={{base: 12, md: 20}}>
      {/* Background Glows */}
      <Box position="absolute" top="-10%" left="-5%" w={{base: '350px', md: '700px'}} h={{base: '350px', md: '700px'}} bgGradient="radial(#48BB78 0%, transparent 65%)" opacity="0.15" borderRadius="full" pointerEvents="none" />
      <Box position="absolute" bottom="-10%" right="-5%" w={{base: '350px', md: '700px'}} h={{base: '350px', md: '700px'}} bgGradient="radial(#319795 0%, transparent 65%)" opacity="0.12" borderRadius="full" pointerEvents="none" />

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
          animation={`${slideUp} 0.5s ease-out both`}
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
                <Text color="#276749" fontWeight="bold" letterSpacing="widest" fontSize="xs" textTransform="uppercase">
                  Community
                </Text>
                <Heading size={{base: 'xl', md: '2xl'}} color="#1C4532" mt={2} letterSpacing="tighter">
                  Global Impact
                </Heading>
                <Text color="#4A5568" fontSize={{base: 'sm', md: 'md'}} mt={2} maxW="600px">
                  Real-time analytics aggregating the anonymized emission logs and demographics of all users worldwide.
                </Text>
              </Box>

              <Flex w={{base: '100%', sm: 'auto'}} bg="#E6FFFA" p={1.5} borderRadius="xl" border="1px solid #9AE6B4" boxShadow="inset 0 2px 4px rgba(28, 69, 50, 0.05)">
                <Button
                  flex={{base: '1', sm: 'initial'}}
                  as={Link}
                  to="/tracker"
                  bg="transparent"
                  color="#2F855A"
                  _hover={{color: '#1C4532', bg: 'rgba(255, 255, 255, 0.6)'}}
                  borderRadius="lg"
                  px={{base: 3, md: 6}}
                  size={{base: 'sm', md: 'md'}}
                  fontWeight="bold"
                  transition="all 0.2s"
                >
                  My Tracker
                </Button>
                <Button flex={{base: '1', sm: 'initial'}} bg="white" color="#1C4532" boxShadow="sm" borderRadius="lg" px={{base: 3, md: 6}} size={{base: 'sm', md: 'md'}} fontWeight="bold" pointerEvents="none">
                  Global Dashboard
                </Button>
              </Flex>
            </Flex>
          </Box>
        </Box>

        {/* 🟢 Main Dashboard Content */}
        <Box maxW="1200px" mx="auto" px={{base: 4, sm: 6, md: 10}} pt={{base: 6, md: 10}}>
          {/* Executive AI Summary Briefing Card */}
          {aiInsight && (
            <Box
              mb={{base: 6, md: 10}}
              p={{base: 5, md: 6}}
              bg="linear-gradient(135deg, rgba(240, 255, 244, 0.9) 0%, rgba(230, 255, 250, 0.9) 100%)"
              backdropFilter="blur(10px)"
              border="1px solid #9AE6B4"
              borderRadius="2xl"
              boxShadow="0 10px 30px -5px rgba(49, 151, 149, 0.1)"
              position="relative"
              overflow="hidden"
              animation={`${alertPop} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`}
            >
              <Box position="absolute" top="-20px" right="-20px" w="100px" h="100px" bg="#38A169" opacity="0.15" filter="blur(20px)" borderRadius="full" />
              <Text fontSize="sm" color="#234E52" fontWeight="black" textTransform="uppercase" letterSpacing="wider" mb={2} display="flex" alignItems="center" gap={2}>
                <Text as="span" fontSize="lg">
                  ✨
                </Text>{' '}
                Executive AI Summary
              </Text>
              <Text color="#1C4532" fontSize={{base: 'md', md: 'lg'}} lineHeight="tall" fontWeight="medium">
                {aiInsight}
              </Text>
            </Box>
          )}

          {/* Rolling Stats Summary Grid Row */}
          <Grid templateColumns={{base: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)'}} gap={{base: 4, md: 6}} mb={{base: 6, md: 10}} animation={`${slideUp} 0.5s ease-out 0.1s both`}>
            <Box p={{base: 5, md: 8}} bg="#1C4532" borderRadius="2xl" boxShadow="0 15px 35px -10px rgba(28, 69, 50, 0.4)" transition="transform 0.2s" _hover={{transform: 'translateY(-2px)'}}>
              <Text color="#9AE6B4" fontSize="xs" fontWeight="bold" textTransform="uppercase" mb={2}>
                Total Eco Warriors
              </Text>
              <Heading color="white" size={{base: 'xl', md: '2xl'}}>
                <AnimatedNumber value={stats.totalUsers} decimals={0} />
              </Heading>
            </Box>
            <Box
              p={{base: 5, md: 8}}
              bg="rgba(255, 255, 255, 0.9)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(72, 187, 120, 0.2)"
              borderRadius="2xl"
              boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
              transition="transform 0.2s"
              _hover={{transform: 'translateY(-2px)'}}
            >
              <Text color="#4A5568" fontSize="xs" fontWeight="bold" textTransform="uppercase" mb={2}>
                Total CO₂ Tracked
              </Text>
              <Heading color="#1C4532" size={{base: 'xl', md: '2xl'}}>
                <AnimatedNumber value={stats.totalCO2} decimals={1} />{' '}
                <Text as="span" fontSize={{base: 'md', md: 'lg'}} color="#319795">
                  kg
                </Text>
              </Heading>
            </Box>
            <Box
              p={{base: 5, md: 8}}
              bg="rgba(255, 255, 255, 0.9)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(72, 187, 120, 0.2)"
              borderRadius="2xl"
              boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
              transition="transform 0.2s"
              _hover={{transform: 'translateY(-2px)'}}
              gridColumn={{base: 'span 1', sm: 'span 2', md: 'span 1'}}
            >
              <Text color="#4A5568" fontSize="xs" fontWeight="bold" textTransform="uppercase" mb={2}>
                Avg Monthly Target
              </Text>
              <Heading color="#1C4532" size={{base: 'xl', md: '2xl'}}>
                <AnimatedNumber value={stats.avgTarget} decimals={0} />{' '}
                <Text as="span" fontSize={{base: 'md', md: 'lg'}} color="#718096">
                  kg
                </Text>
              </Heading>
            </Box>
          </Grid>

          {/* Recharts Analytics Charts Section Block */}
          <Box mb={{base: 6, md: 10}} animation={`${slideUp} 0.5s ease-out 0.2s both`}>
            <Text color="#1C4532" fontWeight="black" fontSize="xl" letterSpacing="tight" mb={6}>
              Platform Trends
            </Text>
            <Grid templateColumns={{base: '1fr', lg: 'repeat(2, 1fr)'}} gap={{base: 6, md: 8}}>
              {/* Cumulative Users LineChart */}
              <Box
                p={{base: 4, md: 6}}
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                border="1px solid rgba(72, 187, 120, 0.2)"
                borderRadius="2xl"
                h={{base: '280px', md: '350px'}}
                boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
              >
                <Heading size="sm" color="#1C4532" mb={4}>
                  Cumulative Users (Monthly)
                </Heading>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={stats.monthlyUsers} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(72, 187, 120, 0.15)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#4A5568', fontSize: 11}} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#4A5568', fontSize: 11}} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1C4532',
                        color: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px rgba(28, 69, 50, 0.2)'
                      }}
                    />
                    <Line
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      type="monotone"
                      dataKey="users"
                      stroke="#319795"
                      strokeWidth={4}
                      dot={{r: 4, fill: '#319795'}}
                      activeDot={{r: 6, fill: '#319795', stroke: 'white', strokeWidth: 2}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>

              {/* Carbon Tracked AreaChart */}
              <Box
                p={{base: 4, md: 6}}
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                border="1px solid rgba(72, 187, 120, 0.2)"
                borderRadius="2xl"
                h={{base: '280px', md: '350px'}}
                boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
              >
                <Heading size="sm" color="#1C4532" mb={4}>
                  Carbon Tracked per Month (kg)
                </Heading>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={stats.monthlyEmissions} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                    <defs>
                      <linearGradient id="colorCO2Global" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38A169" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#38A169" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(72, 187, 120, 0.15)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#4A5568', fontSize: 11}} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#4A5568', fontSize: 11}} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1C4532',
                        color: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px rgba(28, 69, 50, 0.2)'
                      }}
                    />
                    <Area
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      type="monotone"
                      dataKey="co2"
                      stroke="#38A169"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorCO2Global)"
                      activeDot={{r: 6, fill: '#38A169', stroke: 'white', strokeWidth: 2}}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>

              {/* Emissions by Category PieChart */}
              <Box
                gridColumn={{base: '1 / -1', lg: '1 / -1'}}
                p={{base: 4, md: 6}}
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                border="1px solid rgba(72, 187, 120, 0.2)"
                borderRadius="2xl"
                h={{base: '320px', md: '400px'}}
                boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
              >
                <Heading size="sm" color="#1C4532" mb={2}>
                  Emissions by Category
                </Heading>
                {stats.categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-out"
                        data={stats.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        paddingAngle={5}
                        dataKey="value"
                        label={isMobile ? false : ({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1C4532',
                          color: 'white',
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 25px rgba(28, 69, 50, 0.2)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Center h="80%">
                    <Text color="#4A5568" fontStyle="italic">
                      No activities logged yet.
                    </Text>
                  </Center>
                )}
              </Box>
            </Grid>
          </Box>

          {/* Demographic Section Title */}
          <Box pt={{base: 6, md: 10}} borderTop="1px solid rgba(72, 187, 120, 0.2)" mb={6} animation={`${slideUp} 0.5s ease-out 0.3s both`}>
            <Text color="#1C4532" fontWeight="black" fontSize="xl" letterSpacing="tight">
              Community Demographics
            </Text>
          </Box>

          {/* Demographic Data Progress Listings */}
          <Grid templateColumns={{base: '1fr', lg: 'repeat(3, 1fr)'}} gap={{base: 6, md: 8}} animation={`${slideUp} 0.5s ease-out 0.3s both`}>
            <Box p={{base: 5, md: 8}} bg="rgba(255, 255, 255, 0.9)" backdropFilter="blur(10px)" border="1px solid rgba(72, 187, 120, 0.2)" borderRadius="2xl" boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)">
              <Heading size="sm" color="#1C4532" mb={6}>
                Diet Profiles
              </Heading>
              <VStack align="stretch" spacing={5}>
                {Object.keys(stats.diets).length > 0 ? (
                  getTop5(stats.diets).map(([d, c]) => renderCountBar(d, c, stats.totalUsers))
                ) : (
                  <Text color="#4A5568" fontSize="sm">
                    No data yet.
                  </Text>
                )}
              </VStack>
            </Box>

            <Box p={{base: 5, md: 8}} bg="rgba(255, 255, 255, 0.9)" backdropFilter="blur(10px)" border="1px solid rgba(72, 187, 120, 0.2)" borderRadius="2xl" boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)">
              <Heading size="sm" color="#1C4532" mb={6}>
                Primary Commute
              </Heading>
              <VStack align="stretch" spacing={5}>
                {Object.keys(stats.commutes).length > 0 ? (
                  getTop5(stats.commutes).map(([c, count]) => renderCountBar(c, count, stats.totalUsers))
                ) : (
                  <Text color="#4A5568" fontSize="sm">
                    No data yet.
                  </Text>
                )}
              </VStack>
            </Box>

            <Box p={{base: 5, md: 8}} bg="rgba(255, 255, 255, 0.9)" backdropFilter="blur(10px)" border="1px solid rgba(72, 187, 120, 0.2)" borderRadius="2xl" boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)">
              <Heading size="sm" color="#1C4532" mb={6}>
                Top Locations
              </Heading>
              <VStack align="stretch" spacing={5}>
                {Object.keys(stats.locations).length > 0 ? (
                  getTop5(stats.locations).map(([l, c]) => renderCountBar(l, c, stats.totalUsers))
                ) : (
                  <Text color="#4A5568" fontSize="sm">
                    No data yet.
                  </Text>
                )}
              </VStack>
            </Box>
          </Grid>
        </Box>
      </Box>
    </Box>
  )
}
