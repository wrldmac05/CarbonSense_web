// pages/Dashboard.jsx
import {useState, useEffect, useRef} from 'react'
import {Box, Heading, Text, Flex, Grid, VStack, Center, Spinner, Button} from '@chakra-ui/react'
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

  const COLORS = ['#38A169', '#319795', '#2B6CB0', '#D69E2E', '#E53E3E']

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        setIsLoading(true)

        const {data: insightData} = await supabase
          .from('global_insights')
          .select('insight_text')
          .order('created_at', {ascending: false})
          .limit(1)
          .maybeSingle()

        if (insightData) setAiInsight(insightData.insight_text)

        const {data: users} = await supabase.from('users').select('created_at')
        const {data: profiles} = await supabase.from('user_profiles').select('location, monthly_co2_target')
        const {data: lifestyles} = await supabase.from('lifestyle_profiles').select('diet_type, commute_type')
        const {data: logs} = await supabase.from('activity_logs').select(`
          total_co2e, logged_at, emission_factors ( category )
        `)

        const totalUsers = users?.length || 0
        const totalCO2 = logs?.reduce((sum, log) => sum + Number(log.total_co2e), 0) || 0
        const validTargets = profiles?.filter(p => p.monthly_co2_target > 0) || []
        const avgTarget = validTargets.length
          ? validTargets.reduce((sum, p) => sum + Number(p.monthly_co2_target), 0) / validTargets.length
          : 0

        const getLast6Months = () => {
          const months = []
          const d = new Date()
          for (let i = 5; i >= 0; i--) {
            const pastDate = new Date(d.getFullYear(), d.getMonth() - i, 1)
            months.push(pastDate.toLocaleString('default', {month: 'short'}))
          }
          return months
        }
        const timeline = getLast6Months()

        const userCountsByMonth = {}
        users?.forEach(u => {
          const month = new Date(u.created_at).toLocaleString('default', {month: 'short'})
          userCountsByMonth[month] = (userCountsByMonth[month] || 0) + 1
        })

        let cumulative = 0
        const monthlyUsers = timeline.map(month => {
          cumulative += userCountsByMonth[month] || 0
          return {month, users: cumulative}
        })

        const emissionCountsByMonth = {}
        logs?.forEach(log => {
          const month = new Date(log.logged_at).toLocaleString('default', {month: 'short'})
          emissionCountsByMonth[month] = (emissionCountsByMonth[month] || 0) + Number(log.total_co2e)
        })

        const monthlyEmissions = timeline.map(month => ({
          month,
          co2: Math.round(emissionCountsByMonth[month] || 0)
        }))

        const catTotals = {}
        logs?.forEach(log => {
          const cat = log.emission_factors?.category || 'Other'
          catTotals[cat] = (catTotals[cat] || 0) + Number(log.total_co2e)
        })
        const categoryData = Object.entries(catTotals).map(([name, value]) => ({name, value: Math.round(value)}))

        const countFreq = (arr, key) =>
          arr?.reduce((acc, item) => {
            if (item[key]) acc[item[key]] = (acc[item[key]] || 0) + 1
            return acc
          }, {}) || {}

        setStats({
          totalUsers,
          totalCO2: totalCO2.toFixed(1),
          avgTarget: Math.round(avgTarget),
          monthlyUsers,
          monthlyEmissions,
          categoryData,
          diets: countFreq(lifestyles, 'diet_type'),
          commutes: countFreq(lifestyles, 'commute_type'),
          locations: countFreq(profiles, 'location')
        })
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
          <Box
            h="100%"
            w={`${percentage}%`}
            bg="#319795"
            transition="width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)" // ✨ Fluid spring logic!
          />
        </Box>
      </Box>
    )
  }

  const getTop5 = dataObj =>
    Object.entries(dataObj)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

  return (
    <Box
      minH="100vh"
      bg="#F4F9F5" // Soft earthy sage
      backgroundImage="url('https://www.transparenttextures.com/patterns/cubes.png')"
      backgroundBlendMode="multiply"
      position="relative"
      overflow="hidden"
      pb={20}
    >
      {/* 🌿 Lush Organic Glows instead of solid blur boxes */}
      <Box
        position="absolute"
        top="-10%"
        left="-5%"
        w="700px"
        h="700px"
        bgGradient="radial(#48BB78 0%, transparent 65%)"
        opacity="0.15"
        borderRadius="full"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-10%"
        right="-5%"
        w="700px"
        h="700px"
        bgGradient="radial(#319795 0%, transparent 65%)"
        opacity="0.12"
        borderRadius="full"
        pointerEvents="none"
      />

      <Box position="relative" zIndex={1}>
        {/* 🟢 Frosted Glass Header Section */}
        <Box
          w="100%"
          pt={16}
          pb={8}
          px={10}
          borderBottom="1px solid rgba(72, 187, 120, 0.2)"
          bg="rgba(244, 249, 245, 0.6)"
          backdropFilter="blur(12px)"
          animation={`${slideUp} 0.5s ease-out both`}
        >
          <Box maxW="1200px" mx="auto" position="relative">
            <Flex
              align="center"
              gap={2}
              as={Link}
              to="/"
              position="absolute"
              top="-40px"
              left="0"
              transition="all 0.2s"
              _hover={{opacity: 0.7, transform: 'translateX(-4px)'}}
            >
              <Text fontSize="lg" color="#1C4532">
                ←
              </Text>
              <Text fontWeight="bold" color="#1C4532" fontSize="sm">
                Back to Home
              </Text>
            </Flex>

            <Flex justify="space-between" align="flex-end" wrap="wrap" gap={6}>
              <Box>
                <Text color="#276749" fontWeight="bold" letterSpacing="widest" fontSize="xs" textTransform="uppercase">
                  Community
                </Text>
                <Heading size="2xl" color="#1C4532" mt={2} letterSpacing="tighter">
                  Global Impact
                </Heading>
                <Text color="#4A5568" fontSize="md" mt={2} maxW="600px">
                  Real-time analytics aggregating the anonymized emission logs and demographics of all users worldwide.
                </Text>
              </Box>

              <Flex bg="#E6FFFA" p={1.5} borderRadius="xl" border="1px solid #9AE6B4" boxShadow="inset 0 2px 4px rgba(28, 69, 50, 0.05)">
                <Button
                  as={Link}
                  to="/tracker"
                  bg="transparent"
                  color="#2F855A"
                  _hover={{color: '#1C4532', bg: 'rgba(255, 255, 255, 0.6)'}}
                  borderRadius="lg"
                  px={6}
                  size="md"
                  fontWeight="bold"
                  transition="all 0.2s"
                >
                  My Tracker
                </Button>
                <Button bg="white" color="#1C4532" boxShadow="sm" borderRadius="lg" px={6} size="md" fontWeight="bold" pointerEvents="none">
                  Global Dashboard
                </Button>
              </Flex>
            </Flex>
          </Box>
        </Box>

        {/* 🟢 Main Dashboard Body Content */}
        <Box maxW="1200px" mx="auto" px={10} pt={10}>
          {/* Executive AI Summary Briefing Card */}
          {aiInsight && (
            <Box
              mb={10}
              p={6}
              bg="linear-gradient(135deg, rgba(240, 255, 244, 0.9) 0%, rgba(230, 255, 250, 0.9) 100%)"
              backdropFilter="blur(10px)"
              border="1px solid #9AE6B4"
              borderRadius="2xl"
              boxShadow="0 10px 30px -5px rgba(49, 151, 149, 0.1)"
              position="relative"
              overflow="hidden"
              animation={`${alertPop} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`}
            >
              <Box
                position="absolute"
                top="-20px"
                right="-20px"
                w="100px"
                h="100px"
                bg="#38A169"
                opacity="0.15"
                filter="blur(20px)"
                borderRadius="full"
              />
              <Text
                fontSize="sm"
                color="#234E52"
                fontWeight="black"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={2}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Text as="span" fontSize="lg">
                  ✨
                </Text>{' '}
                Executive AI Summary
              </Text>
              <Text color="#1C4532" fontSize="lg" lineHeight="tall" fontWeight="medium">
                {aiInsight}
              </Text>
            </Box>
          )}

          {/* Rolling Stats Summary Grid Row */}
          <Grid templateColumns={{base: '1fr', md: 'repeat(3, 1fr)'}} gap={6} mb={10} animation={`${slideUp} 0.5s ease-out 0.1s both`}>
            {/* Swapped pure black for Deep Forest Green */}
            <Box
              p={8}
              bg="#1C4532"
              borderRadius="2xl"
              boxShadow="0 15px 35px -10px rgba(28, 69, 50, 0.4)"
              transition="transform 0.2s"
              _hover={{transform: 'translateY(-2px)'}}
            >
              <Text color="#9AE6B4" fontSize="xs" fontWeight="bold" textTransform="uppercase" mb={2}>
                Total Eco Warriors
              </Text>
              <Heading color="white" size="2xl">
                <AnimatedNumber value={stats.totalUsers} decimals={0} />
              </Heading>
            </Box>
            <Box
              p={8}
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
              <Heading color="#1C4532" size="2xl">
                <AnimatedNumber value={stats.totalCO2} decimals={1} />{' '}
                <Text as="span" fontSize="lg" color="#319795">
                  kg
                </Text>
              </Heading>
            </Box>
            <Box
              p={8}
              bg="rgba(255, 255, 255, 0.9)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(72, 187, 120, 0.2)"
              borderRadius="2xl"
              boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
              transition="transform 0.2s"
              _hover={{transform: 'translateY(-2px)'}}
            >
              <Text color="#4A5568" fontSize="xs" fontWeight="bold" textTransform="uppercase" mb={2}>
                Avg Monthly Target
              </Text>
              <Heading color="#1C4532" size="2xl">
                <AnimatedNumber value={stats.avgTarget} decimals={0} />{' '}
                <Text as="span" fontSize="lg" color="#718096">
                  kg
                </Text>
              </Heading>
            </Box>
          </Grid>

          {/* Recharts Analytics Charts Section Block */}
          <Box mb={10} animation={`${slideUp} 0.5s ease-out 0.2s both`}>
            <Text color="#1C4532" fontWeight="black" fontSize="xl" letterSpacing="tight" mb={6}>
              Platform Trends
            </Text>
            <Grid templateColumns={{base: '1fr', lg: 'repeat(2, 1fr)'}} gap={8}>
              {/* LineChart container */}
              <Box
                p={6}
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                border="1px solid rgba(72, 187, 120, 0.2)"
                borderRadius="2xl"
                h="350px"
                boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
              >
                <Heading size="sm" color="#1C4532" mb={6}>
                  Cumulative Users (Monthly)
                </Heading>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={stats.monthlyUsers}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(72, 187, 120, 0.15)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#4A5568', fontSize: 12}} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#4A5568', fontSize: 12}} />
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

              {/* AreaChart container */}
              <Box
                p={6}
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                border="1px solid rgba(72, 187, 120, 0.2)"
                borderRadius="2xl"
                h="350px"
                boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
              >
                <Heading size="sm" color="#1C4532" mb={6}>
                  Carbon Tracked per Month (kg)
                </Heading>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={stats.monthlyEmissions}>
                    <defs>
                      <linearGradient id="colorCO2Global" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38A169" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#38A169" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(72, 187, 120, 0.15)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#4A5568', fontSize: 12}} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#4A5568', fontSize: 12}} />
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

              {/* PieChart breakdown block */}
              <Box
                gridColumn={{base: '1 / -1', lg: '1 / -1'}}
                p={6}
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                border="1px solid rgba(72, 187, 120, 0.2)"
                borderRadius="2xl"
                h="400px"
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
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
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

          {/* Demographic Grid Titles */}
          <Box pt={10} borderTop="1px solid rgba(72, 187, 120, 0.2)" mb={6} animation={`${slideUp} 0.5s ease-out 0.3s both`}>
            <Text color="#1C4532" fontWeight="black" fontSize="xl" letterSpacing="tight">
              Community Demographics
            </Text>
          </Box>

          {/* Demographic Data Progress Listings */}
          <Grid templateColumns={{base: '1fr', lg: 'repeat(3, 1fr)'}} gap={8} animation={`${slideUp} 0.5s ease-out 0.3s both`}>
            <Box
              p={8}
              bg="rgba(255, 255, 255, 0.9)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(72, 187, 120, 0.2)"
              borderRadius="2xl"
              boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
            >
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

            <Box
              p={8}
              bg="rgba(255, 255, 255, 0.9)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(72, 187, 120, 0.2)"
              borderRadius="2xl"
              boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
            >
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

            <Box
              p={8}
              bg="rgba(255, 255, 255, 0.9)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(72, 187, 120, 0.2)"
              borderRadius="2xl"
              boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
            >
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
