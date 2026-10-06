// pages/PersonalTracker.jsx
import {useState, useEffect, useRef} from 'react'
import {Box, Heading, Text, Flex, Grid, GridItem, SimpleGrid, VStack, Center, Button, Badge} from '@chakra-ui/react'
import {Link} from 'react-router-dom'
import {supabase} from '../supabase'
import {AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts'
import {keyframes} from '@emotion/react'
import {useTheme} from '../App'

// 🟢 Entry & Skeleton Keyframe Definitions
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

const modalGrow = keyframes`
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`

const skeletonPulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`

// 🟢 Custom Chart Tooltip displaying explicit "kg CO2"
const PersonalChartTooltip = ({active, payload, label, isDark}) => {
  if (!active || !payload || !payload.length) return null
  const point = payload[0].payload
  return (
    <Box bg={isDark ? '#0F172A' : '#1C4532'} border={`1px solid ${isDark ? '#334155' : 'transparent'}`} color="white" px={4} py={2.5} borderRadius="xl" boxShadow="0 10px 25px rgba(0, 0, 0, 0.4)" minW="140px">
      <Text fontSize="2xs" color="#9AE6B4" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" mb={1}>
        {label}
      </Text>
      <Flex align="baseline" gap={1.5}>
        <Text fontSize="lg" fontWeight="black" color="white">
          {Number(point.emissions || 0).toLocaleString()}
        </Text>
        <Text fontSize="xs" fontWeight="bold" color="#9AE6B4">
          kg CO₂
        </Text>
      </Flex>
    </Box>
  )
}

// 🟢 Reusable Skeleton Wireframe Component
const SkeletonBox = ({isDark, h = '20px', w = '100%', borderRadius = 'lg', ...props}) => <Box h={h} w={w} borderRadius={borderRadius} bg={isDark ? '#1E293B' : '#EDF2F7'} animation={`${skeletonPulse} 1.6s ease-in-out infinite`} {...props} />

// 🟢 Native Number Counter Animation
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

export default function Tracker() {
  const {isDarkMode} = useTheme()

  const [isLoading, setIsLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedLog, setSelectedLog] = useState(null)
  const [monthlyGoal, setMonthlyGoal] = useState(400)
  const [stats, setStats] = useState({thisMonth: 0, totalActivities: 0, streak: 0})
  const [chartData, setChartData] = useState([])
  const [recentLogs, setRecentLogs] = useState([])

  const lastSynced = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})

  useEffect(() => {
    const fetchPersonalData = async () => {
      try {
        setIsLoading(true)
        const {
          data: {user}
        } = await supabase.auth.getUser()

        if (!user) {
          setIsGuest(true)
          setMonthlyGoal(400)
          setStats({thisMonth: 285.4, totalActivities: 42, streak: 12})
          setTasks([
            {
              is_completed: false,
              tasks_dictionary: {
                tier: 'Gold',
                target_lifestyle_tag: 'Energy',
                description: 'Reduce weekly home electricity by 10%.',
                co2_saved_estimate: 15.0
              }
            },
            {
              is_completed: false,
              tasks_dictionary: {
                tier: 'Silver',
                target_lifestyle_tag: 'Commute',
                description: 'Take public transit instead of a private car today.',
                co2_saved_estimate: 3.5
              }
            },
            {
              is_completed: true,
              tasks_dictionary: {
                tier: 'Bronze',
                target_lifestyle_tag: 'General',
                description: 'Use a reusable water bottle for the entire day.',
                co2_saved_estimate: 0.5
              }
            }
          ])
          setRecentLogs([
            {id: 1, type: 'log', action: 'Jeepney Ride', amount: 1.2, displayAmount: '+1.2 kg', category: 'Transport', time: 'Today', startLocation: 'Imus, Cavite', endLocation: 'Dasmariñas, Cavite'},
            {id: 2, type: 'log', action: 'Plant-based Meal', amount: 0.8, displayAmount: '+0.8 kg', category: 'Diet', time: 'Today', ingredients: ['Tofu', 'Soy Sauce', 'Garlic', 'Onion']},
            {id: 3, type: 'task', action: 'Challenge Completed', amount: -0.5, displayAmount: '-0.5 kg', category: 'Reward', time: 'Yesterday'}
          ])
          setChartData([
            {name: 'May', emissions: 95},
            {name: 'Jun', emissions: 20},
            {name: 'Jul', emissions: 1129},
            {name: 'Aug', emissions: 65},
            {name: 'Sep', emissions: 830},
            {name: 'Oct', emissions: 15}
          ])
          setIsLoading(false)
          return
        }

        const {data: profile} = await supabase.from('user_profiles').select('monthly_co2_target').eq('user_id', user.id).maybeSingle()
        if (profile?.monthly_co2_target) setMonthlyGoal(profile.monthly_co2_target)

        let {data: userTasks} = await supabase
          .from('user_tasks')
          .select(
            `
    user_task_id, is_completed, completed_at, created_at, 
    tasks_dictionary ( tier, description, target_lifestyle_tag, co2_saved_estimate )
  `
          )
          .eq('user_id', user.id)

        let needsRegeneration = false

        if (!userTasks || userTasks.length === 0) {
          const createdAt = new Date(user.created_at)
          const now = new Date()
          const accountAgeDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))

          const {count: logCount, error: logError} = await supabase.from('activity_logs').select('*', {count: 'exact', head: true}).eq('user_id', user.id)

          if (logError) console.error('Activity logs fetch notice:', logError)

          const requiredLogs = 10

          if (accountAgeDays >= 7 || (logCount || 0) >= requiredLogs) {
            needsRegeneration = true
          }
        } else {
          const firstTaskTimestamp = userTasks[0].created_at

          if (firstTaskTimestamp) {
            const taskCreationDate = new Date(firstTaskTimestamp)
            const now = new Date()
            const dayOfWeek = now.getDay()
            const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

            const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday)
            startOfThisWeek.setHours(0, 0, 0, 0)

            if (taskCreationDate < startOfThisWeek) {
              needsRegeneration = true
              await supabase.from('user_tasks').delete().eq('user_id', user.id)
            }
          }
        }

        if (needsRegeneration) {
          await supabase.rpc('generate_smart_tasks', {current_user_id: user.id})

          const {data: newTasks} = await supabase
            .from('user_tasks')
            .select(
              `
      user_task_id, is_completed, completed_at, created_at, 
      tasks_dictionary ( tier, description, target_lifestyle_tag, co2_saved_estimate )
    `
            )
            .eq('user_id', user.id)

          userTasks = newTasks || []
        }

        setTasks(userTasks || [])

        const {data: logs} = await supabase
          .from('activity_logs')
          .select(
            `
            log_id, input_value, total_co2e, logged_at,
            ingredients, start_location, end_location,
            emission_factors ( category, activity_name )
        `
          )
          .eq('user_id', user.id)

        let combinedTimeline = []

        if (logs) {
          logs.forEach(log => {
            combinedTimeline.push({
              id: log.log_id,
              type: 'log',
              action: log.emission_factors?.activity_name || 'Activity Logged',
              amount: Number(log.total_co2e),
              displayAmount: `+${Number(log.total_co2e).toFixed(1)} kg`,
              category: log.emission_factors?.category || 'Other',
              timestamp: new Date(log.logged_at),
              inputValue: log.input_value,
              ingredients: log.ingredients,
              startLocation: log.start_location,
              endLocation: log.end_location
            })
          })
        }

        if (userTasks) {
          const completedTasks = userTasks.filter(t => t.is_completed && t.completed_at)
          completedTasks.forEach(task => {
            const savedAmount = Number(task.tasks_dictionary?.co2_saved_estimate || 0)
            combinedTimeline.push({
              id: task.user_task_id,
              type: 'task',
              action: task.tasks_dictionary?.description || 'Challenge Completed',
              amount: -savedAmount,
              displayAmount: `-${savedAmount.toFixed(1)} kg`,
              category: 'Reward',
              timestamp: new Date(task.completed_at)
            })
          })
        }

        combinedTimeline.sort((a, b) => b.timestamp - a.timestamp)

        const now = new Date()
        let currentMonthNet = 0
        let uniqueDays = new Set()

        combinedTimeline.forEach(item => {
          uniqueDays.add(item.timestamp.toDateString())

          if (item.timestamp.getMonth() === now.getMonth() && item.timestamp.getFullYear() === now.getFullYear()) {
            currentMonthNet += item.amount
          }
        })

        if (currentMonthNet < 0) currentMonthNet = 0

        const formattedRecent = combinedTimeline.slice(0, 5).map(item => ({
          ...item,
          time: item.timestamp.toLocaleDateString('default', {month: 'short', day: 'numeric'})
        }))

        setRecentLogs(formattedRecent)
        setStats({
          thisMonth: currentMonthNet,
          totalActivities: combinedTimeline.length,
          streak: uniqueDays.size
        })

        const getPast6Months = () => {
          const months = []
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            months.push(d.toLocaleString('default', {month: 'short'}))
          }
          return months
        }

        const timeline = getPast6Months()
        const emissionsByMonth = {}

        combinedTimeline.forEach(item => {
          const m = item.timestamp.toLocaleString('default', {month: 'short'})
          emissionsByMonth[m] = (emissionsByMonth[m] || 0) + item.amount
        })

        const finalChartData = timeline.map(name => ({
          name,
          emissions: Math.max(0, Math.round(emissionsByMonth[name] || 0))
        }))

        setChartData(finalChartData)
      } catch (error) {
        console.error('Error fetching tracker data:', error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPersonalData()
  }, [])

  // 🟢 SKELETON LOADER STATE
  if (isLoading) {
    return (
      <Box
        minH="100vh"
        bg={isDarkMode ? '#0B1120' : '#F4F9F5'}
        backgroundImage="url('https://www.transparenttextures.com/patterns/cubes.png')"
        backgroundBlendMode={isDarkMode ? 'soft-light' : 'multiply'}
        position="relative"
        overflow="hidden"
        pb={{base: 12, md: 20}}
      >
        <Box
          w="100%"
          pt={{base: 12, md: 16}}
          pb={{base: 6, md: 8}}
          px={{base: 4, sm: 6, md: 10}}
          borderBottom={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(72, 187, 120, 0.2)'}`}
          bg={isDarkMode ? 'rgba(15, 23, 42, 0.75)' : 'rgba(244, 249, 245, 0.6)'}
          backdropFilter="blur(12px)"
        >
          <Box maxW="1200px" mx="auto">
            <SkeletonBox isDark={isDarkMode} h="16px" w="100px" mb={3} />
            <Flex justify="space-between" align={{base: 'flex-start', md: 'flex-end'}} direction={{base: 'column', md: 'row'}} gap={6}>
              <Box w={{base: '100%', md: '500px'}}>
                <SkeletonBox isDark={isDarkMode} h="14px" w="120px" mb={2} />
                <SkeletonBox isDark={isDarkMode} h="36px" w="240px" mb={3} />
                <SkeletonBox isDark={isDarkMode} h="14px" w="90%" mb={1.5} />
                <SkeletonBox isDark={isDarkMode} h="14px" w="70%" />
              </Box>
              <SkeletonBox isDark={isDarkMode} h="44px" w={{base: '100%', sm: '260px'}} borderRadius="xl" />
            </Flex>
          </Box>
        </Box>

        <Box maxW="1200px" mx="auto" px={{base: 4, sm: 6, md: 10}} pt={{base: 6, md: 10}}>
          <SimpleGrid columns={{base: 1, sm: 2, md: 3}} gap={{base: 4, md: 6}} mb={{base: 6, md: 10}}>
            {[1, 2, 3].map(i => (
              <Box
                key={i}
                p={{base: 5, md: 6}}
                borderRadius="xl"
                border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.2)'}`}
                bg={isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                backdropFilter="blur(10px)"
              >
                <SkeletonBox isDark={isDarkMode} h="12px" w="60%" mb={3} />
                <SkeletonBox isDark={isDarkMode} h="32px" w="40%" />
              </Box>
            ))}
          </SimpleGrid>

          <Grid templateColumns={{base: '1fr', lg: 'repeat(3, 1fr)'}} gap={{base: 6, md: 8}}>
            <GridItem colSpan={{base: 1, lg: 2}}>
              <VStack align="stretch" spacing={{base: 6, md: 8}}>
                <Box
                  p={{base: 4, md: 6}}
                  borderRadius="xl"
                  border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.2)'}`}
                  bg={isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                  backdropFilter="blur(10px)"
                  h={{base: '280px', md: '360px'}}
                >
                  <SkeletonBox isDark={isDarkMode} h="20px" w="180px" mb={6} />
                  <SkeletonBox isDark={isDarkMode} h={{base: '190px', md: '260px'}} w="100%" borderRadius="lg" />
                </Box>

                <Box
                  p={{base: 5, md: 6}}
                  borderRadius="xl"
                  border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.2)'}`}
                  bg={isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                  backdropFilter="blur(10px)"
                >
                  <SkeletonBox isDark={isDarkMode} h="22px" w="160px" mb={2} />
                  <SkeletonBox isDark={isDarkMode} h="14px" w="80%" mb={6} />

                  <Grid templateColumns={{base: '1fr', sm: '1fr 1fr'}} gap={4}>
                    {[1, 2, 3, 4].map(i => (
                      <Box key={i} p={4} borderRadius="24px" border={`1.5px solid ${isDarkMode ? '#334155' : 'rgba(72, 187, 120, 0.15)'}`} bg={isDarkMode ? '#1E293B' : '#FFFFFF'}>
                        <Flex justify="space-between" mb={3}>
                          <SkeletonBox isDark={isDarkMode} h="18px" w="60px" borderRadius="lg" />
                          <SkeletonBox isDark={isDarkMode} h="20px" w="20px" borderRadius="md" />
                        </Flex>
                        <SkeletonBox isDark={isDarkMode} h="14px" w="90%" mb={2} />
                        <SkeletonBox isDark={isDarkMode} h="14px" w="60%" />
                      </Box>
                    ))}
                  </Grid>
                </Box>
              </VStack>
            </GridItem>

            <GridItem colSpan={1}>
              <VStack gap={{base: 6, md: 8}} align="stretch">
                <Box
                  p={{base: 5, md: 6}}
                  borderRadius="xl"
                  border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.2)'}`}
                  bg={isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                  backdropFilter="blur(10px)"
                >
                  <SkeletonBox isDark={isDarkMode} h="18px" w="120px" mb={2} />
                  <SkeletonBox isDark={isDarkMode} h="14px" w="180px" mb={6} />
                  <SkeletonBox isDark={isDarkMode} h="8px" w="100%" borderRadius="full" mb={4} />
                  <Flex justify="space-between">
                    <SkeletonBox isDark={isDarkMode} h="12px" w="70px" />
                    <SkeletonBox isDark={isDarkMode} h="12px" w="70px" />
                  </Flex>
                </Box>

                <Box
                  p={{base: 5, md: 6}}
                  borderRadius="xl"
                  border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.2)'}`}
                  bg={isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                  backdropFilter="blur(10px)"
                >
                  <SkeletonBox isDark={isDarkMode} h="18px" w="140px" mb={6} />
                  <VStack align="stretch" spacing={4}>
                    {[1, 2, 3, 4].map(i => (
                      <Box key={i} pb={2} borderBottom={i < 4 ? `1px solid ${isDarkMode ? '#334155' : 'rgba(72, 187, 120, 0.15)'}` : 'none'}>
                        <Flex justify="space-between" mb={2}>
                          <SkeletonBox isDark={isDarkMode} h="14px" w="50%" />
                          <SkeletonBox isDark={isDarkMode} h="14px" w="45px" />
                        </Flex>
                        <Flex justify="space-between">
                          <SkeletonBox isDark={isDarkMode} h="10px" w="35%" />
                          <SkeletonBox isDark={isDarkMode} h="10px" w="40px" />
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </GridItem>
          </Grid>
        </Box>
      </Box>
    )
  }

  const progressPercentage = monthlyGoal > 0 ? (stats.thisMonth / monthlyGoal) * 100 : 0
  const remainingGoal = monthlyGoal - stats.thisMonth

  const getTierDesign = tier => {
    switch (tier?.toLowerCase()) {
      case 'gold':
        return {
          main: '#D69E2E',
          light: isDarkMode ? 'rgba(214, 158, 46, 0.15)' : 'rgba(254, 252, 191, 0.5)',
          badgeBg: isDarkMode ? 'rgba(214, 158, 46, 0.25)' : 'rgba(214, 158, 46, 0.15)',
          icon: '☀️'
        }
      case 'silver':
        return {
          main: isDarkMode ? '#A0AEC0' : '#718096',
          light: isDarkMode ? 'rgba(160, 174, 192, 0.15)' : 'rgba(237, 242, 247, 0.5)',
          badgeBg: isDarkMode ? 'rgba(160, 174, 192, 0.25)' : 'rgba(113, 128, 150, 0.15)',
          icon: '💧'
        }
      case 'bronze':
        return {
          main: '#CD7F32',
          light: isDarkMode ? 'rgba(205, 127, 50, 0.15)' : 'rgba(250, 240, 230, 0.5)',
          badgeBg: isDarkMode ? 'rgba(205, 127, 50, 0.25)' : 'rgba(205, 127, 50, 0.15)',
          icon: '🍃'
        }
      default:
        return {
          main: '#38A169',
          light: isDarkMode ? 'rgba(56, 161, 105, 0.15)' : 'rgba(240, 255, 244, 0.5)',
          badgeBg: isDarkMode ? 'rgba(56, 161, 105, 0.25)' : 'rgba(56, 161, 105, 0.15)',
          icon: '🌸'
        }
    }
  }

  return (
    <Box
      minH="100vh"
      bg={isDarkMode ? '#0B1120' : '#F4F9F5'}
      backgroundImage="url('https://www.transparenttextures.com/patterns/cubes.png')"
      backgroundBlendMode={isDarkMode ? 'soft-light' : 'multiply'}
      position="relative"
      overflow="hidden"
      pb={{base: 12, md: 20}}
      transition="background-color 0.3s ease"
    >
      {/* Background Aurora Glows */}
      <Box
        position="absolute"
        top="-10%"
        left="-5%"
        w={{base: '350px', md: '700px'}}
        h={{base: '350px', md: '700px'}}
        bgGradient={isDarkMode ? 'radial(rgba(72, 187, 120, 0.25) 0%, transparent 65%)' : 'radial(#48BB78 0%, transparent 65%)'}
        opacity={isDarkMode ? '0.2' : '0.15'}
        borderRadius="full"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        top="-5%"
        right="-5%"
        w={{base: '350px', md: '700px'}}
        h={{base: '350px', md: '700px'}}
        bgGradient={isDarkMode ? 'radial(rgba(49, 151, 149, 0.25) 0%, transparent 65%)' : 'radial(#319795 0%, transparent 65%)'}
        opacity={isDarkMode ? '0.2' : '0.12'}
        borderRadius="full"
        pointerEvents="none"
      />

      <Box position="relative" zIndex={1}>
        {/* Header Section */}
        <Box
          w="100%"
          pt={{base: 12, md: 16}}
          pb={{base: 6, md: 8}}
          px={{base: 4, sm: 6, md: 10}}
          borderBottom={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(72, 187, 120, 0.2)'}`}
          bg={isDarkMode ? 'rgba(15, 23, 42, 0.75)' : 'rgba(244, 249, 245, 0.6)'}
          backdropFilter="blur(12px)"
          animation={`${slideUp} 0.5s ease-out both`}
          transition="background-color 0.3s ease, border-color 0.3s ease"
        >
          <Box maxW="1200px" mx="auto" position="relative">
            <Flex align="center" gap={2} as={Link} to="/" position="absolute" top={{base: '-32px', md: '-40px'}} left="0" transition="all 0.2s" _hover={{opacity: 0.7, transform: 'translateX(-4px)'}}>
              <Text fontSize="lg" color={isDarkMode ? '#9AE6B4' : '#1C4532'}>
                ←
              </Text>
              <Text fontWeight="bold" color={isDarkMode ? '#9AE6B4' : '#1C4532'} fontSize="sm">
                Back to Home
              </Text>
            </Flex>

            <Flex justify="space-between" align={{base: 'flex-start', md: 'flex-end'}} direction={{base: 'column', md: 'row'}} gap={6}>
              <Box>
                <Text color={isDarkMode ? '#68D391' : '#276749'} fontWeight="bold" letterSpacing="widest" fontSize="xs" textTransform="uppercase">
                  Private Dashboard
                </Text>
                <Heading size={{base: 'xl', md: '2xl'}} color={isDarkMode ? '#F8FAFC' : '#1C4532'} mt={2} letterSpacing="tighter">
                  Personal Tracker
                </Heading>
                <Text color={isDarkMode ? '#94A3B8' : '#4A5568'} fontSize={{base: 'sm', md: 'md'}} mt={2} maxW="500px" lineHeight="tall">
                  Monitor your daily footprint, track your active streak, and stay below your custom monthly reduction target.
                </Text>
              </Box>

              <Flex direction="column" align={{base: 'flex-start', md: 'flex-end'}} gap={4} w={{base: '100%', md: 'auto'}}>
                <Flex
                  w={{base: '100%', sm: 'auto'}}
                  bg={isDarkMode ? '#1E293B' : '#E6FFFA'}
                  p={1.5}
                  borderRadius="xl"
                  border={`1px solid ${isDarkMode ? '#334155' : '#9AE6B4'}`}
                  boxShadow={isDarkMode ? 'none' : 'inset 0 2px 4px rgba(28, 69, 50, 0.05)'}
                >
                  <Button
                    type="button"
                    flex={{base: '1', sm: 'initial'}}
                    bg={isDarkMode ? '#38A169' : 'white'}
                    color={isDarkMode ? 'white' : '#1C4532'}
                    boxShadow="sm"
                    borderRadius="lg"
                    px={{base: 3, md: 6}}
                    size={{base: 'sm', md: 'md'}}
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    My Tracker
                  </Button>
                  <Button
                    type="button"
                    flex={{base: '1', sm: 'initial'}}
                    as={Link}
                    to="/dashboard"
                    bg="transparent"
                    color={isDarkMode ? '#9AE6B4' : '#2F855A'}
                    _hover={{color: isDarkMode ? 'white' : '#1C4532', bg: isDarkMode ? '#334155' : 'rgba(255, 255, 255, 0.6)'}}
                    borderRadius="lg"
                    px={{base: 3, md: 6}}
                    size={{base: 'sm', md: 'md'}}
                    fontWeight="bold"
                    transition="all 0.2s"
                  >
                    Global Dashboard
                  </Button>
                </Flex>
              </Flex>
            </Flex>
          </Box>
        </Box>

        {/* Content Container */}
        <Box position="relative" maxW="1200px" mx="auto" px={{base: 4, sm: 6, md: 10}} pt={{base: 6, md: 10}}>
          {isGuest && (
            <Flex position="absolute" top={0} left={0} right={0} bottom={0} zIndex={10} align="flex-start" justify="center" pt={{base: 12, md: 24}} px={4}>
              <VStack
                bg={isDarkMode ? 'rgba(30, 41, 59, 0.92)' : 'rgba(244, 249, 245, 0.85)'}
                backdropFilter="blur(16px)"
                p={{base: 6, md: 10}}
                borderRadius="2xl"
                boxShadow={isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)' : '0 25px 50px -12px rgba(28, 69, 50, 0.15)'}
                textAlign="center"
                maxW="400px"
                w="100%"
                border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.3)'}`}
                animation={`${modalGrow} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both`}
              >
                <Box fontSize="4xl" mb={2}>
                  🔒
                </Box>
                <Heading size="md" color={isDarkMode ? '#F8FAFC' : '#1C4532'}>
                  Unlock Your Tracker
                </Heading>
                <Text color={isDarkMode ? '#94A3B8' : '#4A5568'} fontSize="sm" mt={2} mb={6} lineHeight="tall">
                  Log in or create a free account to track your personal carbon footprint, complete custom challenges, and build your streak.
                </Text>
                <Button
                  as={Link}
                  to="/login"
                  w="100%"
                  bg={isDarkMode ? '#2F855A' : '#22543D'}
                  color="white"
                  size="lg"
                  borderRadius="xl"
                  transition="all 0.2s"
                  _hover={{bg: isDarkMode ? '#38A169' : '#1C4532', transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(34, 84, 61, 0.2)'}}
                  _active={{transform: 'translateY(0)'}}
                >
                  Log In to Continue
                </Button>
              </VStack>
            </Flex>
          )}

          <Box filter={isGuest ? 'blur(6px)' : 'none'} opacity={isGuest ? 0.5 : 1} pointerEvents={isGuest ? 'none' : 'auto'} userSelect={isGuest ? 'none' : 'auto'} transition="all 0.4s ease">
            {/* Top Stats Cards */}
            <SimpleGrid columns={{base: 1, sm: 2, md: 3}} gap={{base: 4, md: 6}} mb={{base: 6, md: 10}} animation={`${slideUp} 0.5s ease-out 0.1s both`}>
              <Box
                p={{base: 5, md: 6}}
                borderRadius="xl"
                border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.2)'}`}
                bg={isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                backdropFilter="blur(10px)"
                boxShadow={isDarkMode ? '0 10px 30px -5px rgba(0, 0, 0, 0.4)' : '0 10px 30px -5px rgba(28, 69, 50, 0.05)'}
              >
                <Text fontSize="xs" fontWeight="bold" color={isDarkMode ? '#94A3B8' : '#4A5568'} textTransform="uppercase" mb={2}>
                  This Month's Footprint
                </Text>
                <Text fontSize={{base: '2xl', md: '3xl'}} fontWeight="black" color={isDarkMode ? '#F8FAFC' : '#1C4532'}>
                  <AnimatedNumber value={stats.thisMonth} decimals={1} />{' '}
                  <Text as="span" fontSize="lg" color={isDarkMode ? '#64748B' : '#718096'}>
                    kg CO₂
                  </Text>
                </Text>
              </Box>
              <Box
                p={{base: 5, md: 6}}
                borderRadius="xl"
                border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.2)'}`}
                bg={isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                backdropFilter="blur(10px)"
                boxShadow={isDarkMode ? '0 10px 30px -5px rgba(0, 0, 0, 0.4)' : '0 10px 30px -5px rgba(28, 69, 50, 0.05)'}
              >
                <Text fontSize="xs" fontWeight="bold" color={isDarkMode ? '#94A3B8' : '#4A5568'} textTransform="uppercase" mb={2}>
                  Total Activities Logged
                </Text>
                <Text fontSize={{base: '2xl', md: '3xl'}} fontWeight="black" color={isDarkMode ? '#F8FAFC' : '#1C4532'}>
                  <AnimatedNumber value={stats.totalActivities} decimals={0} />
                </Text>
              </Box>
              <Box
                p={{base: 5, md: 6}}
                borderRadius="xl"
                border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.2)'}`}
                bg={isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                backdropFilter="blur(10px)"
                boxShadow={isDarkMode ? '0 10px 30px -5px rgba(0, 0, 0, 0.4)' : '0 10px 30px -5px rgba(28, 69, 50, 0.05)'}
                gridColumn={{base: 'span 1', sm: 'span 2', md: 'span 1'}}
              >
                <Text fontSize="xs" fontWeight="bold" color={isDarkMode ? '#94A3B8' : '#4A5568'} textTransform="uppercase" mb={2}>
                  Current App Streak
                </Text>
                <Text fontSize={{base: '2xl', md: '3xl'}} fontWeight="black" color={isDarkMode ? '#F8FAFC' : '#1C4532'}>
                  <AnimatedNumber value={stats.streak} decimals={0} />{' '}
                  <Text as="span" fontSize="lg" color={isDarkMode ? '#64748B' : '#718096'}>
                    Days
                  </Text>
                </Text>
              </Box>
            </SimpleGrid>

            {/* Main Content Grid */}
            <Grid templateColumns={{base: '1fr', lg: 'repeat(3, 1fr)'}} gap={{base: 6, md: 8}}>
              <GridItem colSpan={{base: 1, lg: 2}} animation={`${slideUp} 0.5s ease-out 0.2s both`}>
                <VStack align="stretch" spacing={{base: 6, md: 8}} h="100%">
                  {/* 🟢 Chart Card with fixed Y-axis padding & explicit kg CO2 Tooltip */}
                  <Box
                    p={{base: 4, md: 6}}
                    borderRadius="xl"
                    border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.2)'}`}
                    bg={isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                    backdropFilter="blur(10px)"
                    boxShadow={isDarkMode ? '0 10px 30px -5px rgba(0, 0, 0, 0.4)' : '0 10px 30px -5px rgba(28, 69, 50, 0.05)'}
                  >
                    <Text fontWeight="bold" color={isDarkMode ? '#F8FAFC' : '#1C4532'} fontSize="lg" mb={4}>
                      My 6-Month Trend
                    </Text>
                    <Box h={{base: '220px', md: '300px'}} w="100%" minW="0" overflow="hidden">
                      <ResponsiveContainer width="99%" height="100%">
                        <AreaChart data={chartData} margin={{top: 10, right: 10, left: 10, bottom: 0}}>
                          <defs>
                            <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#38A169" stopOpacity={isDarkMode ? 0.45 : 0.25} />
                              <stop offset="95%" stopColor="#38A169" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : 'rgba(72, 187, 120, 0.15)'} vertical={false} />
                          <XAxis dataKey="name" stroke={isDarkMode ? '#94A3B8' : '#4A5568'} axisLine={false} tickLine={false} dy={10} fontSize={11} />
                          <YAxis allowDecimals={false} width={48} stroke={isDarkMode ? '#94A3B8' : '#4A5568'} axisLine={false} tickLine={false} fontSize={11} domain={[0, 'auto']} />
                          <Tooltip content={<PersonalChartTooltip isDark={isDarkMode} />} />
                          <Area
                            isAnimationActive={true}
                            animationDuration={1200}
                            animationEasing="ease-out"
                            type="monotone"
                            dataKey="emissions"
                            stroke="#38A169"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorEmissions)"
                            activeDot={{r: 6, fill: '#38A169', stroke: isDarkMode ? '#1E293B' : 'white', strokeWidth: 2}}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>

                  {/* Weekly Missions Card */}
                  <Box
                    p={{base: 5, md: 6}}
                    borderRadius="xl"
                    border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.2)'}`}
                    bg={isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                    backdropFilter="blur(10px)"
                    boxShadow={isDarkMode ? '0 10px 30px -5px rgba(0, 0, 0, 0.4)' : '0 10px 30px -5px rgba(28, 69, 50, 0.05)'}
                  >
                    <Heading size="md" color={isDarkMode ? '#F8FAFC' : '#1C4532'} letterSpacing="tight" mb={2}>
                      Weekly Missions
                    </Heading>
                    <Text fontSize="sm" color={isDarkMode ? '#94A3B8' : '#4A5568'} mb={6}>
                      Click a task to view details. Use the CarbonSense mobile app to log activities and complete challenges!
                    </Text>

                    {tasks.length > 0 ? (
                      <Grid templateColumns={{base: '1fr', sm: '1fr 1fr'}} gap={4}>
                        {tasks.map((task, index) => {
                          const dict = task.tasks_dictionary
                          const isCompleted = task.is_completed
                          const design = getTierDesign(dict.tier)

                          return (
                            <Box
                              key={index}
                              position="relative"
                              overflow="hidden"
                              borderRadius="24px"
                              bg={isCompleted ? (isDarkMode ? '#1A2234' : '#F7FAFC') : isDarkMode ? `linear-gradient(to bottom right, #1E293B, ${design.light})` : `linear-gradient(to bottom right, #FFFFFF, ${design.light})`}
                              border="1.5px solid"
                              borderColor={isCompleted ? (isDarkMode ? '#334155' : 'transparent') : `${design.main}4D`}
                              boxShadow={isCompleted ? 'none' : `0 8px 15px ${design.main}14`}
                              p={4}
                              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                              cursor={isGuest ? 'default' : 'pointer'}
                              onClick={() => !isGuest && setSelectedTask(task)}
                              _hover={!isGuest && !isCompleted ? {transform: 'translateY(-2px)', boxShadow: `0 12px 20px ${design.main}26`} : {}}
                              _active={!isGuest ? {transform: 'scale(0.98)'} : {}}
                            >
                              {!isCompleted && (
                                <Box position="absolute" right="-15px" bottom="-15px" opacity={0.12} fontSize="85px" lineHeight="1" pointerEvents="none" userSelect="none">
                                  {design.icon}
                                </Box>
                              )}

                              <Flex direction="column" h="100%" position="relative" zIndex={1}>
                                <Flex justify="space-between" align="flex-start" mb={3}>
                                  <Flex
                                    align="center"
                                    gap={1.5}
                                    w="fit-content"
                                    px={2.5}
                                    py={1}
                                    bg={isCompleted ? (isDarkMode ? '#334155' : '#EDF2F7') : design.badgeBg}
                                    border="1px solid"
                                    borderColor={isCompleted ? 'transparent' : `${design.main}4D`}
                                    borderRadius="lg"
                                  >
                                    <Text fontSize="10px" opacity={isCompleted ? 0.5 : 1}>
                                      {design.icon}
                                    </Text>
                                    <Text fontSize="9px" fontWeight="900" letterSpacing="1.2px" textTransform="uppercase" color={isCompleted ? (isDarkMode ? '#94A3B8' : '#718096') : design.main}>
                                      {dict.tier}
                                    </Text>
                                  </Flex>

                                  <Flex w="20px" h="20px" borderRadius="md" border={isCompleted ? 'none' : `2px solid ${design.main}`} bg={isCompleted ? '#38A169' : 'transparent'} align="center" justify="center" flexShrink={0}>
                                    {isCompleted && (
                                      <Text fontSize="10px" color="white" fontWeight="bold">
                                        ✓
                                      </Text>
                                    )}
                                  </Flex>
                                </Flex>

                                <Text fontWeight="700" fontSize="sm" color={isCompleted ? (isDarkMode ? '#64748B' : '#A0AEC0') : isDarkMode ? '#F8FAFC' : '#2D3748'} textDecoration={isCompleted ? 'line-through' : 'none'}>
                                  {dict.description}
                                </Text>
                              </Flex>
                            </Box>
                          )
                        })}
                      </Grid>
                    ) : (
                      <Center py={10}>
                        <Text color={isDarkMode ? '#94A3B8' : '#718096'} fontSize="sm" fontStyle="italic" textAlign="center">
                          Establishing your activity baseline. Log some activities or wait 7 days to unlock your personalized weekly missions!
                        </Text>
                      </Center>
                    )}
                  </Box>
                </VStack>
              </GridItem>

              <GridItem colSpan={1} animation={`${slideUp} 0.5s ease-out 0.3s both`}>
                <VStack gap={{base: 6, md: 8}} align="stretch" h="100%">
                  {/* Goal Card */}
                  <Box
                    p={{base: 5, md: 6}}
                    borderRadius="xl"
                    border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.2)'}`}
                    bg={isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                    backdropFilter="blur(10px)"
                    boxShadow={isDarkMode ? '0 10px 30px -5px rgba(0, 0, 0, 0.4)' : '0 10px 30px -5px rgba(28, 69, 50, 0.05)'}
                  >
                    <Text fontWeight="bold" color={isDarkMode ? '#F8FAFC' : '#1C4532'} mb={1}>
                      Reduction Goal
                    </Text>
                    <Text fontSize="sm" color={isDarkMode ? '#94A3B8' : '#4A5568'} mb={6}>
                      Keep your footprint under {monthlyGoal} kg.
                    </Text>

                    <Box w="100%" bg={isDarkMode ? '#1E293B' : '#E6FFFA'} borderRadius="full" h="8px" mb={4} overflow="hidden">
                      <Box bg={progressPercentage >= 100 ? '#E53E3E' : isDarkMode ? '#38A169' : '#1C4532'} h="100%" w={`${Math.min(100, progressPercentage)}%`} borderRadius="full" transition="width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)" />
                    </Box>

                    <Flex justify="space-between" fontSize="xs" fontWeight="bold" color={progressPercentage >= 100 ? '#FC8181' : isDarkMode ? '#94A3B8' : '#4A5568'}>
                      <Text>{stats.thisMonth.toFixed(1)} kg used</Text>
                      <Text>{remainingGoal > 0 ? `${remainingGoal.toFixed(1)} kg left` : 'Limit Exceeded'}</Text>
                    </Flex>
                  </Box>

                  {/* Recent Activity Card */}
                  <Box
                    p={{base: 5, md: 6}}
                    borderRadius="xl"
                    border={`1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(72, 187, 120, 0.2)'}`}
                    bg={isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                    backdropFilter="blur(10px)"
                    boxShadow={isDarkMode ? '0 10px 30px -5px rgba(0, 0, 0, 0.4)' : '0 10px 30px -5px rgba(28, 69, 50, 0.05)'}
                    flex="1"
                  >
                    <Text fontWeight="bold" color={isDarkMode ? '#F8FAFC' : '#1C4532'} mb={4}>
                      Recent Activity
                    </Text>
                    {recentLogs.length > 0 ? (
                      <VStack align="stretch" gap={4} divider={<Box borderBottom={`1px solid ${isDarkMode ? '#334155' : 'rgba(72, 187, 120, 0.15)'}`} />}>
                        {recentLogs.map((item, index) => {
                          const amountVal = Number(item.amount) || 0
                          const isNegative = amountVal < 0
                          const resolvedColor = isNegative ? '#38A169' : isDarkMode ? '#F8FAFC' : '#1A202C'

                          return (
                            <Box
                              key={item.id || index}
                              py={1}
                              px={2}
                              mx={-2}
                              borderRadius="md"
                              cursor={item.type === 'log' ? 'pointer' : 'default'}
                              transition="all 0.2s"
                              _hover={item.type === 'log' ? {transform: 'translateX(4px)', bg: isDarkMode ? '#334155' : 'rgba(72, 187, 120, 0.05)'} : {}}
                              onClick={() => {
                                if (item.type === 'log' && !isGuest) setSelectedLog(item)
                              }}
                            >
                              <Flex justify="space-between" align="center" mb={1}>
                                <Text fontWeight="600" fontSize="sm" color={isDarkMode ? '#F8FAFC' : '#1C4532'} noOfLines={1}>
                                  {item.action}
                                </Text>
                                <Text fontWeight="black" fontSize="sm" color={resolvedColor}>
                                  {item.displayAmount}
                                </Text>
                              </Flex>
                              <Flex justify="space-between" align="center">
                                <Text fontSize="10px" color={isDarkMode ? '#64748B' : '#718096'} fontWeight="black" textTransform="uppercase" letterSpacing="wider">
                                  {item.category}
                                </Text>
                                <Text fontSize="xs" color={isDarkMode ? '#64748B' : '#718096'}>
                                  {item.time}
                                </Text>
                              </Flex>
                            </Box>
                          )
                        })}
                      </VStack>
                    ) : (
                      <Center h="100px">
                        <Text color={isDarkMode ? '#64748B' : '#718096'} fontSize="sm">
                          No logs or completed tasks yet.
                        </Text>
                      </Center>
                    )}
                  </Box>
                </VStack>
              </GridItem>
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* 🟢 CHALLENGE DETAIL POP-UP MODAL */}
      {selectedTask && !isGuest && (
        <Flex position="fixed" top={0} left={0} w="100vw" h="100vh" bg="rgba(15, 23, 42, 0.7)" backdropFilter="blur(6px)" zIndex={9999} align="center" justify="center" px={4} onClick={() => setSelectedTask(null)}>
          <Box
            bg={isDarkMode ? '#1E293B' : 'white'}
            border={`1px solid ${isDarkMode ? '#334155' : 'transparent'}`}
            p={{base: 5, md: 8}}
            borderRadius="3xl"
            maxW="410px"
            w="100%"
            boxShadow={isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(28, 69, 50, 0.25)'}
            onClick={e => e.stopPropagation()}
            position="relative"
            animation={`${modalGrow} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both`}
          >
            <Button
              type="button"
              position="absolute"
              top={4}
              right={4}
              size="sm"
              variant="ghost"
              borderRadius="full"
              color={isDarkMode ? '#94A3B8' : '#4A5568'}
              _hover={{bg: isDarkMode ? '#334155' : '#F0FFF4', color: isDarkMode ? '#F8FAFC' : '#1C4532'}}
              onClick={e => {
                e.preventDefault()
                setSelectedTask(null)
              }}
            >
              ✕
            </Button>

            <Flex gap={2} mb={4}>
              <Flex align="center" gap={1.5} px={3} py={1} bg={getTierDesign(selectedTask.tasks_dictionary.tier).badgeBg} border="1px solid" borderColor={`${getTierDesign(selectedTask.tasks_dictionary.tier).main}4D`} borderRadius="lg">
                <Text fontSize="12px">{getTierDesign(selectedTask.tasks_dictionary.tier).icon}</Text>
                <Text fontSize="10px" fontWeight="900" textTransform="uppercase" letterSpacing="wide" color={getTierDesign(selectedTask.tasks_dictionary.tier).main}>
                  {selectedTask.tasks_dictionary.tier} Challenge
                </Text>
              </Flex>
            </Flex>

            <Heading size="md" color={isDarkMode ? '#F8FAFC' : '#1C4532'} mb={4} lineHeight="1.5">
              {selectedTask.tasks_dictionary.description}
            </Heading>

            <Box p={5} bg={isDarkMode ? '#143124' : '#F0FFF4'} border={`1px solid ${isDarkMode ? '#276749' : '#C6F6D5'}`} borderRadius="2xl" mb={6}>
              <Text fontSize="xs" color={isDarkMode ? '#9AE6B4' : '#276749'} fontWeight="black" textTransform="uppercase" letterSpacing="wider" mb={1}>
                Estimated Impact
              </Text>
              <Text fontSize="2xl" fontWeight="black" color="#38A169">
                -{selectedTask.tasks_dictionary.co2_saved_estimate || 0}{' '}
                <Text as="span" fontSize="md" fontWeight="bold">
                  kg CO₂
                </Text>
              </Text>
              <Text fontSize="xs" color={isDarkMode ? '#68D391' : '#2F855A'} mt={1.5} lineHeight="1.4">
                Completing this task directly reduces your footprint.
              </Text>
            </Box>

            <Button
              type="button"
              w="100%"
              bg={isDarkMode ? '#2F855A' : '#22543D'}
              color="white"
              size="lg"
              borderRadius="xl"
              transition="all 0.2s"
              boxShadow="0 8px 20px rgba(34, 84, 61, 0.15)"
              _hover={{bg: isDarkMode ? '#38A169' : '#1C4532', transform: 'translateY(-1px)'}}
              _active={{transform: 'translateY(1px)'}}
              onClick={e => {
                e.preventDefault()
                setSelectedTask(null)
              }}
            >
              Close
            </Button>
          </Box>
        </Flex>
      )}

      {/* 🟢 ACTIVITY LOG DETAIL POP-UP MODAL */}
      {selectedLog && !isGuest && (
        <Flex position="fixed" top={0} left={0} w="100vw" h="100vh" bg="rgba(15, 23, 42, 0.7)" backdropFilter="blur(6px)" zIndex={9999} align="center" justify="center" px={4} onClick={() => setSelectedLog(null)}>
          <Box
            bg={isDarkMode ? '#1E293B' : 'white'}
            border={`1px solid ${isDarkMode ? '#334155' : 'transparent'}`}
            p={{base: 5, md: 8}}
            borderRadius="3xl"
            maxW="410px"
            w="100%"
            boxShadow={isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(28, 69, 50, 0.25)'}
            onClick={e => e.stopPropagation()}
            position="relative"
            animation={`${modalGrow} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both`}
          >
            <Button
              type="button"
              position="absolute"
              top={4}
              right={4}
              size="sm"
              variant="ghost"
              borderRadius="full"
              color={isDarkMode ? '#94A3B8' : '#4A5568'}
              _hover={{bg: isDarkMode ? '#3B1E22' : '#FFF5F5', color: '#FC8181'}}
              onClick={e => {
                e.preventDefault()
                setSelectedLog(null)
              }}
            >
              ✕
            </Button>

            <Flex gap={2} mb={4}>
              <Box
                px={2.5}
                py={0.5}
                bg={isDarkMode ? '#334155' : '#EDF2F7'}
                color={isDarkMode ? '#F8FAFC' : '#4A5568'}
                border={`1px solid ${isDarkMode ? '#475569' : '#E2E8F0'}`}
                borderRadius="md"
                fontSize="10px"
                fontWeight="black"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                {selectedLog.time}
              </Box>
              <Box
                px={2.5}
                py={0.5}
                bg={isDarkMode ? '#1E3A2F' : '#E6FFFA'}
                color={isDarkMode ? '#9AE6B4' : '#234E52'}
                border={`1px solid ${isDarkMode ? '#276749' : '#B2F5EA'}`}
                borderRadius="md"
                fontSize="10px"
                fontWeight="black"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                {selectedLog.category} Log
              </Box>
            </Flex>

            <Heading size="md" color={isDarkMode ? '#F8FAFC' : '#1C4532'} mb={6} lineHeight="1.5">
              {selectedLog.action}
            </Heading>

            <VStack align="stretch" spacing={4} mb={6}>
              {selectedLog.inputValue && (
                <Box>
                  <Text fontSize="10px" fontWeight="black" color={isDarkMode ? '#64748B' : '#A0AEC0'} textTransform="uppercase" letterSpacing="wider" mb={1}>
                    Recorded Input
                  </Text>
                  <Text fontSize="sm" color={isDarkMode ? '#E2E8F0' : '#2D3748'} fontWeight="medium">
                    {selectedLog.inputValue}
                  </Text>
                </Box>
              )}
              {selectedLog.ingredients && selectedLog.ingredients.length > 0 && (
                <Box>
                  <Text fontSize="10px" fontWeight="black" color={isDarkMode ? '#64748B' : '#A0AEC0'} textTransform="uppercase" letterSpacing="wider" mb={1.5}>
                    Extracted Ingredients
                  </Text>
                  <Flex wrap="wrap" gap={1.5}>
                    {selectedLog.ingredients.map((ing, i) => (
                      <Badge
                        key={i}
                        bg={isDarkMode ? '#143124' : '#F4F9F5'}
                        color={isDarkMode ? '#68D391' : '#276749'}
                        border={`1px solid ${isDarkMode ? '#276749' : '#9AE6B4'}`}
                        borderRadius="md"
                        px={2}
                        py={0.5}
                        fontSize="xs"
                        textTransform="capitalize"
                        fontWeight="medium"
                      >
                        {ing}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              )}
              {(selectedLog.startLocation || selectedLog.endLocation) && (
                <Box>
                  <Text fontSize="10px" fontWeight="black" color={isDarkMode ? '#64748B' : '#A0AEC0'} textTransform="uppercase" letterSpacing="wider" mb={1.5}>
                    Route Details
                  </Text>
                  <Box p={3} bg={isDarkMode ? '#0F172A' : '#F7FAFC'} borderRadius="lg" border={`1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`}>
                    {selectedLog.startLocation && (
                      <Flex align="flex-start" gap={3} mb={selectedLog.endLocation ? 3 : 0}>
                        <Box mt={1} w="8px" h="8px" borderRadius="full" bg="#4299E1" flexShrink={0} />
                        <Box>
                          <Text fontSize="10px" color={isDarkMode ? '#64748B' : '#718096'} fontWeight="bold" textTransform="uppercase">
                            Origin
                          </Text>
                          <Text fontSize="xs" color={isDarkMode ? '#E2E8F0' : '#2D3748'} fontWeight="medium" noOfLines={2}>
                            {selectedLog.startLocation}
                          </Text>
                        </Box>
                      </Flex>
                    )}
                    {selectedLog.endLocation && (
                      <Flex align="flex-start" gap={3}>
                        <Box mt={1} w="8px" h="8px" borderRadius="full" bg="#E53E3E" flexShrink={0} />
                        <Box>
                          <Text fontSize="10px" color={isDarkMode ? '#64748B' : '#718096'} fontWeight="bold" textTransform="uppercase">
                            Destination
                          </Text>
                          <Text fontSize="xs" color={isDarkMode ? '#E2E8F0' : '#2D3748'} fontWeight="medium" noOfLines={2}>
                            {selectedLog.endLocation}
                          </Text>
                        </Box>
                      </Flex>
                    )}
                  </Box>
                </Box>
              )}
            </VStack>

            <Box p={5} bg={isDarkMode ? '#3B1E22' : '#FFF5F5'} border={`1px solid ${isDarkMode ? '#9B2C2C' : '#FED7D7'}`} borderRadius="2xl" mb={6}>
              <Text fontSize="xs" color={isDarkMode ? '#FC8181' : '#C53030'} fontWeight="black" textTransform="uppercase" letterSpacing="wider" mb={1}>
                Calculated Emission
              </Text>
              <Text fontSize="2xl" fontWeight="black" color={isDarkMode ? '#FEB2B2' : '#E53E3E'}>
                {selectedLog.displayAmount}
              </Text>
              <Text fontSize="xs" color={isDarkMode ? '#FC8181' : '#9B2C2C'} mt={1.5} lineHeight="1.4">
                This amount was added to your monthly total.
              </Text>
            </Box>

            <Button
              type="button"
              w="100%"
              bg={isDarkMode ? '#334155' : '#2D3748'}
              color="white"
              size="lg"
              borderRadius="xl"
              transition="all 0.2s"
              boxShadow="0 8px 20px rgba(45, 55, 72, 0.15)"
              _hover={{bg: isDarkMode ? '#475569' : '#1A202C', transform: 'translateY(-1px)'}}
              _active={{transform: 'translateY(1px)'}}
              onClick={e => {
                e.preventDefault()
                setSelectedLog(null)
              }}
            >
              Close Details
            </Button>
          </Box>
        </Flex>
      )}
    </Box>
  )
}
