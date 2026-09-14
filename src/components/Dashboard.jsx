// pages/Dashboard.jsx
import {useState, useEffect, useRef, useMemo} from 'react'
import {Box, Heading, Text, Flex, Grid, VStack, Center, Spinner, Button, useBreakpointValue} from '@chakra-ui/react'
import {Link} from 'react-router-dom'
import {supabase} from '../supabase'
import {AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine} from 'recharts'
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

// 🟢 Small pill showing a % change, colored by whether that direction is desirable
const TrendBadge = ({percent, variant = 'good-up', size = 'sm'}) => {
  if (percent === null || percent === undefined || !isFinite(percent)) return null

  const isUp = percent >= 0
  // variant tells us which direction counts as "good": 'good-up' (more is better),
  // 'good-down' (less is better), or 'neutral' (just informational, no judgement)
  let tone = 'neutral'
  if (variant === 'good-up') tone = isUp ? 'good' : 'bad'
  if (variant === 'good-down') tone = isUp ? 'bad' : 'good'

  const palette = {
    good: {bg: 'rgba(56, 161, 105, 0.12)', border: 'rgba(56, 161, 105, 0.35)', color: '#2F855A'},
    bad: {bg: 'rgba(229, 62, 62, 0.1)', border: 'rgba(229, 62, 62, 0.3)', color: '#C53030'},
    neutral: {bg: 'rgba(49, 151, 149, 0.12)', border: 'rgba(49, 151, 149, 0.3)', color: '#2C7A7B'}
  }[tone]

  return (
    <Flex as="span" align="center" gap={0.5} display="inline-flex" px={size === 'sm' ? 1.5 : 2} py="1px" borderRadius="full" bg={palette.bg} border="1px solid" borderColor={palette.border}>
      <Text as="span" fontSize={size === 'sm' ? '2xs' : 'xs'} fontWeight="bold" color={palette.color} lineHeight="1.4">
        {isUp ? '▲' : '▼'} {Math.abs(percent).toFixed(1)}%
      </Text>
    </Flex>
  )
}

// 🟢 Shared dark tooltip shell so every chart reads consistently
const TooltipShell = ({label, children}) => (
  <Box bg="#1C4532" color="white" px={4} py={3} borderRadius="xl" boxShadow="0 10px 25px rgba(28, 69, 50, 0.3)" minW="150px">
    {label && (
      <Text fontSize="2xs" color="#9AE6B4" fontWeight="bold" textTransform="uppercase" letterSpacing="wide" mb={1}>
        {label}
      </Text>
    )}
    {children}
  </Box>
)

const UsersTooltip = ({active, payload, label}) => {
  if (!active || !payload || !payload.length) return null
  const point = payload[0].payload
  return (
    <TooltipShell label={label}>
      <Flex align="baseline" gap={1}>
        <Text fontSize="xl" fontWeight="black">
          {point.users?.toLocaleString?.() ?? point.users}
        </Text>
        <Text fontSize="xs" opacity={0.75}>
          users
        </Text>
      </Flex>
      {point.delta !== null && point.delta !== undefined && (
        <Text fontSize="xs" mt={1} color={point.delta >= 0 ? '#9AE6B4' : '#FEB2B2'}>
          {point.delta >= 0 ? '+' : ''}
          {point.delta.toLocaleString()} vs prior month
        </Text>
      )}
    </TooltipShell>
  )
}

const CarbonTooltip = ({active, payload, label}) => {
  if (!active || !payload || !payload.length) return null
  const point = payload[0].payload
  return (
    <TooltipShell label={label}>
      <Flex align="baseline" gap={1}>
        <Text fontSize="xl" fontWeight="black">
          {point.co2?.toLocaleString?.() ?? point.co2}
        </Text>
        <Text fontSize="xs" opacity={0.75}>
          kg CO₂
        </Text>
      </Flex>
      {point.delta !== null && point.delta !== undefined && (
        <Text fontSize="xs" mt={1} color={point.delta <= 0 ? '#9AE6B4' : '#FEB2B2'}>
          {point.delta >= 0 ? '+' : ''}
          {point.delta.toLocaleString()} kg vs prior month
        </Text>
      )}
    </TooltipShell>
  )
}

