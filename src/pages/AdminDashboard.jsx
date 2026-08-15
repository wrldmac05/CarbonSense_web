// pages/AdminDashboard.jsx
import {useState, useEffect, useRef} from 'react'
import {Box, Heading, Text, Input, Button, VStack, Flex, Grid, Badge, Spinner, Center, Menu, Textarea, Image, Tooltip as ChakraTooltip} from '@chakra-ui/react'
import {keyframes} from '@emotion/react'
import {useNavigate} from 'react-router-dom'
import {supabase} from '../supabase'
import {AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts'

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

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

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Data States
  const [factors, setFactors] = useState([])
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])

  // Modals & Forms State
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  // Custom Internal Notification State
  const [notification, setNotification] = useState(null)
  const notificationTimer = useRef(null)

  // Filter tab state for User Management
  const [userFilter, setUserFilter] = useState('all')

  const showNotification = (title, description, status = 'success') => {
    setNotification({title, description, status})
    if (notificationTimer.current) clearTimeout(notificationTimer.current)
    notificationTimer.current = setTimeout(() => {
      setNotification(null)
    }, 5000)
  }

  // Factor States
  const [selectedFactor, setSelectedFactor] = useState(null)
  const [newCo2Value, setNewCo2Value] = useState('')
  const [isSavingFactor, setIsSavingFactor] = useState(false)
  const [isAddFactorOpen, setIsAddFactorOpen] = useState(false)
  const [addFactorData, setAddFactorData] = useState({
    category: 'Transport',
    activity_name: '',
    unit: '',
    co2_per_unit: ''
  })

  // Task States
  const [selectedTask, setSelectedTask] = useState(null)
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskCo2, setNewTaskCo2] = useState('')
  const [isSavingTask, setIsSavingTask] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [addTaskData, setAddTaskData] = useState({
    tier: 'Bronze',
    target_lifestyle_tag: 'General',
    description: '',
    co2_saved_estimate: ''
  })

  // AI Prescription States
  const [prescriptions, setPrescriptions] = useState({
    daily: 'Syncing latest daily telemetry...',
    weekly: 'Syncing latest weekly telemetry...',
    monthly: 'Syncing latest monthly telemetry...'
  })
  const [activeInsightTab, setActiveInsightTab] = useState('daily')

  // CALENDAR & TIMETRAVEL STATE
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [rawGlobalData, setRawGlobalData] = useState(null)

  // OVERVIEW ANALYTICS STATE
  const [overviewStats, setOverviewStats] = useState({
    totalUsers: 0,
    totalCo2: 0,
    avgTarget: 0,
    monthlyUsers: [],
    monthlyEmissions: [],
    categoryData: [],
    diets: {},
    commutes: {},
    locations: {}
  })

  const PIE_COLORS = ['#38A169', '#3182CE', '#D69E2E', '#E53E3E', '#805AD5']

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const {
          data: {user}
        } = await supabase.auth.getUser()
        if (!user) return navigate('/login', {replace: true})

        const {data} = await supabase.from('user_profiles').select('display_name, avatar_url, role').eq('user_id', user.id).single()

        if (data?.role !== 'admin') {
          return navigate('/dashboard', {replace: true})
        }
        setAdminUser(data)
      } catch (error) {
        console.error('Core profile synchronization failed:', error.message)
      }
    }

    fetchInitialData()
    fetchAllRawData()
    fetchPrescriptions()
  }, [navigate])

  useEffect(() => {
    if (activeTab === 'factors') fetchFactors()
    if (activeTab === 'tasks') fetchTasks()
    if (activeTab === 'users') fetchUsers()
  }, [activeTab])

  useEffect(() => {
    if (rawGlobalData && activeTab === 'overview') {
      recalculateStatsForDate(selectedDate)
    }
  }, [selectedDate, rawGlobalData, activeTab])

  const fetchAllRawData = async () => {
    try {
      const {data: profiles, error: profileErr} = await supabase.rpc('get_admin_user_list')
      if (profileErr) console.error('RPC Error:', profileErr)

      const {data: lifestyles, error: lifestyleErr} = await supabase.from('lifestyle_profiles').select('user_id, diet_type, commute_type')

      if (lifestyleErr) console.error('Lifestyle Error:', lifestyleErr)

      const {data: logs, error: logErr} = await supabase.from('activity_logs').select('total_co2e, logged_at, emission_factors ( category )')

      if (logErr) console.error('Logs Error:', logErr)

      const safeProfiles = profiles || []
      const usersData = safeProfiles.map(p => ({created_at: p.created_at})) || []

      setRawGlobalData({
        users: usersData,
        profiles: safeProfiles,
        lifestyles: lifestyles || [],
        logs: logs || []
      })
    } catch (error) {
      console.error('Error fetching raw intel:', error)
    }
  }

  const recalculateStatsForDate = date => {
    if (!rawGlobalData) return

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const {users, profiles, lifestyles, logs} = rawGlobalData

    const validUsers = users?.filter(u => new Date(u.created_at) <= endOfDay) || []
    const validLogs = logs?.filter(l => new Date(l.logged_at) <= endOfDay) || []

    const standardProfiles = profiles?.filter(p => p.role !== 'admin' && !p.is_archived) || []
    const activeProfilesCount = standardProfiles.length > 0 ? Math.min(standardProfiles.length, validUsers.length) : validUsers.length
    const totalCo2Sum = validLogs.reduce((sum, log) => sum + (parseFloat(log.total_co2e) || 0), 0)
    const validTargets = standardProfiles.filter(p => p.monthly_co2_target > 0)
    const avgTarget = validTargets.length ? validTargets.reduce((sum, p) => sum + Number(p.monthly_co2_target), 0) / validTargets.length : 0

    const months = []
    const d = new Date()
    for (let i = 5; i >= 0; i--) {
      months.push(new Date(d.getFullYear(), d.getMonth() - i, 1).toLocaleString('default', {month: 'short'}))
    }

    let cumulative = 0
    const monthlyUsers = months.map(month => {
      const count = validUsers.filter(
        u =>
          new Date(u.created_at).toLocaleString('default', {
            month: 'short'
          }) === month
      ).length
      cumulative += count
      return {month, users: cumulative}
    })

    const emissionCountsByMonth = {}
    validLogs.forEach(log => {
      const month = new Date(log.logged_at).toLocaleString('default', {
        month: 'short'
      })
      emissionCountsByMonth[month] = (emissionCountsByMonth[month] || 0) + Number(log.total_co2e)
    })
    const monthlyEmissions = months.map(month => ({
      month,
      co2: Math.round(emissionCountsByMonth[month] || 0)
    }))

    const catTotals = {}
    validLogs.forEach(log => {
      const cat = log.emission_factors?.category || 'Other'
      catTotals[cat] = (catTotals[cat] || 0) + Number(log.total_co2e)
    })
    const categoryData = Object.entries(catTotals).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }))

    const countFreq = (arr, key) =>
      arr?.reduce((acc, item) => {
        if (item && item[key]) {
          acc[item[key]] = (acc[item[key]] || 0) + 1
        }
        return acc
      }, {}) || {}

    setOverviewStats({
      totalUsers: activeProfilesCount,
      totalCo2: totalCo2Sum.toFixed(1),
      avgTarget: Math.round(avgTarget),
      monthlyUsers,
      monthlyEmissions,
      categoryData,
      diets: countFreq(lifestyles, 'diet_type'),
      commutes: countFreq(lifestyles, 'commute_type'),
      locations: countFreq(profiles, 'location')
    })
  }

  const fetchPrescriptions = async () => {
    try {
      const {data, error} = await supabase.from('system_prescriptions').select('*').order('created_at', {ascending: false}).limit(20)
      if (error) throw error
      if (data) {
        setPrescriptions({
          daily: data.find(p => p.period_type === 'daily')?.prescription_text || 'Daily environmental uplink pending. Awaiting midnight system cycle.',
          weekly: data.find(p => p.period_type === 'weekly')?.prescription_text || 'Weekly environmental uplink pending. Awaiting weekend system cycle.',
          monthly: data.find(p => p.period_type === 'monthly')?.prescription_text || 'Monthly environmental uplink pending. Awaiting end-of-month system cycle.'
        })
      }
    } catch (error) {
      console.error('Failed to load automated prescriptions:', error.message)
    }
  }

  const exportSystemReport = async () => {
    const [{data: exportFactors}, {data: exportTasks}, {data: profiles}, {data: logs}] = await Promise.all([
      supabase.from('emission_factors').select('*').order('category', {ascending: true}),
      supabase.from('tasks_dictionary').select('*').order('tier', {ascending: true}),
      supabase.rpc('get_admin_user_list'),
      supabase.from('activity_logs').select('user_id, logged_at')
    ])

    const exportUsers = (profiles || [])
      .map(user => {
        const userLogs = logs?.filter(log => log.user_id === user.user_id) || []
        const latestLog = [...userLogs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0]
        return {
          ...user,
          total_logs: userLogs.length,
          last_active: latestLog ? new Date(latestLog.logged_at).toLocaleDateString() : 'No Activity',
          status: user.role === 'admin' ? 'System' : user.is_banned ? 'Banned' : user.is_archived ? 'Archived' : userLogs.length === 0 ? 'Inactive' : 'Active'
        }
      })
      .sort((a, b) => (a.role === 'admin' ? -1 : 1))

    const escapeCsv = val => {
      if (val === null || val === undefined) return '""'
      return `"${String(val).replace(/"/g, '""')}"`
    }

    const rows = []

    rows.push(['CarbonSense Comprehensive System Ledger'])
    rows.push([`Generated On: ${new Date().toLocaleString()}`])
    rows.push([])

    rows.push(['--- EXECUTIVE SUMMARY ---'])
    rows.push(['Metric', 'Value'])
    rows.push(['Total Community Carbon Emitted (kg)', overviewStats.totalCo2])
    rows.push(['Monitored Active User Profiles', overviewStats.totalUsers])
    rows.push(['Average Community Target (kg)', overviewStats.avgTarget])
    rows.push([])

    rows.push(['--- AI EXECUTIVE PRESCRIPTIONS ---'])
    rows.push(['Period', 'Briefing'])
    Object.entries(prescriptions).forEach(([period, text]) => {
      rows.push([period.toUpperCase(), escapeCsv(text)])
    })
    rows.push([])

    rows.push(['--- 6-MONTH PLATFORM TRENDS ---'])
    rows.push(['Month', 'Active Users', 'Emissions Volume (kg)'])
    overviewStats.monthlyUsers.forEach((mu, idx) => {
      const me = overviewStats.monthlyEmissions[idx] || {co2: 0}
      rows.push([mu.month, mu.users, me.co2])
    })
    rows.push([])

    rows.push(['--- SECTOR BREAKDOWN ---'])
    rows.push(['Category', 'CO2 Contribution (kg)'])
    overviewStats.categoryData.forEach(cat => rows.push([cat.name, cat.value]))
    rows.push([])

    const addDemographicSection = (title, dataObj) => {
      rows.push([`--- DEMOGRAPHICS: ${title.toUpperCase()} ---`])
      rows.push([title, 'User Count'])
      Object.entries(dataObj)
        .sort(([, a], [, b]) => b - a)
        .forEach(([key, count]) => rows.push([escapeCsv(key), count]))
      rows.push([])
    }
    addDemographicSection('Diet', overviewStats.diets)
    addDemographicSection('Commute', overviewStats.commutes)
    addDemographicSection('Location', overviewStats.locations)

    rows.push(['--- EMISSION FACTORS DICTIONARY ---'])
    rows.push(['Category', 'Activity Name', 'CO2 per Unit (kg)', 'Unit'])
    ;(exportFactors || []).forEach(f => {
      rows.push([f.category, escapeCsv(f.activity_name), f.co2_per_unit, escapeCsv(f.unit)])
    })
    rows.push([])

    rows.push(['--- GAMIFIED TASK DICTIONARY ---'])
    rows.push(['Tier', 'Target Tag', 'Description', 'CO2 Saved Estimate (kg)'])
    ;(exportTasks || []).forEach(t => {
      rows.push([t.tier, t.target_lifestyle_tag, escapeCsv(t.description), t.co2_saved_estimate])
    })
    rows.push([])

    rows.push(['--- USER DIRECTORY ---'])
    rows.push(['Identity', 'Role', 'Status', 'Total Logs', 'Last Active', 'Target Limit (kg)'])
    exportUsers.forEach(u => {
      const isStaff = u.role === 'admin'
      const displayName = isStaff ? u.display_name || 'Administrator' : `User #${u.profile_id.substring(0, 6).toUpperCase()}`
      rows.push([escapeCsv(displayName), u.role, u.status, u.total_logs, escapeCsv(u.last_active), isStaff ? 'N/A' : u.monthly_co2_target])
    })

    const csvContent = rows.map(row => row.join(',')).join('\n')

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {type: 'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `CarbonSense_Comprehensive_Ledger_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const fetchFactors = async () => {
    setIsLoading(true)
    const {data} = await supabase.from('emission_factors').select('*').order('category', {ascending: true})
    setFactors(data || [])
    setIsLoading(false)
  }

  const fetchTasks = async () => {
    setIsLoading(true)
    const {data} = await supabase.from('tasks_dictionary').select('*').order('tier', {ascending: true})
    setTasks(data || [])
    setIsLoading(false)
  }

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const {data: profiles} = await supabase.rpc('get_admin_user_list')
      const {data: logs} = await supabase.from('activity_logs').select('user_id, logged_at')
      const enrichedUsers = profiles?.map(user => {
        const userLogs = logs?.filter(log => log.user_id === user.user_id) || []
        const latestLog = [...userLogs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0]
        return {
          ...user,
          total_logs: userLogs.length,
          last_active: latestLog ? new Date(latestLog.logged_at).toLocaleDateString() : 'No Activity',
          status: user.role === 'admin' ? 'System' : user.is_banned ? 'Banned' : user.is_archived ? 'Archived' : userLogs.length === 0 ? 'Inactive' : 'Active'
        }
      })
      setUsers(enrichedUsers?.sort((a, b) => (a.role === 'admin' ? -1 : 1)) || [])
    } catch (error) {
      console.error('User synchronization error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = email => {
    if (!email) {
      return showNotification('Telemetry Failure', 'Target user lacks a verified communication channel (email).', 'warning')
    }
    setConfirmDialog({
      title: 'Initialize Secure Override Protocol?',
      message: `A password reset uplink will be dispatched to ${email}.`,
      confirmText: 'Dispatch Uplink',
      isDanger: false,
      onConfirm: async () => {
        setIsProcessingAction(true)
        try {
          const {error} = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`
          })
          if (error) throw error
          showNotification('Override Uplink Dispatched', 'The user will receive secure recovery instructions shortly.', 'success')
        } catch (error) {
          showNotification('Transmission Failed', error.message, 'error')
        } finally {
          setIsProcessingAction(false)
          setConfirmDialog(null)
        }
      }
    })
  }

  const handleToggleBan = (profileId, isBanned, displayName) => {
    const actionText = isBanned ? 'Unban' : 'Ban'
    setConfirmDialog({
      title: `${actionText} User Account?`,
      message: isBanned ? `Unbanning ${displayName} will restore their platform privileges.` : `Banning ${displayName} will immediately block them from creating activity logs and using the system due to policy violations.`,
      confirmText: `${actionText} Account`,
      isDanger: !isBanned,
      onConfirm: async () => {
        setIsProcessingAction(true)
        try {
          const {error} = await supabase.rpc('admin_toggle_ban_user', {
            target_profile_id: profileId,
            ban_status: !isBanned
          })
          if (error) throw error
          showNotification(`Account ${actionText}ned`, `User status updated successfully.`, 'success')
          fetchUsers()
          fetchAllRawData()
        } catch (error) {
          showNotification('Operation Aborted', error.message, 'error')
        } finally {
          setIsProcessingAction(false)
          setConfirmDialog(null)
        }
      }
    })
  }

  const handleToggleArchive = (profileId, isArchived, displayName) => {
    const actionText = isArchived ? 'Restore' : 'Archive'
    setConfirmDialog({
      title: `${actionText} User Account?`,
      message: isArchived ? `Restoring ${displayName} will reactivate access to the platform.` : `Archiving ${displayName} will disable their access, but retain activity telemetry for research analytics.`,
      confirmText: `${actionText} Account`,
      isDanger: !isArchived,
      onConfirm: async () => {
        setIsProcessingAction(true)
        try {
          const {error} = await supabase.rpc('admin_toggle_archive_user', {
            target_profile_id: profileId,
            archive_status: !isArchived
          })
          if (error) throw error
          showNotification(`Account ${actionText}d`, `User state updated successfully.`, 'success')
          fetchUsers()
          fetchAllRawData()
        } catch (error) {
          showNotification('Operation Aborted', error.message, 'error')
        } finally {
          setIsProcessingAction(false)
          setConfirmDialog(null)
        }
      }
    })
  }

  const handleAddFactor = async () => {
    if (!addFactorData.activity_name || !addFactorData.unit || !addFactorData.co2_per_unit) return
    setIsSavingFactor(true)
    try {
      const newFactor = {
        factor_id: crypto.randomUUID(),
        category: addFactorData.category,
        activity_name: addFactorData.activity_name,
        unit: addFactorData.unit,
        co2_per_unit: parseFloat(addFactorData.co2_per_unit)
      }
      const {data, error} = await supabase.from('emission_factors').insert([newFactor]).select()
      if (error) throw error
      setFactors([...factors, data[0]])
      setIsAddFactorOpen(false)
      setAddFactorData({
        category: 'Transport',
        activity_name: '',
        unit: '',
        co2_per_unit: ''
      })
      showNotification('Matrix Updated', 'New emission multiplier successfully injected.', 'success')
    } catch (error) {
      showNotification('System Error', 'Unable to inject new emission multiplier into the core matrix.', 'error')
    } finally {
      setIsSavingFactor(false)
    }
  }

  const handleUpdateFactor = async () => {
    if (!selectedFactor || !newCo2Value) return
    setIsSavingFactor(true)
    try {
      const {error} = await supabase
        .from('emission_factors')
        .update({co2_per_unit: parseFloat(newCo2Value)})
        .eq('factor_id', selectedFactor.factor_id)
      if (error) throw error
      setFactors(factors.map(f => (f.factor_id === selectedFactor.factor_id ? {...f, co2_per_unit: parseFloat(newCo2Value)} : f)))
      setSelectedFactor(null)
      showNotification('Matrix Recalibrated', 'Emission multiplier successfully updated.', 'success')
    } catch (error) {
      showNotification('System Error', 'Failed to recalibrate emission multiplier.', 'error')
    } finally {
      setIsSavingFactor(false)
    }
  }

  const handleAddTask = async () => {
    if (!addTaskData.description || !addTaskData.co2_saved_estimate) return
    setIsSavingTask(true)
    try {
      const newTask = {
        task_id: crypto.randomUUID(),
        tier: addTaskData.tier,
        target_lifestyle_tag: addTaskData.target_lifestyle_tag,
        description: addTaskData.description,
        co2_saved_estimate: parseFloat(addTaskData.co2_saved_estimate)
      }
      const {data, error} = await supabase.from('tasks_dictionary').insert([newTask]).select()
      if (error) throw error
      setTasks([...tasks, data[0]])
      setIsAddTaskOpen(false)
      setAddTaskData({
        tier: 'Bronze',
        target_lifestyle_tag: 'General',
        description: '',
        co2_saved_estimate: ''
      })
      showNotification('Directive Added', 'New eco-directive injected into the gamified dictionary.', 'success')
    } catch (error) {
      showNotification('System Error', 'Unable to inject new eco-directive into the gamified dictionary.', 'error')
    } finally {
      setIsSavingTask(false)
    }
  }

  const handleUpdateTask = async () => {
    if (!selectedTask || !newTaskDesc || !newTaskCo2) return
    setIsSavingTask(true)
    try {
      const {error} = await supabase
        .from('tasks_dictionary')
        .update({
          description: newTaskDesc,
          co2_saved_estimate: parseFloat(newTaskCo2)
        })
        .eq('task_id', selectedTask.task_id)
      if (error) throw error
      setTasks(
        tasks.map(t =>
          t.task_id === selectedTask.task_id
            ? {
                ...t,
                description: newTaskDesc,
                co2_saved_estimate: parseFloat(newTaskCo2)
              }
            : t
        )
      )
      setSelectedTask(null)
      showNotification('Directive Recalibrated', 'The eco-directive has been successfully updated.', 'success')
    } catch (error) {
      showNotification('System Error', 'Failed to recalibrate the eco-directive.', 'error')
    } finally {
      setIsSavingTask(false)
    }
  }

  const executeDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      if (deleteTarget.type === 'factor') {
        const {error} = await supabase.from('emission_factors').delete().eq('factor_id', deleteTarget.id)
        if (error) throw error
        setFactors(factors.filter(f => f.factor_id !== deleteTarget.id))
      } else if (deleteTarget.type === 'task') {
        const {error} = await supabase.from('tasks_dictionary').delete().eq('task_id', deleteTarget.id)
        if (error) throw error
        setTasks(tasks.filter(t => t.task_id !== deleteTarget.id))
      }

      showNotification('Asset Eradicated', 'The selected entity has been permanently purged from the system.', 'success')
      setDeleteTarget(null)
    } catch (error) {
      showNotification('Eradication Protocol Failed', error.message, 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    const offset = firstDay === 0 ? 6 : firstDay - 1

    const days = []
    for (let i = 0; i < offset; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i))
    return days
  }

  const SidebarButton = ({id, icon, tooltip}) => (
    <Flex
      w="46px"
      h="46px"
      borderRadius="xl"
      align="center"
      justify="center"
      cursor="pointer"
      title={tooltip}
      bg={activeTab === id ? '#1A202C' : 'transparent'}
      color={activeTab === id ? 'white' : '#1C4532'}
      _hover={{
        bg: activeTab === id ? '#1A202C' : '#E6EBE6',
        color: '#1C4532'
      }}
      transition="all 0.2s ease"
      onClick={() => setActiveTab(id)}
    >
      <Flex align="center" justify="center">
        {icon}
      </Flex>
    </Flex>
  )

  const renderDemographicBar = (label, count, total) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0
    return (
      <Box key={label} w="100%">
        <Flex justify="space-between" mb={1}>
          <Text fontSize="xs" fontWeight="bold" color="#4A5568">
            {label}
          </Text>
          <Text fontSize="xs" color="#718096" fontWeight="bold">
            {percentage}%{' '}
            <Text as="span" fontWeight="normal">
              ({count})
            </Text>
          </Text>
        </Flex>
        <Box w="100%" h="6px" bg="#EDF2F7" borderRadius="full" overflow="hidden">
          <Box h="100%" w={`${percentage}%`} bg="#38A169" transition="width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)" />
        </Box>
      </Box>
    )
  }
  const getTop5 = dataObj =>
    Object.entries(dataObj)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

  return (
    <Flex minH="100vh" bg="#F3F5F8" direction={{base: 'column', md: 'row'}} position="relative" overflow="hidden">
      {/* MOBILE TOP NAVIGATION TABS BAR */}
      <Flex display={{base: 'flex', md: 'none'}} bg="white" px={4} py={3} borderBottom="1px solid #E2E8F0" align="center" justify="space-between" overflowX="auto">
        <Flex gap={2}>
          {[
            {id: 'overview', label: 'Overview'},
            {id: 'factors', label: 'Factors'},
            {id: 'tasks', label: 'Tasks'},
            {id: 'users', label: 'Users'}
          ].map(tab => (
            <Button key={tab.id} size="xs" borderRadius="full" px={3} py={2} bg={activeTab === tab.id ? '#1A202C' : '#F7FAFC'} color={activeTab === tab.id ? 'white' : '#4A5568'} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </Button>
          ))}
        </Flex>
        <Button size="xs" variant="ghost" color="#E53E3E" onClick={handleLogout}>
          Log Out
        </Button>
      </Flex>

      {/* FLOATING MINI-SIDEBAR (DESKTOP) */}
      <Flex direction="column" align="center" w="100px" py={8} h="100vh" display={{base: 'none', md: 'flex'}}>
        <Flex direction="column" align="center" mb={10} cursor="pointer" transition="transform 0.2s" _hover={{transform: 'scale(1.05)'}}>
          <Image src="/Logo.png" alt="CarbonSense Logo" w="44px" h="44px" objectFit="contain" mb={2} dropShadow="0 4px 10px rgba(0,0,0,0.1)" />
          <Text color="#A0AEC0" fontWeight="black" fontSize="10px" letterSpacing="widest" textTransform="uppercase">
            Admin
          </Text>
        </Flex>

        <VStack bg="white" borderRadius="full" py={6} px={3} spacing={5} boxShadow="0 10px 30px -10px rgba(0,0,0,0.05)">
          <SidebarButton
            id="overview"
            tooltip="Overview Analytics"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            }
          />
          <SidebarButton
            id="factors"
            tooltip="Emission Factors"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            }
          />
          <SidebarButton
            id="tasks"
            tooltip="Task Dictionary"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            }
          />
          <SidebarButton
            id="users"
            tooltip="User Management"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
        </VStack>

        <Box mt="auto" position="relative">
          <Flex
            w="52px"
            h="52px"
            bg="white"
            borderRadius="full"
            align="center"
            justify="center"
            p={0.5}
            boxShadow="0 10px 25px -5px rgba(0,0,0,0.08)"
            cursor="pointer"
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              transform: 'scale(1.05)',
              boxShadow: '0 12px 30px -5px rgba(28, 69, 50, 0.15)'
            }}
            _active={{transform: 'scale(0.95)'}}
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          >
            <Flex
              w="100%"
              h="100%"
              borderRadius="full"
              bg="#1C4532"
              color="white"
              align="center"
              justify="center"
              fontWeight="black"
              fontSize="sm"
              overflow="hidden"
              backgroundImage={adminUser?.avatar_url ? `url(${adminUser.avatar_url})` : 'none'}
              backgroundSize="cover"
              backgroundPosition="center"
            >
              {!adminUser?.avatar_url && (adminUser?.display_name ? adminUser.display_name.charAt(0).toUpperCase() : 'A')}
            </Flex>
          </Flex>

          {isProfileMenuOpen && <Box position="fixed" top={0} left={0} w="100vw" h="100vh" zIndex={9} onClick={() => setIsProfileMenuOpen(false)} />}

          <Box
            position="absolute"
            bottom="65px"
            left="12px"
            w="220px"
            bg="white"
            borderRadius="2xl"
            boxShadow="0 15px 35px -5px rgba(0, 0, 0, 0.1), 0 5px 15px -5px rgba(0, 0, 0, 0.05)"
            border="1px solid #E2E8F0"
            zIndex={10}
            py={2}
            transition="all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
            transform={isProfileMenuOpen ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)'}
            opacity={isProfileMenuOpen ? 1 : 0}
            pointerEvents={isProfileMenuOpen ? 'auto' : 'none'}
          >
            <Box position="absolute" bottom="-6px" left="18px" w="12px" h="12px" bg="white" transform="rotate(45deg)" borderRight="1px solid #E2E8F0" borderBottom="1px solid #E2E8F0" zIndex={-1} />

            <Box px={4} py={3} borderBottom="1px solid #F1F5F9" mb={1}>
              <Text fontSize="10px" fontWeight="black" color="#A0AEC0" textTransform="uppercase" letterSpacing="wider">
                System Access
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="#1A202C" mt={0.5} isTruncated>
                {adminUser?.display_name || 'Administrator'}
              </Text>
            </Box>

            <Button
              w="100%"
              justifyContent="flex-start"
              bg="transparent"
              px={4}
              py={5}
              fontSize="sm"
              fontWeight="bold"
              color="#E53E3E"
              borderRadius="none"
              _hover={{bg: '#FFF5F5', color: '#C53030'}}
              _active={{bg: '#FED7D7'}}
              onClick={handleLogout}
            >
              <Text as="span" mr={2}>
                Secure Log Out
              </Text>
            </Button>
          </Box>
        </Box>
      </Flex>

      {/* MAIN CONTENT AREA */}
      <Flex flex="1" direction="column" maxH="100vh" overflowY="auto" px={{base: 4, sm: 6, lg: 10}} py={{base: 6, md: 10}}>
        <Flex justify="space-between" align="center" mb={{base: 6, md: 10}} gap={2}>
          <Box>
            <Heading size={{base: 'md', md: 'lg'}} color="#1A202C" letterSpacing="tight">
              Hi, {adminUser?.display_name?.split(' ')[0] || 'Admin'}!
            </Heading>
            <Text color="#718096" fontSize={{base: 'xs', md: 'sm'}} mt={1}>
              Community activity up to {selectedDate.toLocaleDateString()}.
            </Text>
          </Box>
          {/* 🟢 ALWAYS VISIBLE & RESPONSIVE EXPORT LEDGER BUTTON */}
          <Button
            bg="#1A202C"
            color="white"
            borderRadius="full"
            px={{base: 4, md: 8}}
            py={{base: 3, md: 6}}
            fontSize={{base: 'xs', md: 'sm'}}
            _hover={{bg: '#2D3748', transform: 'translateY(-2px)'}}
            transition="all 0.2s"
            onClick={exportSystemReport}
            display="inline-flex"
            flexShrink={0}
          >
            Export Ledger
          </Button>
        </Flex>

        {activeTab === 'overview' && (
          <Box>
            <Grid templateColumns={{base: '1fr', xl: '1.5fr 1fr'}} gap={{base: 6, md: 8}} mb={8} animation={`${slideUp} 0.6s ease-out 0.1s both`}>
              <Flex
                direction="column"
                bg="linear-gradient(135deg, #276749 0%, #1C4532 100%)"
                borderRadius="3xl"
                p={{base: 5, md: 8}}
                color="white"
                position="relative"
                overflow="hidden"
                boxShadow="xl"
                minH={{base: 'auto', md: '340px'}}
                justify="space-between"
              >
                <Box position="absolute" right="-5%" top="-15%" opacity="0.05" fontSize="250px" pointerEvents="none" userSelect="none">
                  🌍
                </Box>

                <Box position="relative" zIndex={1} mb={4}>
                  <Flex align="center" gap={2} mb={1}>
                    <Badge bg="rgba(255,255,255,0.2)" color="white" px={3} py={1} borderRadius="full" fontSize="2xs" letterSpacing="widest" backdropFilter="blur(10px)">
                      LIVE TELEMETRY
                    </Badge>
                  </Flex>
                  <Text color="#9AE6B4" fontSize="xs" mt={2} fontWeight="medium">
                    System records up to {selectedDate.toLocaleDateString()}
                  </Text>
                </Box>

                <Box position="relative" zIndex={1} mb={{base: 6, md: 8}}>
                  <Text fontSize="xs" color="#C6F6D5" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" mb={2}>
                    Gross Carbon Footprint
                  </Text>
                  <Flex align="baseline" gap={2}>
                    <Heading size={{base: '2xl', sm: '3xl', md: '4xl'}} fontWeight="black" letterSpacing="tighter">
                      <AnimatedNumber value={overviewStats.totalCo2} decimals={1} />
                    </Heading>
                    <Text fontSize={{base: 'lg', md: '2xl'}} fontWeight="bold" color="#9AE6B4">
                      kg
                    </Text>
                  </Flex>
                </Box>

                <Grid templateColumns={{base: '1fr', sm: '1fr 1fr'}} gap={4} position="relative" zIndex={1}>
                  <Flex direction="column" bg="rgba(255, 255, 255, 0.1)" p={4} borderRadius="2xl" backdropFilter="blur(10px)" border="1px solid rgba(255, 255, 255, 0.15)">
                    <Flex align="center" gap={3} mb={2}>
                      <Flex w="28px" h="28px" bg="rgba(255, 255, 255, 0.2)" borderRadius="full" align="center" justify="center" fontSize="xs">
                        👥
                      </Flex>
                      <Text fontSize="xs" fontWeight="bold" color="#C6F6D5" textTransform="uppercase" letterSpacing="wider">
                        Active Users
                      </Text>
                    </Flex>
                    <Heading size="md" fontWeight="black">
                      <AnimatedNumber value={overviewStats.totalUsers} decimals={0} />
                    </Heading>
                  </Flex>

                  <Flex direction="column" bg="rgba(255, 255, 255, 0.1)" p={4} borderRadius="2xl" backdropFilter="blur(10px)" border="1px solid rgba(255, 255, 255, 0.15)">
                    <Flex align="center" gap={3} mb={2}>
                      <Flex w="28px" h="28px" bg="rgba(255, 255, 255, 0.2)" borderRadius="full" align="center" justify="center" fontSize="xs">
                        🎯
                      </Flex>
                      <Text fontSize="xs" fontWeight="bold" color="#C6F6D5" textTransform="uppercase" letterSpacing="wider">
                        Avg. Target
                      </Text>
                    </Flex>
                    <Heading size="md" fontWeight="black">
                      <AnimatedNumber value={overviewStats.avgTarget} decimals={0} />{' '}
                      <Text as="span" fontSize="xs" color="#9AE6B4">
                        kg
                      </Text>
                    </Heading>
                  </Flex>
                </Grid>
              </Flex>

              {/* Time Travel Calendar */}
              <Box bg="#1A202C" borderRadius="3xl" p={{base: 5, md: 8}} boxShadow="xl">
                <Flex justify="space-between" align="center" mb={6}>
                  <Heading size="sm" color="white">
                    Time Travel
                  </Heading>
                  <Flex gap={2} align="center">
                    <Button size="xs" variant="ghost" color="#A0AEC0" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                      {'<'}
                    </Button>
                    <Text color="#E2E8F0" fontSize="xs" fontWeight="bold" minW="70px" textAlign="center">
                      {calendarMonth.toLocaleString('default', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                    <Button size="xs" variant="ghost" color="#A0AEC0" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                      {'>'}
                    </Button>
                  </Flex>
                </Flex>

                <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <Text key={i} color="#4A5568" fontSize="2xs" fontWeight="bold" textAlign="center">
                      {day}
                    </Text>
                  ))}
                </Grid>

                <Grid templateColumns="repeat(7, 1fr)" gap={1}>
                  {getCalendarDays().map((date, i) => {
                    if (!date) return <Box key={`empty-${i}`} />
                    const isSelected = date.toDateString() === selectedDate.toDateString()
                    const isToday = date.toDateString() === new Date().toDateString()

                    return (
                      <Flex
                        key={i}
                        w={{base: '28px', sm: '32px'}}
                        h={{base: '28px', sm: '32px'}}
                        mx="auto"
                        align="center"
                        justify="center"
                        borderRadius="full"
                        cursor="pointer"
                        bg={isSelected ? '#38A169' : isToday ? '#2D3748' : 'transparent'}
                        color={isSelected ? 'white' : isToday ? 'white' : '#A0AEC0'}
                        fontWeight={isSelected || isToday ? 'black' : 'medium'}
                        fontSize="xs"
                        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                        _hover={{
                          bg: isSelected ? '#2F855A' : '#2D3748',
                          color: 'white'
                        }}
                        onClick={() => setSelectedDate(date)}
                      >
                        {date.getDate()}
                      </Flex>
                    )
                  })}
                </Grid>
              </Box>
            </Grid>

            {/* Line and Area Charts Grid */}
            <Grid templateColumns={{base: '1fr', lg: '1fr 1fr'}} gap={{base: 6, md: 8}} mb={8} animation={`${slideUp} 0.6s ease-out 0.2s both`}>
              <Box p={{base: 4, md: 6}} bg="white" borderRadius="3xl" border="1px solid #E2E8F0" h={{base: '280px', md: '320px'}} boxShadow="0 4px 20px -5px rgba(0,0,0,0.03)">
                <Heading size="sm" color="#1A202C" mb={4}>
                  Platform Growth (6M)
                </Heading>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={overviewStats.monthlyUsers} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#718096', fontSize: 11}} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#718096', fontSize: 11}} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                    <Line isAnimationActive={true} type="monotone" dataKey="users" name="Active Users" stroke="#3182CE" strokeWidth={3} dot={{r: 4, fill: '#3182CE'}} animationDuration={1200} animationEasing="ease-out" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>

              <Box p={{base: 4, md: 6}} bg="white" borderRadius="3xl" border="1px solid #E2E8F0" h={{base: '280px', md: '320px'}} boxShadow="0 4px 20px -5px rgba(0,0,0,0.03)">
                <Heading size="sm" color="#1A202C" mb={4}>
                  Emissions Volume (kg)
                </Heading>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={overviewStats.monthlyEmissions} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                    <defs>
                      <linearGradient id="colorAdminCO2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E53E3E" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#E53E3E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#718096', fontSize: 11}} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#718096', fontSize: 11}} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                    <Area isAnimationActive={true} type="monotone" dataKey="co2" name="CO₂ Emitted" stroke="#E53E3E" strokeWidth={2} fillOpacity={1} fill="url(#colorAdminCO2)" animationDuration={1200} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Grid>

            {/* AI Briefing and Pie Breakdown */}
            <Grid templateColumns={{base: '1fr', xl: '1fr 1.5fr'}} gap={{base: 6, md: 8}} mb={8} animation={`${slideUp} 0.6s ease-out 0.3s both`}>
              <Box p={{base: 5, md: 8}} bg="white" borderRadius="3xl" border="1px solid #E2E8F0" boxShadow="0 4px 20px -5px rgba(0,0,0,0.03)">
                <Heading size="sm" color="#1A202C" mb={4}>
                  Sector Breakdown
                </Heading>
                {overviewStats.categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie isAnimationActive={true} data={overviewStats.categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} dataKey="value" animationDuration={1000} animationEasing="ease-out">
                        {overviewStats.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Center h="180px">
                    <Text color="#A0AEC0" fontSize="sm">
                      No sector data.
                    </Text>
                  </Center>
                )}
              </Box>

              <Flex direction="column" bg="white" borderRadius="3xl" p={{base: 5, md: 8}} border="1px solid #E2E8F0" boxShadow="0 4px 20px -5px rgba(0,0,0,0.03)" position="relative" overflow="hidden">
                <Flex justify="space-between" align={{base: 'flex-start', sm: 'center'}} direction={{base: 'column', sm: 'row'}} gap={4} mb={6} position="relative" zIndex={1}>
                  <Flex align="center" gap={3}>
                    <Flex w="40px" h="40px" bg="linear-gradient(135deg, #38A169, #3182CE)" borderRadius="xl" align="center" justify="center" color="white" fontSize="lg" boxShadow="md">
                      ✨
                    </Flex>
                    <Box>
                      <Heading size="sm" color="#1A202C" letterSpacing="tight">
                        AI Executive Briefing
                      </Heading>
                      <Text color="#718096" fontSize="2xs" mt={0.5} fontWeight="bold" textTransform="uppercase" letterSpacing="widest">
                        CarbonSense Intelligence
                      </Text>
                    </Box>
                  </Flex>

                  <Flex gap={1} bg="#F7FAFC" p={1} borderRadius="full" border="1px solid #E2E8F0">
                    {['daily', 'weekly', 'monthly'].map(period => (
                      <Button
                        key={period}
                        size="xs"
                        borderRadius="full"
                        px={3}
                        bg={activeInsightTab === period ? 'white' : 'transparent'}
                        color={activeInsightTab === period ? '#1A202C' : '#A0AEC0'}
                        boxShadow={activeInsightTab === period ? 'sm' : 'none'}
                        onClick={() => setActiveInsightTab(period)}
                        textTransform="capitalize"
                        fontWeight="bold"
                      >
                        {period}
                      </Button>
                    ))}
                  </Flex>
                </Flex>

                <Box flex="1" position="relative" zIndex={1} overflowY="auto" maxH="220px" pr={2}>
                  <Text color="#2D3748" fontSize="xs" lineHeight="2" fontWeight="medium" whiteSpace="pre-wrap">
                    {prescriptions[activeInsightTab]}
                  </Text>
                </Box>
              </Flex>
            </Grid>

            {/* Demographics Card */}
            <Box bg="white" borderRadius="3xl" p={{base: 5, md: 8}} boxShadow="0 4px 20px -5px rgba(0,0,0,0.03)" animation={`${slideUp} 0.6s ease-out 0.4s both`}>
              <Heading size="sm" color="#1A202C" mb={6}>
                Demographics Breakdown
              </Heading>
              <Grid templateColumns={{base: '1fr', md: 'repeat(3, 1fr)'}} gap={6}>
                <Box>
                  <Text color="#A0AEC0" fontSize="2xs" textTransform="uppercase" letterSpacing="widest" mb={3}>
                    Diet Types
                  </Text>
                  <VStack align="stretch" spacing={3}>
                    {Object.keys(overviewStats.diets).length > 0 ? (
                      getTop5(overviewStats.diets).map(([d, c]) => renderDemographicBar(d, c, overviewStats.totalUsers))
                    ) : (
                      <Text color="#718096" fontSize="xs">
                        No data.
                      </Text>
                    )}
                  </VStack>
                </Box>
                <Box>
                  <Text color="#A0AEC0" fontSize="2xs" textTransform="uppercase" letterSpacing="widest" mb={3}>
                    Primary Commute
                  </Text>
                  <VStack align="stretch" spacing={3}>
                    {Object.keys(overviewStats.commutes).length > 0 ? (
                      getTop5(overviewStats.commutes).map(([c, count]) => renderDemographicBar(c, count, overviewStats.totalUsers))
                    ) : (
                      <Text color="#718096" fontSize="xs">
                        No data.
                      </Text>
                    )}
                  </VStack>
                </Box>
                <Box>
                  <Text color="#A0AEC0" fontSize="2xs" textTransform="uppercase" letterSpacing="widest" mb={3}>
                    Top Locations
                  </Text>
                  <VStack align="stretch" spacing={3}>
                    {Object.keys(overviewStats.locations).length > 0 ? (
                      getTop5(overviewStats.locations).map(([l, c]) => renderDemographicBar(l, c, overviewStats.totalUsers))
                    ) : (
                      <Text color="#718096" fontSize="xs">
                        No data.
                      </Text>
                    )}
                  </VStack>
                </Box>
              </Grid>
            </Box>
          </Box>
        )}

        {/* FACTORS TAB */}
        {activeTab === 'factors' && (
          <Box animation={`${slideUp} 0.5s ease-out both`}>
            <Flex justify="space-between" align="center" mb={6}>
              <Box>
                <Heading size="md" color="#1A202C" mb={1}>
                  Emission Factors
                </Heading>
                <Text color="#718096" fontSize="xs">
                  Manage math multipliers for footprint calculations.
                </Text>
              </Box>
              <Button bg="#1C4532" size="sm" color="white" borderRadius="full" transition="all 0.2s" onClick={() => setIsAddFactorOpen(true)}>
                + Add Factor
              </Button>
            </Flex>

            <Box bg="white" borderRadius="3xl" border="1px solid #E2E8F0" overflow="hidden" boxShadow="0 4px 20px -5px rgba(0,0,0,0.03)" overflowX="auto">
              {isLoading ? (
                <Center p={10}>
                  <Spinner color="#38A169" />
                </Center>
              ) : (
                <Box minW="700px">
                  <Grid templateColumns="1.5fr 3fr 1.5fr 1fr 1fr" gap={4} p={5} bg="#F8FAFC" borderBottom="1px solid #E2E8F0" alignItems="center">
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase">
                      Category
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase">
                      Activity
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase" textAlign="right">
                      CO₂/Unit
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase">
                      Unit
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase" textAlign="right">
                      Actions
                    </Text>
                  </Grid>

                  {factors.map((factor, index) => (
                    <Grid key={factor.factor_id} templateColumns="1.5fr 3fr 1.5fr 1fr 1fr" gap={4} p={5} borderBottom="1px solid #E2E8F0" alignItems="center">
                      <Box>
                        <Badge colorScheme={factor.category === 'Transport' ? 'blue' : factor.category === 'Diet' ? 'green' : 'purple'} px={3} py={1} borderRadius="full">
                          {factor.category}
                        </Badge>
                      </Box>
                      <Text fontWeight="bold" color="#2D3748" fontSize="sm">
                        {factor.activity_name}
                      </Text>
                      <Text fontWeight="black" color="#E53E3E" textAlign="right">
                        {parseFloat(factor.co2_per_unit).toFixed(4)}
                      </Text>
                      <Text color="#718096" fontSize="sm">
                        kg / {factor.unit}
                      </Text>

                      <Flex justify="flex-end" gap={2}>
                        <Button
                          size="xs"
                          borderRadius="full"
                          bg="white"
                          color="#4A5568"
                          border="1px solid #E2E8F0"
                          onClick={() => {
                            setSelectedFactor(factor)
                            setNewCo2Value(factor.co2_per_unit)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          borderRadius="full"
                          bg="white"
                          color="#C53030"
                          border="1px solid #FEB2B2"
                          onClick={() =>
                            setDeleteTarget({
                              type: 'factor',
                              id: factor.factor_id,
                              name: factor.activity_name
                            })
                          }
                        >
                          Delete
                        </Button>
                      </Flex>
                    </Grid>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <Box animation={`${slideUp} 0.5s ease-out both`}>
            <Flex justify="space-between" align="center" mb={6}>
              <Box>
                <Heading size="md" color="#1A202C" mb={1}>
                  Task Dictionary
                </Heading>
                <Text color="#718096" fontSize="xs">
                  Manage the gamification challenges.
                </Text>
              </Box>
              <Button bg="#1C4532" size="sm" color="white" borderRadius="full" onClick={() => setIsAddTaskOpen(true)}>
                + Add Task
              </Button>
            </Flex>

            <Box bg="white" borderRadius="3xl" border="1px solid #E2E8F0" overflow="hidden" boxShadow="0 4px 20px -5px rgba(0,0,0,0.03)" overflowX="auto">
              {isLoading ? (
                <Center p={10}>
                  <Spinner color="#38A169" />
                </Center>
              ) : (
                <Box minW="700px">
                  <Grid templateColumns="1fr 1fr 3fr 1fr 1fr" gap={4} p={5} bg="#F8FAFC" borderBottom="1px solid #E2E8F0" alignItems="center">
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase">
                      Tier
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase">
                      Tag
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase">
                      Description
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase" textAlign="right">
                      CO₂ Saved
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase" textAlign="right">
                      Actions
                    </Text>
                  </Grid>

                  {tasks.map((task, index) => (
                    <Grid key={task.task_id} templateColumns="1fr 1fr 3fr 1fr 1fr" gap={4} p={5} borderBottom="1px solid #E2E8F0" alignItems="center">
                      <Box>
                        <Badge colorScheme={task.tier === 'Gold' ? 'yellow' : task.tier === 'Silver' ? 'gray' : 'orange'} px={3} py={1} borderRadius="full">
                          {task.tier}
                        </Badge>
                      </Box>
                      <Text fontSize="xs" color="#4A5568" fontWeight="bold">
                        {task.target_lifestyle_tag}
                      </Text>
                      <Text fontWeight="bold" color="#2D3748" fontSize="xs">
                        {task.description}
                      </Text>
                      <Text fontWeight="black" color="#38A169" textAlign="right" fontSize="xs">
                        -{parseFloat(task.co2_saved_estimate).toFixed(1)} kg
                      </Text>

                      <Flex justify="flex-end" gap={2}>
                        <Button
                          size="xs"
                          borderRadius="full"
                          bg="white"
                          color="#4A5568"
                          border="1px solid #E2E8F0"
                          onClick={() => {
                            setSelectedTask(task)
                            setNewTaskDesc(task.description)
                            setNewTaskCo2(task.co2_saved_estimate)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          borderRadius="full"
                          bg="white"
                          color="#C53030"
                          border="1px solid #FEB2B2"
                          onClick={() =>
                            setDeleteTarget({
                              type: 'task',
                              id: task.task_id,
                              name: 'this task'
                            })
                          }
                        >
                          Delete
                        </Button>
                      </Flex>
                    </Grid>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <Box animation={`${slideUp} 0.5s ease-out both`}>
            <Flex justify="space-between" align="center" mb={6}>
              <Box>
                <Heading size="md" color="#1A202C" mb={1}>
                  User Management
                </Heading>
                <Text color="#718096" fontSize="xs">
                  Monitor community members and system roles.
                </Text>
              </Box>
            </Flex>

            {/* SEARCH BAR & CATEGORY SUB-TABS */}
            <Flex direction={{base: 'column', md: 'row'}} gap={4} mb={6} justify="space-between" align={{base: 'stretch', md: 'center'}}>
              <Box flex="1" bg="white" p={1.5} borderRadius="2xl" border="1px solid #E2E8F0" boxShadow="sm">
                <Input placeholder="Search user or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} bg="#F8FAFC" border="none" py={4} fontSize="xs" />
              </Box>

              <Flex gap={1} bg="white" p={1.5} borderRadius="2xl" border="1px solid #E2E8F0" boxShadow="sm" overflowX="auto">
                {[
                  {id: 'all', label: 'All Users', count: users.length},
                  {id: 'active', label: 'Active', count: users.filter(u => u.status === 'Active' || u.status === 'Inactive').length},
                  {id: 'banned', label: '🚫 Banned', count: users.filter(u => u.is_banned).length},
                  {id: 'archived', label: '📦 Archived', count: users.filter(u => u.is_archived).length}
                ].map(filter => (
                  <Button
                    key={filter.id}
                    size="xs"
                    borderRadius="xl"
                    px={3}
                    py={3}
                    fontSize="2xs"
                    fontWeight="bold"
                    bg={userFilter === filter.id ? '#1C4532' : 'transparent'}
                    color={userFilter === filter.id ? 'white' : '#718096'}
                    onClick={() => setUserFilter(filter.id)}
                  >
                    {filter.label} ({filter.count})
                  </Button>
                ))}
              </Flex>
            </Flex>

            {/* USERS TABLE */}
            <Box bg="white" borderRadius="3xl" border="1px solid #E2E8F0" overflow="hidden" boxShadow="0 4px 20px -5px rgba(0,0,0,0.03)" overflowX="auto">
              {isLoading ? (
                <Center p={10}>
                  <Spinner color="#38A169" />
                </Center>
              ) : (
                <Box minW="750px">
                  <Grid templateColumns="2fr 0.8fr 1fr 1fr 1.5fr 1fr 1fr" gap={4} p={5} bg="#F8FAFC" borderBottom="1px solid #E2E8F0" alignItems="center">
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase">
                      Identity
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase">
                      Role
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase">
                      Status
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase">
                      Total Logs
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase">
                      Last Active
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase" textAlign="right">
                      Target Limit
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase" textAlign="right">
                      Actions
                    </Text>
                  </Grid>

                  {users
                    .filter(user => {
                      const anonymizedId = `User #${user.profile_id.substring(0, 6).toUpperCase()}`
                      const realName = user.display_name || ''
                      const accountEmail = user.email || ''
                      const cleanQuery = searchQuery.toLowerCase()
                      const matchesSearch = anonymizedId.toLowerCase().includes(cleanQuery) || realName.toLowerCase().includes(cleanQuery) || accountEmail.toLowerCase().includes(cleanQuery)

                      let matchesTab = true
                      if (userFilter === 'banned') matchesTab = user.is_banned
                      else if (userFilter === 'archived') matchesTab = user.is_archived
                      else if (userFilter === 'active') matchesTab = !user.is_banned && !user.is_archived

                      return matchesSearch && matchesTab
                    })
                    .map(user => {
                      const isStaff = user.role === 'admin'
                      const displayName = isStaff ? user.display_name || 'Administrator' : `User #${user.profile_id.substring(0, 6).toUpperCase()}`

                      return (
                        <Grid key={user.profile_id} templateColumns="2fr 0.8fr 1fr 1fr 1.5fr 1fr 1fr" gap={4} p={5} borderBottom="1px solid #E2E8F0" alignItems="center">
                          <Flex align="center" gap={3}>
                            <Flex
                              w="32px"
                              h="32px"
                              borderRadius="full"
                              bg={isStaff ? '#1C4532' : '#EDF2F7'}
                              color={isStaff ? 'white' : '#A0AEC0'}
                              align="center"
                              justify="center"
                              fontWeight="black"
                              fontSize={isStaff ? 'xs' : 'md'}
                              overflow="hidden"
                              flexShrink={0}
                              backgroundImage={user.avatar_url ? `url(${user.avatar_url})` : 'none'}
                              backgroundSize="cover"
                              backgroundPosition="center"
                            >
                              {!user.avatar_url && (isStaff ? displayName.charAt(0).toUpperCase() : '👤')}
                            </Flex>
                            <Box>
                              <Text fontWeight="bold" color="#2D3748" fontSize="xs">
                                {displayName}
                              </Text>
                              {!isStaff && (
                                <Text fontSize="2xs" color="#A0AEC0" textTransform="uppercase" letterSpacing="wider">
                                  Anonymized
                                </Text>
                              )}
                            </Box>
                          </Flex>

                          <Box>
                            <Badge colorScheme={isStaff ? 'red' : 'green'} px={2} py={0.5} borderRadius="full" fontSize="2xs">
                              {user.role}
                            </Badge>
                          </Box>

                          <Box>
                            <Badge
                              variant="solid"
                              colorScheme={user.status === 'System' ? 'purple' : user.status === 'Banned' ? 'red' : user.status === 'Archived' ? 'orange' : user.status === 'Active' ? 'teal' : 'gray'}
                              px={2}
                              py={0.5}
                              borderRadius="full"
                              fontSize="2xs"
                            >
                              {user.status}
                            </Badge>
                          </Box>

                          <Box pl={2}>
                            {isStaff ? (
                              <Text color="#A0AEC0" fontSize="xs" fontStyle="italic">
                                —
                              </Text>
                            ) : (
                              <Text fontSize="xs" fontWeight="bold" color={user.total_logs > 0 ? '#2B6CB0' : '#718096'}>
                                {user.total_logs} {user.total_logs === 1 ? 'log' : 'logs'}
                              </Text>
                            )}
                          </Box>

                          <Box>
                            {isStaff ? (
                              <Text color="#A0AEC0" fontSize="xs" fontStyle="italic">
                                System Default
                              </Text>
                            ) : (
                              <Flex align="center" gap={2}>
                                <Box w="6px" h="6px" borderRadius="full" bg={user.last_active === 'No Activity' ? '#CBD5E0' : '#38A169'} />
                                <Text color="#718096" fontSize="xs" fontWeight={user.last_active !== 'No Activity' ? 'bold' : 'normal'}>
                                  {user.last_active}
                                </Text>
                              </Flex>
                            )}
                          </Box>

                          <Box textAlign="right">
                            {isStaff ? (
                              <Text color="#A0AEC0" fontSize="xs" fontStyle="italic">
                                N/A
                              </Text>
                            ) : (
                              <Text fontWeight="black" color="#1A202C" fontSize="xs">
                                {user.monthly_co2_target} kg
                              </Text>
                            )}
                          </Box>

                          <Flex justify="flex-end">
                            {isStaff ? (
                              <Text color="#A0AEC0" fontSize="2xs" fontStyle="italic" pr={2}>
                                Locked
                              </Text>
                            ) : (
                              <Menu.Root lazyMount>
                                <Menu.Trigger asChild>
                                  <Button size="xs" variant="outline" borderRadius="full" borderColor="#E2E8F0" fontSize="2xs" fontWeight="bold" color="#4A5568">
                                    Actions ▼
                                  </Button>
                                </Menu.Trigger>
                                <Menu.Content borderColor="#E2E8F0" boxShadow="md" borderRadius="xl" zIndex={10} bg="white" p={1}>
                                  <Menu.Item value="password-reset" fontSize="xs" color="#2B6CB0" cursor="pointer" p={2} borderRadius="md" onClick={() => handlePasswordReset(user.email)}>
                                    🔑 Password Reset
                                  </Menu.Item>

                                  <Menu.Item
                                    value="toggle-archive"
                                    fontSize="xs"
                                    color={user.is_archived ? '#38A169' : '#DD6B20'}
                                    cursor="pointer"
                                    p={2}
                                    borderRadius="md"
                                    onClick={() => handleToggleArchive(user.profile_id, user.is_archived, displayName)}
                                  >
                                    {user.is_archived ? '🔄 Restore Account' : '📦 Archive Account'}
                                  </Menu.Item>

                                  <Menu.Item
                                    value="toggle-ban"
                                    fontSize="xs"
                                    color={user.is_banned ? '#38A169' : '#E53E3E'}
                                    cursor="pointer"
                                    p={2}
                                    borderRadius="md"
                                    onClick={() => handleToggleBan(user.profile_id, user.is_banned, displayName)}
                                  >
                                    {user.is_banned ? '🔓 Unban User' : '🚫 Ban User'}
                                  </Menu.Item>
                                </Menu.Content>
                              </Menu.Root>
                            )}
                          </Flex>
                        </Grid>
                      )
                    })}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Flex>

      {/* MODALS SECTION */}
      {selectedFactor && (
        <Flex position="fixed" top={0} left={0} w="100vw" h="100vh" bg="rgba(15, 23, 42, 0.4)" zIndex={9999} justify="flex-end" onClick={() => setSelectedFactor(null)}>
          <Flex direction="column" bg="white" w={{base: '100%', md: '450px'}} h="100vh" boxShadow="-10px 0 40px rgba(0,0,0,0.1)" onClick={e => e.stopPropagation()}>
            <Flex justify="space-between" align="center" p={{base: 5, md: 8}} borderBottom="1px solid #E2E8F0">
              <Box>
                <Text fontSize="xs" color="#38A169" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" mb={1}>
                  System Multiplier
                </Text>
                <Heading size="md" color="#1A202C">
                  Edit Emission Factor
                </Heading>
              </Box>
              <Button size="sm" variant="ghost" borderRadius="full" color="#A0AEC0" onClick={() => setSelectedFactor(null)}>
                ✕
              </Button>
            </Flex>

            <Box flex="1" overflowY="auto" p={{base: 5, md: 8}}>
              <Text fontSize="sm" color="#4A5568" mb={8} lineHeight="tall">
                Adjusting calculation weights for:{' '}
                <Text as="span" fontWeight="black" color="#1A202C">
                  {selectedFactor.activity_name}
                </Text>
              </Text>

              <Box mb={6}>
                <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="#A0AEC0" mb={2}>
                  New Value (kg CO₂ per {selectedFactor.unit})
                </Text>
                <Input
                  variant="flushed"
                  type="number"
                  step="0.01"
                  value={newCo2Value}
                  onChange={e => setNewCo2Value(e.target.value)}
                  size="lg"
                  fontSize="2xl"
                  fontWeight="black"
                  color="#1A202C"
                  focusBorderColor="#38A169"
                  placeholder="0.00"
                />
              </Box>
            </Box>

            <Flex p={6} borderTop="1px solid #E2E8F0" bg="#F8FAFC" gap={4}>
              <Button flex="1" onClick={() => setSelectedFactor(null)} variant="outline" borderRadius="xl" color="#718096" borderColor="#E2E8F0">
                Cancel
              </Button>
              <Button flex="2" bg="#1C4532" color="white" borderRadius="xl" onClick={handleUpdateFactor} isLoading={isSavingFactor}>
                Save Changes
              </Button>
            </Flex>
          </Flex>
        </Flex>
      )}

      {selectedTask && (
        <Flex position="fixed" top={0} left={0} w="100vw" h="100vh" bg="rgba(15, 23, 42, 0.4)" zIndex={9999} justify="flex-end" onClick={() => setSelectedTask(null)}>
          <Flex direction="column" bg="white" w={{base: '100%', md: '450px'}} h="100vh" boxShadow="-10px 0 40px rgba(0,0,0,0.1)" onClick={e => e.stopPropagation()}>
            <Flex justify="space-between" align="center" p={{base: 5, md: 8}} borderBottom="1px solid #E2E8F0">
              <Box>
                <Text fontSize="xs" color="#3182CE" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" mb={1}>
                  Gamified Dictionary
                </Text>
                <Heading size="md" color="#1A202C">
                  Modify Task
                </Heading>
              </Box>
              <Button size="sm" variant="ghost" borderRadius="full" color="#A0AEC0" onClick={() => setSelectedTask(null)}>
                ✕
              </Button>
            </Flex>

            <Box flex="1" overflowY="auto" p={{base: 5, md: 8}}>
              <VStack spacing={8} align="stretch">
                <Box>
                  <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="#A0AEC0" mb={4}>
                    Task Objective Description
                  </Text>
                  <Textarea variant="flushed" value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} color="#1A202C" rows={3} resize="none" fontSize="md" fontWeight="medium" focusBorderColor="#3182CE" />
                </Box>
                <Box>
                  <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="#A0AEC0" mb={2}>
                    CO₂ Saved Estimate (kg)
                  </Text>
                  <Input variant="flushed" type="number" step="0.1" value={newTaskCo2} onChange={e => setNewTaskCo2(e.target.value)} size="lg" fontSize="2xl" fontWeight="black" color="#1A202C" focusBorderColor="#3182CE" />
                </Box>
              </VStack>
            </Box>

            <Flex p={6} borderTop="1px solid #E2E8F0" bg="#F8FAFC" gap={4}>
              <Button flex="1" onClick={() => setSelectedTask(null)} variant="outline" borderRadius="xl" color="#718096" borderColor="#E2E8F0">
                Cancel
              </Button>
              <Button flex="2" bg="#1C4532" color="white" borderRadius="xl" onClick={handleUpdateTask} isLoading={isSavingTask}>
                Save Changes
              </Button>
            </Flex>
          </Flex>
        </Flex>
      )}

      {isAddFactorOpen && (
        <Flex position="fixed" top={0} left={0} w="100vw" h="100vh" bg="rgba(15, 23, 42, 0.4)" zIndex={9999} justify="flex-end" onClick={() => setIsAddFactorOpen(false)}>
          <Flex direction="column" bg="white" w={{base: '100%', md: '450px'}} h="100vh" boxShadow="-10px 0 40px rgba(0,0,0,0.1)" onClick={e => e.stopPropagation()}>
            <Flex justify="space-between" align="center" p={{base: 5, md: 8}} borderBottom="1px solid #E2E8F0">
              <Box>
                <Text fontSize="xs" color="#319795" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" mb={1}>
                  Global Math Model
                </Text>
                <Heading size="md" color="#1A202C">
                  Add New Factor
                </Heading>
              </Box>
              <Button size="sm" variant="ghost" borderRadius="full" color="#A0AEC0" onClick={() => setIsAddFactorOpen(false)}>
                ✕
              </Button>
            </Flex>

            <Box flex="1" overflowY="auto" p={{base: 5, md: 8}}>
              <VStack spacing={8} align="stretch">
                <Box>
                  <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="#A0AEC0" mb={2}>
                    Category Cluster
                  </Text>
                  <select
                    value={addFactorData.category}
                    onChange={e =>
                      setAddFactorData({
                        ...addFactorData,
                        category: e.target.value
                      })
                    }
                    style={{width: '100%', padding: '12px 0', border: 'none', borderBottom: '1px solid #E2E8F0', outline: 'none', color: '#1A202C', fontSize: '18px', fontWeight: 'bold', background: 'transparent'}}
                  >
                    <option value="Transport">Transport</option>
                    <option value="Diet">Diet</option>
                    <option value="Energy">Energy</option>
                    <option value="Lifestyle">Lifestyle</option>
                  </select>
                </Box>
                <Box>
                  <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="#A0AEC0" mb={2}>
                    Activity Identity Title
                  </Text>
                  <Input
                    variant="flushed"
                    placeholder="e.g. Electric Tricycle"
                    value={addFactorData.activity_name}
                    onChange={e => setAddFactorData({...addFactorData, activity_name: e.target.value})}
                    fontSize="lg"
                    fontWeight="medium"
                    color="#1A202C"
                    focusBorderColor="#319795"
                  />
                </Box>
                <Box>
                  <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="#A0AEC0" mb={2}>
                    Telemetry Unit
                  </Text>
                  <Input
                    variant="flushed"
                    placeholder="e.g. km, meal, kWh"
                    value={addFactorData.unit}
                    onChange={e => setAddFactorData({...addFactorData, unit: e.target.value})}
                    fontSize="lg"
                    fontWeight="medium"
                    color="#1A202C"
                    focusBorderColor="#319795"
                  />
                </Box>
                <Box>
                  <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="#A0AEC0" mb={2}>
                    Carbon Multiplier (kg per unit)
                  </Text>
                  <Input
                    variant="flushed"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={addFactorData.co2_per_unit}
                    onChange={e => setAddFactorData({...addFactorData, co2_per_unit: e.target.value})}
                    fontSize="2xl"
                    fontWeight="black"
                    color="#1A202C"
                    focusBorderColor="#319795"
                  />
                </Box>
              </VStack>
            </Box>

            <Flex p={6} borderTop="1px solid #E2E8F0" bg="#F8FAFC" gap={4}>
              <Button flex="1" onClick={() => setIsAddFactorOpen(false)} variant="outline" borderRadius="xl" color="#718096" borderColor="#E2E8F0">
                Cancel
              </Button>
              <Button flex="2" bg="#1C4532" color="white" borderRadius="xl" onClick={handleAddFactor} isLoading={isSavingFactor}>
                Create Factor
              </Button>
            </Flex>
          </Flex>
        </Flex>
      )}

      {isAddTaskOpen && (
        <Flex position="fixed" top={0} left={0} w="100vw" h="100vh" bg="rgba(15, 23, 42, 0.4)" zIndex={9999} justify="flex-end" onClick={() => setIsAddTaskOpen(false)}>
          <Flex direction="column" bg="white" w={{base: '100%', md: '450px'}} h="100vh" boxShadow="-10px 0 40px rgba(0,0,0,0.1)" onClick={e => e.stopPropagation()}>
            <Flex justify="space-between" align="center" p={{base: 5, md: 8}} borderBottom="1px solid #E2E8F0">
              <Box>
                <Text fontSize="xs" color="#D69E2E" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" mb={1}>
                  Gamified Engine
                </Text>
                <Heading size="md" color="#1A202C">
                  Create Global Task
                </Heading>
              </Box>
              <Button size="sm" variant="ghost" borderRadius="full" color="#A0AEC0" onClick={() => setIsAddTaskOpen(false)}>
                ✕
              </Button>
            </Flex>

            <Box flex="1" overflowY="auto" p={{base: 5, md: 8}}>
              <VStack spacing={8} align="stretch">
                <Flex gap={6}>
                  <Box flex="1">
                    <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="#A0AEC0" mb={2}>
                      Reward Tier
                    </Text>
                    <select
                      value={addTaskData.tier}
                      onChange={e => setAddTaskData({...addTaskData, tier: e.target.value})}
                      style={{width: '100%', padding: '12px 0', border: 'none', borderBottom: '1px solid #E2E8F0', outline: 'none', color: '#1A202C', fontSize: '16px', fontWeight: 'bold', background: 'transparent'}}
                    >
                      <option value="Bronze">Bronze</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                    </select>
                  </Box>
                  <Box flex="1">
                    <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="#A0AEC0" mb={2}>
                      Lifestyle Tag
                    </Text>
                    <select
                      value={addTaskData.target_lifestyle_tag}
                      onChange={e => setAddTaskData({...addTaskData, target_lifestyle_tag: e.target.value})}
                      style={{width: '100%', padding: '12px 0', border: 'none', borderBottom: '1px solid #E2E8F0', outline: 'none', color: '#1A202C', fontSize: '16px', fontWeight: 'bold', background: 'transparent'}}
                    >
                      <option value="General">General</option>
                      <option value="Commute">Commute</option>
                      <option value="Diet">Diet</option>
                      <option value="Energy">Energy</option>
                    </select>
                  </Box>
                </Flex>
                <Box>
                  <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="#A0AEC0" mb={4}>
                    Task Description
                  </Text>
                  <Textarea
                    variant="flushed"
                    placeholder="Describe the eco-challenge..."
                    value={addTaskData.description}
                    onChange={e => setAddTaskData({...addTaskData, description: e.target.value})}
                    color="#1A202C"
                    rows={3}
                    resize="none"
                    fontSize="md"
                    fontWeight="medium"
                    focusBorderColor="#D69E2E"
                  />
                </Box>
                <Box>
                  <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="#A0AEC0" mb={2}>
                    Carbon Savings Estimate
                  </Text>
                  <Input
                    variant="flushed"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 2.5 kg"
                    value={addTaskData.co2_saved_estimate}
                    onChange={e => setAddTaskData({...addTaskData, co2_saved_estimate: e.target.value})}
                    fontSize="2xl"
                    fontWeight="black"
                    color="#1A202C"
                    focusBorderColor="#D69E2E"
                  />
                </Box>
              </VStack>
            </Box>

            <Flex p={6} borderTop="1px solid #E2E8F0" bg="#F8FAFC" gap={4}>
              <Button flex="1" onClick={() => setIsAddTaskOpen(false)} variant="outline" borderRadius="xl" color="#718096" borderColor="#E2E8F0">
                Cancel
              </Button>
              <Button flex="2" bg="#1C4532" color="white" borderRadius="xl" onClick={handleAddFactor} isLoading={isSavingTask}>
                Create Task
              </Button>
            </Flex>
          </Flex>
        </Flex>
      )}

      {deleteTarget && (
        <Flex position="fixed" top={0} left={0} w="100vw" h="100vh" bg="rgba(15, 23, 42, 0.6)" backdropFilter="blur(6px)" zIndex={9999} align="center" justify="center" px={4} onClick={() => setDeleteTarget(null)}>
          <Box bg="white" p={{base: 6, md: 10}} borderRadius="3xl" maxW="420px" w="100%" boxShadow="0 25px 50px -12px rgba(229, 62, 62, 0.25)" onClick={e => e.stopPropagation()} position="relative" textAlign="center">
            <Flex w="16" h="16" bg="#FFF5F5" border="4px solid white" outline="1px solid #FED7D7" borderRadius="full" align="center" justify="center" mx="auto" mb={6} boxShadow="lg">
              <Text fontSize="2xl">⚠️</Text>
            </Flex>

            <Heading size="md" color="#1A202C" mb={3} letterSpacing="tight">
              Confirm Deletion
            </Heading>
            <Text color="#718096" fontSize="sm" mb={8} lineHeight="tall">
              You are about to permanently delete{' '}
              <Text as="span" fontWeight="black" color="#E53E3E">
                "{deleteTarget.name}"
              </Text>
              . This action cannot be undone and will permanently remove it from the system.
            </Text>

            <Flex direction="column" gap={3} w="100%">
              <Button size="lg" bg="#E53E3E" color="white" borderRadius="xl" onClick={executeDelete} isLoading={isDeleting}>
                Yes, Delete Permanently
              </Button>
              <Button size="lg" onClick={() => setDeleteTarget(null)} variant="ghost" color="#718096" borderRadius="xl">
                Cancel
              </Button>
            </Flex>
          </Box>
        </Flex>
      )}

      {confirmDialog && (
        <Flex position="fixed" top={0} left={0} w="100vw" h="100vh" bg="rgba(15, 23, 42, 0.6)" backdropFilter="blur(6px)" zIndex={9999} align="center" justify="center" px={4} onClick={() => setConfirmDialog(null)}>
          <Box
            bg="white"
            p={{base: 6, md: 10}}
            borderRadius="3xl"
            maxW="420px"
            w="100%"
            boxShadow={confirmDialog.isDanger ? '0 25px 50px -12px rgba(229, 62, 62, 0.25)' : '0 25px 50px -12px rgba(56, 161, 105, 0.25)'}
            onClick={e => e.stopPropagation()}
            position="relative"
            textAlign="center"
          >
            <Flex
              w="16"
              h="16"
              bg={confirmDialog.isDanger ? '#FFF5F5' : '#F0FFF4'}
              border="4px solid white"
              outline={`1px solid ${confirmDialog.isDanger ? '#FED7D7' : '#C6F6D5'}`}
              borderRadius="full"
              align="center"
              justify="center"
              mx="auto"
              mb={6}
              boxShadow="lg"
            >
              <Text fontSize="2xl">{confirmDialog.isDanger ? '📦' : '🔐'}</Text>
            </Flex>

            <Heading size="md" color="#1A202C" mb={3} letterSpacing="tight">
              {confirmDialog.title}
            </Heading>
            <Text color="#718096" fontSize="sm" mb={8} lineHeight="tall">
              {confirmDialog.message}
            </Text>

            <Flex direction="column" gap={3} w="100%">
              <Button size="lg" bg={confirmDialog.isDanger ? '#E53E3E' : '#1C4532'} color="white" borderRadius="xl" onClick={confirmDialog.onConfirm} isLoading={isProcessingAction}>
                {confirmDialog.confirmText}
              </Button>
              <Button size="lg" onClick={() => setConfirmDialog(null)} variant="ghost" color="#718096" borderRadius="xl">
                Cancel
              </Button>
            </Flex>
          </Box>
        </Flex>
      )}

      {notification && (
        <Flex
          position="fixed"
          bottom={{base: '12px', md: '24px'}}
          right={{base: '12px', md: '24px'}}
          left={{base: '12px', md: 'auto'}}
          bg="white"
          p={4}
          borderRadius="xl"
          boxShadow="0 10px 40px rgba(0,0,0,0.1)"
          borderLeft="4px solid"
          borderLeftColor={notification.status === 'success' ? '#38A169' : notification.status === 'error' ? '#E53E3E' : '#D69E2E'}
          zIndex={10000}
          maxW={{base: '100%', md: '350px'}}
          align="flex-start"
          gap={3}
        >
          <Box mt={1}>
            {notification.status === 'success' && <Text fontSize="lg">✅</Text>}
            {notification.status === 'error' && <Text fontSize="lg">❌</Text>}
            {notification.status === 'warning' && <Text fontSize="lg">⚠️</Text>}
          </Box>
          <Box flex="1">
            <Text fontWeight="bold" color="#1A202C" fontSize="sm" mb={1}>
              {notification.title}
            </Text>
            <Text fontSize="xs" color="#718096" lineHeight="tall">
              {notification.description}
            </Text>
          </Box>
          <Button size="xs" variant="ghost" color="#A0AEC0" onClick={() => setNotification(null)}>
            ✕
          </Button>
        </Flex>
      )}
    </Flex>
  )
}