const CategoryTooltip = ({active, payload, total}) => {
  if (!active || !payload || !payload.length) return null
  const point = payload[0].payload
  const pct = total > 0 ? ((point.value / total) * 100).toFixed(1) : 0
  return (
    <TooltipShell>
      <Text fontSize="sm" fontWeight="bold" mb={0.5}>
        {point.name}
      </Text>
      <Text fontSize="xs" opacity={0.85}>
        {point.value.toLocaleString()} kg · {pct}% of total
      </Text>
    </TooltipShell>
  )
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [aiInsight, setAiInsight] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
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
  const innerRadius = useBreakpointValue({base: 55, md: 85})
  const outerRadius = useBreakpointValue({base: 82, md: 120})

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

  // 🟢 Derived analytics — computed once per data change, feed the trend badges & tooltips
  const enrichedUsers = useMemo(
    () =>
      stats.monthlyUsers.map((d, i, arr) => ({
        ...d,
        delta: i > 0 ? d.users - arr[i - 1].users : null
      })),
    [stats.monthlyUsers]
  )

  const enrichedEmissions = useMemo(
    () =>
      stats.monthlyEmissions.map((d, i, arr) => ({
        ...d,
        delta: i > 0 ? d.co2 - arr[i - 1].co2 : null
      })),
    [stats.monthlyEmissions]
  )

  const usersMoMPercent = useMemo(() => {
    if (enrichedUsers.length < 2) return null
    const last = enrichedUsers[enrichedUsers.length - 1]
    const prevTotal = last.users - (last.delta || 0)
    return prevTotal > 0 ? ((last.delta || 0) / prevTotal) * 100 : null
  }, [enrichedUsers])

  const co2MoMPercent = useMemo(() => {
    if (enrichedEmissions.length < 2) return null
    const last = enrichedEmissions[enrichedEmissions.length - 1]
    const prevTotal = last.co2 - (last.delta || 0)
    return prevTotal > 0 ? ((last.delta || 0) / prevTotal) * 100 : null
  }, [enrichedEmissions])

  const avgEmissionsValue = useMemo(() => {
    if (!enrichedEmissions.length) return 0
    return enrichedEmissions.reduce((sum, d) => sum + (d.co2 || 0), 0) / enrichedEmissions.length
  }, [enrichedEmissions])

  const paceVsTargetPercent = useMemo(() => {
    if (!stats.totalUsers || !stats.avgTarget) return null
    const actualPerUser = stats.totalCO2 / stats.totalUsers
    return ((actualPerUser - stats.avgTarget) / stats.avgTarget) * 100
  }, [stats.totalCO2, stats.totalUsers, stats.avgTarget])

  const categoryTotal = useMemo(() => stats.categoryData.reduce((sum, c) => sum + (c.value || 0), 0), [stats.categoryData])

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

  const renderCountBar = (label, count, total, rank) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0
    return (
      <Flex key={label} w="100%" gap={3} align="center">
        <Center flexShrink={0} w="22px" h="22px" borderRadius="md" bg={rank === 0 ? '#38A169' : '#EDF2F7'} color={rank === 0 ? 'white' : '#718096'} fontSize="2xs" fontWeight="black">
          {rank + 1}
        </Center>
        <Box flex={1}>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="xs" fontWeight="bold" color="#4A5568" noOfLines={1}>
              {label}
            </Text>
            <Text fontSize="xs" color="#718096" fontWeight="bold" flexShrink={0} ml={2}>
              {percentage}%{' '}
              <Text as="span" fontSize="2xs" fontWeight="normal">
                ({count})
              </Text>
            </Text>
          </Flex>
          <Box w="100%" h="6px" bg="#EDF2F7" borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${percentage}%`} bg={rank === 0 ? '#38A169' : '#319795'} transition="width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)" />
          </Box>
        </Box>
      </Flex>
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
              <Flex align="center" gap={2} mt={3}>
                <TrendBadge percent={usersMoMPercent} variant="good-up" />
                <Text fontSize="2xs" color="rgba(255,255,255,0.6)">
                  vs last month
                </Text>
              </Flex>
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
              <Flex align="center" gap={2} mt={3}>
                <TrendBadge percent={co2MoMPercent} variant="neutral" />
                <Text fontSize="2xs" color="#A0AEC0">
                  vs last month
                </Text>
              </Flex>
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
              <Flex align="center" gap={2} mt={3}>
                {paceVsTargetPercent !== null ? (
                  <>
                    <TrendBadge percent={paceVsTargetPercent} variant="good-down" />
                    <Text fontSize="2xs" color="#A0AEC0">
                      current pace vs target
                    </Text>
                  </>
                ) : (
                  <Text fontSize="2xs" color="#A0AEC0">
                    Not enough data yet
                  </Text>
                )}
              </Flex>
            </Box>
          </Grid>

          {/* Recharts Analytics Charts Section Block */}
          <Box mb={{base: 6, md: 10}} animation={`${slideUp} 0.5s ease-out 0.2s both`}>
            <Text color="#1C4532" fontWeight="black" fontSize="xl" letterSpacing="tight" mb={6}>
              Platform Trends
            </Text>
            <Grid templateColumns={{base: '1fr', lg: 'repeat(2, 1fr)'}} gap={{base: 6, md: 8}}>
              {/* Cumulative Users AreaChart (upgraded from a plain line) */}
              <Box
                p={{base: 4, md: 6}}
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                border="1px solid rgba(72, 187, 120, 0.2)"
                borderRadius="2xl"
                h={{base: '300px', md: '370px'}}
                boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
              >
                <Flex justify="space-between" align="flex-start" mb={4}>
                  <Box>
                    <Heading size="sm" color="#1C4532">
                      Cumulative Users (Monthly)
                    </Heading>
                    <Text fontSize="2xs" color="#A0AEC0" mt={1}>
                      Total signed-up users over time
                    </Text>
                  </Box>
                  <TrendBadge percent={usersMoMPercent} variant="good-up" size="md" />
                </Flex>
                <ResponsiveContainer width="100%" height="82%">
                  <AreaChart data={enrichedUsers} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                    <defs>
                      <linearGradient id="colorUsersGlobal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#319795" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#319795" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(72, 187, 120, 0.15)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#4A5568', fontSize: 11}} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#4A5568', fontSize: 11}} />
                    <Tooltip content={<UsersTooltip />} cursor={{stroke: '#319795', strokeWidth: 1, strokeDasharray: '4 4'}} />
                    <Area
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      type="monotone"
                      dataKey="users"
                      stroke="#319795"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorUsersGlobal)"
                      dot={{r: 3, fill: '#319795', strokeWidth: 0}}
                      activeDot={{r: 6, fill: '#319795', stroke: 'white', strokeWidth: 2}}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>

              {/* Carbon Tracked AreaChart, now with an average reference line */}
              <Box
                p={{base: 4, md: 6}}
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                border="1px solid rgba(72, 187, 120, 0.2)"
                borderRadius="2xl"
                h={{base: '300px', md: '370px'}}
                boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
              >
                <Flex justify="space-between" align="flex-start" mb={4}>
                  <Box>
                    <Heading size="sm" color="#1C4532">
                      Carbon Tracked per Month (kg)
                    </Heading>
                    <Text fontSize="2xs" color="#A0AEC0" mt={1}>
                      Dashed line marks the {enrichedEmissions.length}-month average
                    </Text>
                  </Box>
                  <TrendBadge percent={co2MoMPercent} variant="neutral" size="md" />
                </Flex>
                <ResponsiveContainer width="100%" height="82%">
                  <AreaChart data={enrichedEmissions} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                    <defs>
                      <linearGradient id="colorCO2Global" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38A169" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#38A169" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(72, 187, 120, 0.15)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#4A5568', fontSize: 11}} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#4A5568', fontSize: 11}} />
                    <Tooltip content={<CarbonTooltip />} cursor={{stroke: '#38A169', strokeWidth: 1, strokeDasharray: '4 4'}} />
                    {avgEmissionsValue > 0 && (
                      <ReferenceLine y={avgEmissionsValue} stroke="#D69E2E" strokeDasharray="5 5" strokeWidth={1.5} label={{value: 'Avg', position: 'insideTopRight', fill: '#D69E2E', fontSize: 10, fontWeight: 'bold'}} />
                    )}
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
                      dot={{r: 3, fill: '#38A169', strokeWidth: 0}}
                      activeDot={{r: 6, fill: '#38A169', stroke: 'white', strokeWidth: 2}}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>

              {/* Emissions by Category — now a donut with a live, hoverable legend */}
              <Box
                gridColumn={{base: '1 / -1', lg: '1 / -1'}}
                p={{base: 4, md: 6}}
                bg="rgba(255, 255, 255, 0.9)"
                backdropFilter="blur(10px)"
                border="1px solid rgba(72, 187, 120, 0.2)"
                borderRadius="2xl"
                boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
              >
                <Heading size="sm" color="#1C4532" mb={4}>
                  Emissions by Category
                </Heading>
                {stats.categoryData.length > 0 ? (
                  <Grid templateColumns={{base: '1fr', md: '1.1fr 1fr'}} gap={{base: 4, md: 8}} alignItems="center">
                    <Box position="relative" h={{base: '260px', md: '320px'}}>
                      <ResponsiveContainer width="100%" height="100%">
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
                            paddingAngle={4}
                            dataKey="value"
                            onMouseEnter={(_, index) => setActiveCategory(index)}
                            onMouseLeave={() => setActiveCategory(null)}
                          >
                            {stats.categoryData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                stroke="white"
                                strokeWidth={2}
                                opacity={activeCategory === null || activeCategory === index ? 1 : 0.3}
                                style={{transition: 'opacity 0.2s ease'}}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CategoryTooltip total={categoryTotal} />} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center readout for the donut */}
                      <Center position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" flexDirection="column" pointerEvents="none">
                        <Text fontSize="2xs" color="#A0AEC0" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
                          {activeCategory !== null ? stats.categoryData[activeCategory]?.name : 'Total'}
                        </Text>
                        <Text fontSize={{base: 'xl', md: '2xl'}} fontWeight="black" color="#1C4532">
                          {activeCategory !== null ? `${categoryTotal > 0 ? ((stats.categoryData[activeCategory].value / categoryTotal) * 100).toFixed(0) : 0}%` : categoryTotal.toLocaleString()}
                        </Text>
                        {activeCategory === null && (
                          <Text fontSize="2xs" color="#A0AEC0">
                            kg CO₂
                          </Text>
                        )}
                      </Center>
                    </Box>

                    {/* Live legend — hover a row to highlight its slice */}
                    <VStack align="stretch" spacing={3}>
                      {stats.categoryData
                        .slice()
                        .map((entry, index) => ({entry, index}))
                        .sort((a, b) => b.entry.value - a.entry.value)
                        .map(({entry, index}) => {
                          const pct = categoryTotal > 0 ? (entry.value / categoryTotal) * 100 : 0
                          const isActive = activeCategory === index
                          return (
                            <Flex
                              key={entry.name}
                              align="center"
                              gap={3}
                              p={2}
                              borderRadius="lg"
                              cursor="pointer"
                              bg={isActive ? 'rgba(72, 187, 120, 0.08)' : 'transparent'}
                              transition="background 0.2s ease"
                              onMouseEnter={() => setActiveCategory(index)}
                              onMouseLeave={() => setActiveCategory(null)}
                            >
                              <Box flexShrink={0} w="10px" h="10px" borderRadius="full" bg={COLORS[index % COLORS.length]} />
                              <Text fontSize="sm" fontWeight="bold" color="#2D3748" flex={1} noOfLines={1}>
                                {entry.name}
                              </Text>
                              <Text fontSize="xs" color="#718096" fontWeight="bold">
                                {entry.value.toLocaleString()} kg
                              </Text>
                              <Text fontSize="xs" color="#1C4532" fontWeight="black" w="42px" textAlign="right">
                                {pct.toFixed(0)}%
                              </Text>
                            </Flex>
                          )
                        })}
                    </VStack>
                  </Grid>
                ) : (
                  <Center h="240px" flexDirection="column" gap={2}>
                    <Text fontSize="2xl">🌱</Text>
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
              <Flex justify="space-between" align="baseline" mb={6}>
                <Heading size="sm" color="#1C4532">
                  Diet Profiles
                </Heading>
                <Text fontSize="2xs" color="#A0AEC0">
                  Top 5 of {Object.keys(stats.diets).length || 0}
                </Text>
              </Flex>
              <VStack align="stretch" spacing={5}>
                {Object.keys(stats.diets).length > 0 ? (
                  getTop5(stats.diets).map(([d, c], i) => renderCountBar(d, c, stats.totalUsers, i))
                ) : (
                  <Text color="#4A5568" fontSize="sm">
                    No data yet.
                  </Text>
                )}
              </VStack>
            </Box>

            <Box p={{base: 5, md: 8}} bg="rgba(255, 255, 255, 0.9)" backdropFilter="blur(10px)" border="1px solid rgba(72, 187, 120, 0.2)" borderRadius="2xl" boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)">
              <Flex justify="space-between" align="baseline" mb={6}>
                <Heading size="sm" color="#1C4532">
                  Primary Commute
                </Heading>
                <Text fontSize="2xs" color="#A0AEC0">
                  Top 5 of {Object.keys(stats.commutes).length || 0}
                </Text>
              </Flex>
              <VStack align="stretch" spacing={5}>
                {Object.keys(stats.commutes).length > 0 ? (
                  getTop5(stats.commutes).map(([c, count], i) => renderCountBar(c, count, stats.totalUsers, i))
                ) : (
                  <Text color="#4A5568" fontSize="sm">
                    No data yet.
                  </Text>
                )}
              </VStack>
            </Box>

            <Box p={{base: 5, md: 8}} bg="rgba(255, 255, 255, 0.9)" backdropFilter="blur(10px)" border="1px solid rgba(72, 187, 120, 0.2)" borderRadius="2xl" boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)">
              <Flex justify="space-between" align="baseline" mb={6}>
                <Heading size="sm" color="#1C4532">
                  Top Locations
                </Heading>
                <Text fontSize="2xs" color="#A0AEC0">
                  Top 5 of {Object.keys(stats.locations).length || 0}
                </Text>
              </Flex>
              <VStack align="stretch" spacing={5}>
                {Object.keys(stats.locations).length > 0 ? (
                  getTop5(stats.locations).map(([l, c], i) => renderCountBar(l, c, stats.totalUsers, i))
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
