import {useState, useEffect, useRef} from 'react'
import {Box, Heading, Text, Flex, Input, Button, Center, Spinner, Icon, IconButton, Badge, DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogCloseTrigger, DialogBackdrop} from '@chakra-ui/react'
import {useNavigate} from 'react-router-dom'
import {supabase} from '../supabase'
import {
  MdPerson,
  MdLocationOn,
  MdTrackChanges,
  MdSync,
  MdRestaurant,
  MdDirectionsTransit,
  MdDirectionsBike,
  MdDirectionsWalk,
  MdTwoWheeler,
  MdDirectionsCar,
  MdLockOutline,
  MdLockReset,
  MdDeleteForever,
  MdWarningAmber,
  MdCameraAlt,
  MdArrowBack,
  MdEdit,
  MdOutlineSecurity,
  MdTimer,
  MdInfoOutline,
  MdMyLocation
} from 'react-icons/md'

export default function Profile() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // Core States
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDetectingGps, setIsDetectingGps] = useState(false)

  // Data States
  const [profileData, setProfileData] = useState({
    displayName: 'Eco Warrior',
    location: 'Location not set',
    monthlyTarget: null,
    avatarUrl: null,
    dietType: 'Analyzing...',
    commuteType: 'Analyzing...',
    targetUpdatedAt: null
  })

  const [formData, setFormData] = useState({
    displayName: '',
    location: '',
    monthlyTarget: ''
  })

  const [profileAlert, setProfileAlert] = useState({show: false, status: 'success', message: ''})

  // Image Upload States
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  // Target Lockout States
  const [isTargetLocked, setIsTargetLocked] = useState(true)
  const [daysRemaining, setDaysRemaining] = useState(0)

  // Modal / Dialog States
  const [isPwdOpen, setIsPwdOpen] = useState(false)
  const [isDelOpen, setIsDelOpen] = useState(false)
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [confirmDeleteText, setConfirmDeleteText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Password Validation
  const hasMinLen = newPassword.length >= 6
  const hasUpper = /[A-Z]/.test(newPassword)
  const noSpecialChars = newPassword.length > 0 && !/[^a-zA-Z0-9]/.test(newPassword)
  const passwordsMatch = newPassword === confirmPassword && newPassword !== ''
  const isPasswordValid = hasMinLen && hasUpper && noSpecialChars && passwordsMatch

  useEffect(() => {
    fetchCompleteProfile()
  }, [])

  useEffect(() => {
    if (profileAlert.show) {
      const timer = setTimeout(() => {
        setProfileAlert(prev => ({...prev, show: false}))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [profileAlert.show])

  const fetchCompleteProfile = async () => {
    try {
      setIsLoading(true)
      const {
        data: {user}
      } = await supabase.auth.getUser()
      if (!user) return

      const {data: userProfile} = await supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle()

      const {data: lifestyleProfile} = await supabase.from('lifestyle_profiles').select('*').eq('user_id', user.id).maybeSingle()

      if (userProfile) {
        if (userProfile.avatar_url && userProfile.avatar_url.trim().length > 0 && !userProfile.ob_profile) {
          await supabase.from('user_profiles').update({ob_profile: true}).eq('user_id', user.id)
        }

        const newProfileData = {
          displayName: userProfile.display_name || 'Eco Warrior',
          location: userProfile.location || 'Location not set',
          monthlyTarget: userProfile.monthly_co2_target,
          avatarUrl: userProfile.avatar_url,
          dietType: lifestyleProfile?.diet_type || 'Analyzing...',
          commuteType: lifestyleProfile?.commute_type || 'Analyzing...',
          targetUpdatedAt: userProfile.target_updated_at
        }

        setProfileData(newProfileData)
        calculateLockout(newProfileData.targetUpdatedAt)
      }
    } catch (error) {
      alert(`Error loading profile: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateLockout = lastUpdateStr => {
    if (!lastUpdateStr) {
      setIsTargetLocked(false)
      return
    }
    const lastUpdate = new Date(lastUpdateStr)
    const now = new Date()
    const msPerDay = 1000 * 60 * 60 * 24
    const daysPassed = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate())) / msPerDay)

    if (daysPassed < 30) {
      setIsTargetLocked(true)
      setDaysRemaining(30 - daysPassed)
    } else {
      setIsTargetLocked(false)
    }
  }

  // --- GPS LOCATION HANDLER ---
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setProfileAlert({show: true, status: 'error', message: 'Geolocation is not supported by your browser.'})
      return
    }

    setIsDetectingGps(true)
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const {latitude, longitude} = position.coords
          // Using OpenStreetMap's free nominatim reverse geocoding API
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`)
          const data = await response.json()

          if (data && data.address) {
            const city = data.address.city || data.address.municipality || data.address.town || data.address.village || ''
            const province = data.address.state || data.address.region || ''
            const formattedLocation = city && province ? `${city}, ${province}` : data.display_name

            setFormData(prev => ({...prev, location: formattedLocation}))
            setProfileAlert({show: true, status: 'success', message: 'Location successfully detected via GPS!'})
          } else {
            throw new Error('Unable to parse location address.')
          }
        } catch (error) {
          setProfileAlert({show: true, status: 'error', message: 'Failed to retrieve readable address from coordinates.'})
        } finally {
          setIsDetectingGps(false)
        }
      },
      error => {
        setIsDetectingGps(false)
        setProfileAlert({show: true, status: 'error', message: 'GPS permission denied or unavailable.'})
      },
      {timeout: 10000, enableHighAccuracy: true}
    )
  }

  // --- EDITING HANDLERS ---
  const handleEditClick = () => {
    setFormData({
      displayName: profileData.displayName === 'Eco Warrior' ? '' : profileData.displayName,
      location: profileData.location === 'Location not set' ? '' : profileData.location,
      monthlyTarget: profileData.monthlyTarget?.toString() || ''
    })

    setAvatarFile(null)
    setAvatarPreview(null)
    calculateLockout(profileData.targetUpdatedAt)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveProfile = async () => {
    if (!formData.displayName.trim()) {
      setProfileAlert({show: true, status: 'error', message: 'Display Name is required.'})
      return
    }

    setIsSaving(true)
    setProfileAlert({show: false, status: 'success', message: ''})
    try {
      const {
        data: {user}
      } = await supabase.auth.getUser()
      let finalAvatarUrl = profileData.avatarUrl

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop() || 'jpg'
        const fileName = `${user.id}_${Date.now()}.${fileExt}`
        const {error: uploadError} = await supabase.storage.from('avatars').upload(fileName, avatarFile, {upsert: true})
        if (uploadError) throw uploadError

        const {
          data: {publicUrl}
        } = supabase.storage.from('avatars').getPublicUrl(fileName)
        finalAvatarUrl = publicUrl
      }

      const newTarget = parseFloat(formData.monthlyTarget.trim()) || 150.0
      const isTargetChanged = newTarget !== profileData.monthlyTarget
      const newTimestamp = isTargetChanged ? new Date().toISOString() : profileData.targetUpdatedAt

      const payload = {
        display_name: formData.displayName.trim(),
        location: formData.location.trim(),
        monthly_co2_target: newTarget,
        avatar_url: finalAvatarUrl,
        target_updated_at: newTimestamp
      }

      const {error} = await supabase.from('user_profiles').update(payload).eq('user_id', user.id)
      if (error) throw error

      setProfileData({
        ...profileData,
        displayName: payload.display_name,
        location: payload.location,
        monthlyTarget: payload.monthly_co2_target,
        avatarUrl: payload.avatar_url,
        targetUpdatedAt: payload.target_updated_at
      })

      setProfileAlert({show: true, status: 'success', message: 'Profile updated successfully!'})
      setIsEditing(false)
    } catch (error) {
      setProfileAlert({show: true, status: 'error', message: `Save failed: ${error.message}`})
    } finally {
      setIsSaving(false)
    }
  }

  // --- SECURITY HANDLERS ---
  const handleUpdatePassword = async e => {
    e.preventDefault()
    if (!isPasswordValid) return
    try {
      setIsUpdatingPassword(true)
      const {
        data: {user}
      } = await supabase.auth.getUser()
      const {error: verifyError} = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      if (verifyError) throw new Error('Incorrect current password.')

      const {error: updateError} = await supabase.auth.updateUser({password: newPassword})
      if (updateError) throw updateError

      alert('Password updated successfully!')
      setIsPwdOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      alert(`Password update failed: ${error.message}`)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'DELETE') return
    try {
      setIsDeleting(true)
      const {
        data: {user}
      } = await supabase.auth.getUser()
      const {error} = await supabase.rpc('delete_user_account', {target_user_id: user.id})
      if (error) throw error

      await supabase.auth.signOut()
      navigate('/welcome')
    } catch (error) {
      alert(`Deletion failed: ${error.message}`)
      setIsDeleting(false)
    }
  }

  const getIconForCommute = commute => {
    if (commute.includes('Transit')) return MdDirectionsTransit
    if (commute.includes('Cycling')) return MdDirectionsBike
    if (commute.includes('Walking')) return MdDirectionsWalk
    if (commute.includes('Motorcycle')) return MdTwoWheeler
    if (commute.includes('Analyzing')) return MdSync
    return MdDirectionsCar
  }

  if (isLoading) {
    return (
      <Center minH="100vh" bg="#F4FAF6">
        <Flex direction="column" align="center" gap={4}>
          <Spinner size="xl" color="#2F855A" thickness="4px" />
          <Text fontWeight="600" color="gray.600">
            Loading CarbonSense profile...
          </Text>
        </Flex>
      </Center>
    )
  }

  const displayImage = isEditing ? avatarPreview || profileData.avatarUrl : profileData.avatarUrl

  return (
    <Box minH="100vh" bg="#F4F9F5" backgroundImage="url('https://www.transparenttextures.com/patterns/cubes.png')" backgroundBlendMode="multiply" pb={20} position="relative" overflow="hidden">
      <Box position="absolute" top="-10%" left="-5%" w="700px" h="700px" bgGradient="radial(#48BB78 0%, transparent 65%)" opacity="0.15" borderRadius="full" pointerEvents="none" zIndex={0} />
      <Box position="absolute" bottom="-10%" right="-5%" w="700px" h="700px" bgGradient="radial(#319795 0%, transparent 65%)" opacity="0.12" borderRadius="full" pointerEvents="none" zIndex={0} />

      <Box borderBottom="1px solid" borderColor="rgba(72, 187, 120, 0.2)" bg="rgba(244, 249, 245, 0.6)" backdropFilter="blur(12px)" position="sticky" top="0" zIndex="10">
        <Flex maxW="1200px" mx="auto" px={{base: 4, md: 8}} py={4} align="center" justify="space-between">
          <Flex align="center" gap={4}>
            <IconButton aria-label="Back" variant="ghost" borderRadius="full" color="#1C4532" _hover={{bg: 'rgba(72, 187, 120, 0.1)'}} onClick={() => (isEditing ? handleCancelEdit() : navigate(-1))}>
              <MdArrowBack size="20px" />
            </IconButton>
            <Box>
              <Heading size="md" color="#1C4532" fontWeight="800">
                {isEditing ? 'Edit Profile' : 'Profile & Sustainability Hub'}
              </Heading>
              <Text fontSize="xs" color="#4A5568">
                CarbonSense Account Management
              </Text>
            </Box>
          </Flex>

          {!isEditing ? (
            <Button
              bg="#22543D"
              color="white"
              _hover={{bg: '#1C4532', transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(34, 84, 61, 0.2)'}}
              transition="all 0.2s"
              boxShadow="0 4px 12px rgba(34, 84, 61, 0.15)"
              borderRadius="xl"
              px={6}
              onClick={handleEditClick}
            >
              <Flex align="center" gap={2}>
                <MdEdit />
                <Text>Edit Profile</Text>
              </Flex>
            </Button>
          ) : (
            <Button variant="ghost" color="#4A5568" _hover={{bg: 'rgba(226, 232, 240, 0.8)', color: '#1C4532'}} borderRadius="xl" onClick={handleCancelEdit}>
              Cancel Editing
            </Button>
          )}
        </Flex>
      </Box>

      {profileAlert.show && (
        <Box maxW="1200px" mx="auto" px={{base: 4, md: 8}} pt={6}>
          <Flex
            align="center"
            gap={3}
            borderRadius="xl"
            p={4}
            bg={profileAlert.status === 'success' ? '#F0FFF4' : '#FFF5F5'}
            color={profileAlert.status === 'success' ? '#276749' : '#C53030'}
            border="1px solid"
            borderColor={profileAlert.status === 'success' ? '#9AE6B4' : '#FEB2B2'}
            boxShadow="0 4px 12px rgba(28, 69, 50, 0.05)"
            animation="fadeIn 0.3s ease-out"
          >
            <Text fontSize="lg">{profileAlert.status === 'success' ? '✅' : '⚠️'}</Text>
            <Text fontSize="sm" fontWeight="bold">
              {profileAlert.message}
            </Text>
          </Flex>
        </Box>
      )}

      <Box maxW="1200px" mx="auto" px={{base: 4, md: 8}} pt={8} position="relative" zIndex={1}>
        <Box bg="rgba(255, 255, 255, 0.9)" backdropFilter="blur(10px)" borderRadius="2xl" p={{base: 6, md: 8}} boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)" border="1px solid" borderColor="rgba(72, 187, 120, 0.2)" mb={8}>
          <Flex direction={{base: 'column', sm: 'row'}} align="center" gap={6}>
            <Box position="relative">
              <Center w="110px" h="110px" borderRadius="full" bg="#F0FFF4" border="3px solid #38A169" overflow="hidden">
                {displayImage ? <img src={`${displayImage}?t=${Date.now()}`} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <Icon as={MdPerson} boxSize="50px" color="#38A169" />}
              </Center>

              {isEditing && (
                <Center
                  position="absolute"
                  bottom="0"
                  right="0"
                  bg="#22543D"
                  p={2}
                  borderRadius="full"
                  border="2px solid white"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{transform: 'scale(1.1)', bg: '#1C4532'}}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <MdCameraAlt color="white" size="16px" />
                </Center>
              )}
              <input type="file" accept="image/*" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileChange} />
            </Box>

            <Flex direction="column" align={{base: 'center', sm: 'flex-start'}} gap={1} flex="1">
              <Flex align="center" gap={3}>
                <Heading size="lg" color="#1C4532">
                  {profileData.displayName}
                </Heading>
                <Badge bg="#E6FFFA" color="#234E52" border="1px solid #9AE6B4" borderRadius="md" px={2} py={0.5}>
                  Verified Member
                </Badge>
              </Flex>
              <Flex align="center" gap={1} color="#4A5568" fontSize="sm" mt={1}>
                <Icon as={MdLocationOn} color="#38A169" />
                <Text>{profileData.location}</Text>
              </Flex>
            </Flex>
          </Flex>
        </Box>

        {!isEditing ? (
          /* ================= VIEW MODE ================= */
          <Flex direction="column" gap={8}>
            <Box p={{base: 6, md: 8}} bg="#1C4532" borderRadius="2xl" border="1px solid rgba(154, 230, 180, 0.3)" boxShadow="0 15px 35px -10px rgba(28, 69, 50, 0.3)" position="relative" overflow="hidden">
              <Box position="absolute" top="-50%" right="-10%" w="300px" h="300px" bgGradient="radial(#48BB78 0%, transparent 70%)" opacity="0.3" filter="blur(35px)" borderRadius="full" pointerEvents="none" />

              <Flex justify="space-between" align="flex-start" wrap="wrap" gap={4} position="relative" zIndex={1}>
                <Box>
                  <Flex align="center" gap={2} mb={2} color="#9AE6B4">
                    <Icon as={MdTrackChanges} boxSize={5} />
                    <Text fontSize="xs" fontWeight="bold" letterSpacing="1px" textTransform="uppercase">
                      System Telemetry
                    </Text>
                  </Flex>
                  <Heading size="2xl" mb={3} color="white" fontWeight="black">
                    {profileData.monthlyTarget ? `${profileData.monthlyTarget} kg CO₂e` : 'Not Set'}
                  </Heading>
                  <Text color="#C6F6D5" maxW="600px" fontSize="sm" lineHeight="tall">
                    Your target dynamically auto-adjusts monthly based on your self-reported logs and emission factor analyses.
                  </Text>
                </Box>
                <Badge bg="rgba(255, 255, 255, 0.15)" color="white" border="1px solid rgba(255, 255, 255, 0.3)" px={3} py={1} borderRadius="lg" fontSize="xs" backdropFilter="blur(4px)">
                  Active Cycle
                </Badge>
              </Flex>
            </Box>

            <Box>
              <Heading size="sm" color="#1C4532" mb={4} textTransform="uppercase" letterSpacing="0.5px">
                Active Lifestyle Metrics
              </Heading>
              <Flex direction={{base: 'column', md: 'row'}} gap={6}>
                <Flex
                  flex="1"
                  p={6}
                  bg="rgba(255, 255, 255, 0.9)"
                  backdropFilter="blur(10px)"
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor="rgba(72, 187, 120, 0.2)"
                  align="center"
                  gap={5}
                  boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
                  transition="transform 0.2s"
                  _hover={{transform: 'translateY(-2px)'}}
                >
                  <Center w={14} h={14} bg="#F0FFF4" border="1px solid #C6F6D5" color="#38A169" borderRadius="xl">
                    <Icon as={profileData.dietType.includes('Analyzing') ? MdSync : MdRestaurant} boxSize={7} />
                  </Center>
                  <Box>
                    <Text fontSize="xs" color="#4A5568" fontWeight="bold" textTransform="uppercase">
                      Dietary Profile
                    </Text>
                    <Text fontSize="lg" fontWeight="900" color="#1C4532">
                      {profileData.dietType}
                    </Text>
                  </Box>
                </Flex>

                <Flex
                  flex="1"
                  p={6}
                  bg="rgba(255, 255, 255, 0.9)"
                  backdropFilter="blur(10px)"
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor="rgba(72, 187, 120, 0.2)"
                  align="center"
                  gap={5}
                  boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)"
                  transition="transform 0.2s"
                  _hover={{transform: 'translateY(-2px)'}}
                >
                  <Center w={14} h={14} bg="#E6FFFA" border="1px solid #B2F5EA" color="#319795" borderRadius="xl">
                    <Icon as={getIconForCommute(profileData.commuteType)} boxSize={7} />
                  </Center>
                  <Box>
                    <Text fontSize="xs" color="#4A5568" fontWeight="bold" textTransform="uppercase">
                      Commute Profile
                    </Text>
                    <Text fontSize="lg" fontWeight="900" color="#1C4532">
                      {profileData.commuteType}
                    </Text>
                  </Box>
                </Flex>
              </Flex>
            </Box>

            <Box bg="rgba(255, 255, 255, 0.9)" backdropFilter="blur(10px)" borderRadius="2xl" p={6} border="1px solid" borderColor="rgba(72, 187, 120, 0.2)" boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)">
              <Flex align="center" gap={2} mb={4}>
                <Icon as={MdOutlineSecurity} color="#38A169" boxSize={5} />
                <Heading size="sm" color="#1C4532">
                  Account Security & Data
                </Heading>
              </Flex>
              <Flex direction={{base: 'column', sm: 'row'}} gap={4}>
                <Button
                  flex="1"
                  variant="outline"
                  justifyContent="flex-start"
                  h="50px"
                  borderRadius="xl"
                  borderColor="rgba(72, 187, 120, 0.4)"
                  color="#1C4532"
                  _hover={{bg: '#F4F9F5', borderColor: '#38A169'}}
                  onClick={() => setIsPwdOpen(true)}
                >
                  <Flex align="center" gap={2}>
                    <MdLockOutline />
                    <Text>Change Password</Text>
                  </Flex>
                </Button>
                <Button flex="1" variant="outline" colorScheme="red" justifyContent="flex-start" h="50px" borderRadius="xl" _hover={{bg: '#FFF5F5'}} onClick={() => setIsDelOpen(true)}>
                  <Flex align="center" gap={2}>
                    <MdDeleteForever />
                    <Text>Delete Account</Text>
                  </Flex>
                </Button>
              </Flex>
            </Box>
          </Flex>
        ) : (
          /* ================= EDIT MODE ================= */
          <Flex direction="column" gap={6} maxW="800px" mx="auto">
            <Box bg="rgba(255, 255, 255, 0.9)" backdropFilter="blur(10px)" p={{base: 6, md: 8}} borderRadius="2xl" border="1px solid" borderColor="rgba(72, 187, 120, 0.2)" boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)">
              <Heading size="sm" color="#1C4532" mb={6}>
                Personal Details
              </Heading>
              <Flex direction="column" gap={6}>
                {/* Display Name Container */}
                <Box w="100%">
                  <Text fontSize="xs" fontWeight="bold" color="#1C4532" textTransform="uppercase" mb={2}>
                    Display Name
                  </Text>
                  <Input
                    value={formData.displayName}
                    onChange={e => {
                      let value = e.target.value
                      value = value.replace(/^\s+/, '')
                      value = value.replace(/\s{2,}/g, ' ')
                      if (/^[A-Za-zÀ-ÿ\s'.-]*$/.test(value)) {
                        setFormData({...formData, displayName: value})
                      }
                    }}
                    placeholder="e.g. Jane Doe"
                    h="50px"
                    bg="#F4F9F5"
                    border="1px solid rgba(72, 187, 120, 0.2)"
                    _focus={{bg: 'white', borderColor: '#38A169', boxShadow: '0 0 0 1px #38A169'}}
                    _hover={{bg: '#E6FFFA'}}
                    borderRadius="xl"
                    transition="all 0.2s"
                  />
                </Box>

                {/* GPS Location Box */}
                <Box w="100%">
                  <Flex align="center" justify="space-between" mb={2}>
                    <Flex align="center" gap={2}>
                      <Icon as={MdLocationOn} color="#38A169" />
                      <Text fontSize="xs" fontWeight="bold" color="#1C4532" textTransform="uppercase">
                        Location (GPS Verified)
                      </Text>
                    </Flex>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="green"
                      borderColor="#38A169"
                      color="#22543D"
                      borderRadius="lg"
                      leftIcon={<MdMyLocation />}
                      loading={isDetectingGps}
                      onClick={handleDetectLocation}
                      _hover={{bg: '#F0FFF4'}}
                    >
                      Detect via GPS
                    </Button>
                  </Flex>
                  <Input
                    value={formData.location}
                    readOnly // 👈 Prevents manual typing/custom entries like Gotham City
                    placeholder="Click 'Detect via GPS' above..."
                    h="50px"
                    bg="#E6FFFA" // Distinct light teal background to indicate it's auto-filled
                    border="1px solid rgba(56, 161, 105, 0.3)"
                    color="#1C4532"
                    fontWeight="bold"
                    borderRadius="xl"
                  />
                  <Text fontSize="xs" color="#4A5568" mt={1}>
                    Location is automatically verified and locked via browser GPS for accurate carbon tracking.
                  </Text>
                </Box>
              </Flex>
            </Box>

            <Box bg="rgba(255, 255, 255, 0.9)" backdropFilter="blur(10px)" p={{base: 6, md: 8}} borderRadius="2xl" border="1px solid" borderColor="rgba(72, 187, 120, 0.2)" boxShadow="0 10px 30px -5px rgba(28, 69, 50, 0.05)">
              <Heading size="sm" color="#1C4532" mb={2}>
                Adaptive Carbon Target
              </Heading>
              <Text fontSize="xs" color="#4A5568" mb={6}>
                Set your monthly threshold in kilograms of CO₂ equivalents.
              </Text>

              <Flex gap={3} align="center">
                <Input
                  type="number"
                  value={formData.monthlyTarget}
                  onChange={e => {
                    if (!isTargetLocked) {
                      setFormData({...formData, monthlyTarget: e.target.value})
                    }
                  }}
                  placeholder="e.g. 150"
                  disabled={isTargetLocked}
                  h="50px"
                  bg={isTargetLocked ? 'rgba(226, 232, 240, 0.3)' : '#F4F9F5'}
                  border="1px solid rgba(72, 187, 120, 0.2)"
                  _focus={{bg: 'white', borderColor: '#38A169', boxShadow: '0 0 0 1px #38A169'}}
                  _hover={!isTargetLocked ? {bg: '#E6FFFA'} : {}}
                  borderRadius="xl"
                  transition="all 0.2s"
                />
                {isTargetLocked && (
                  <IconButton aria-label="Unlock Target" colorScheme="orange" h="50px" w="50px" borderRadius="xl" onClick={() => setIsOverrideOpen(true)}>
                    <MdLockOutline size="20px" />
                  </IconButton>
                )}
              </Flex>

              {isTargetLocked && (
                <Flex p={4} bg="orange.50" color="orange.800" border="1px solid" borderColor="orange.200" borderRadius="xl" mt={4} gap={3} align="flex-start">
                  <Icon as={MdTimer} boxSize={5} color="orange.500" mt={0.5} />
                  <Text fontSize="xs" fontWeight="500">
                    Goal locked for {daysRemaining} more days to preserve tracking consistency. Tap lock icon to force edit.
                  </Text>
                </Flex>
              )}

              <Flex p={4} bg="rgba(56, 161, 105, 0.05)" border="1px solid" borderColor="rgba(56, 161, 105, 0.2)" borderRadius="xl" mt={4} gap={3} align="flex-start">
                <Icon as={MdInfoOutline} boxSize={5} color="#38A169" mt={0.5} />
                <Text fontSize="xs" lineHeight="tall" fontWeight="medium" color="#2D3748">
                  Set a monthly carbon emission goal that you would like to achieve. CarbonSense tracks your total emissions throughout the month and compares them with this goal, helping you monitor your progress and build more sustainable
                  habits over time. You can update this goal whenever your lifestyle or sustainability goals change.
                </Text>
              </Flex>
            </Box>

            <Flex gap={4} justify="flex-end" mt={6}>
              <Button h="50px" px={8} borderRadius="xl" variant="ghost" color="#4A5568" _hover={{bg: 'rgba(226, 232, 240, 0.8)', color: '#1C4532'}} onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                h="50px"
                px={8}
                borderRadius="xl"
                bg="#22543D"
                color="white"
                boxShadow="0 8px 20px rgba(34, 84, 61, 0.15)"
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{bg: '#1C4532', transform: 'translateY(-2px)', boxShadow: '0 12px 25px rgba(34, 84, 61, 0.25)'}}
                loading={isSaving}
                onClick={handleSaveProfile}
              >
                Save Changes
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>

      {/* Password Dialog */}
      <DialogRoot open={isPwdOpen} onOpenChange={e => setIsPwdOpen(e.open)} placement="center">
        <DialogBackdrop bg="rgba(28, 69, 50, 0.4)" backdropFilter="blur(6px)" />
        <DialogContent position="fixed" top="50%" left="50%" transform="translate(-50%, -50%)" w="90%" maxW="450px" bg="white" borderRadius="3xl" p={4} boxShadow="0 25px 50px -12px rgba(28, 69, 50, 0.25)" zIndex={9999}>
          <DialogHeader>
            <Flex align="center" gap={2}>
              <Icon as={MdLockReset} color="#38A169" />
              <Text color="#1C4532" fontWeight="bold">
                Change Password
              </Text>
            </Flex>
          </DialogHeader>
          <DialogCloseTrigger color="#4A5568" _hover={{bg: '#F0FFF4', color: '#1C4532'}} />
          <DialogBody>
            <form onSubmit={handleUpdatePassword}>
              <Flex direction="column" gap={4}>
                <Input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  borderRadius="xl"
                  h="48px"
                  bg="#F4F9F5"
                  border="1px solid rgba(72, 187, 120, 0.2)"
                  _focus={{bg: 'white', borderColor: '#38A169', boxShadow: '0 0 0 1px #38A169'}}
                  required
                />
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  borderRadius="xl"
                  h="48px"
                  bg="#F4F9F5"
                  border="1px solid rgba(72, 187, 120, 0.2)"
                  _focus={{bg: 'white', borderColor: '#38A169', boxShadow: '0 0 0 1px #38A169'}}
                  required
                />
                <Input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  borderRadius="xl"
                  h="48px"
                  bg="#F4F9F5"
                  border="1px solid rgba(72, 187, 120, 0.2)"
                  _focus={{bg: 'white', borderColor: '#38A169', boxShadow: '0 0 0 1px #38A169'}}
                  required
                />
              </Flex>

              <Box p={4} bg="#F0FFF4" border="1px solid #C6F6D5" borderRadius="xl" mt={4} fontSize="xs" color="#276749">
                <Text fontWeight="bold" mb={1} textTransform="uppercase" letterSpacing="wide">
                  Requirements:
                </Text>
                <Text>• At least 6 characters long</Text>
                <Text>• Minimum 1 uppercase letter</Text>
                <Text>• Letters and numbers only</Text>
              </Box>

              <Button
                type="submit"
                w="100%"
                mt={6}
                bg="#22543D"
                color="white"
                transition="all 0.2s"
                _hover={{bg: '#1C4532', transform: 'translateY(-1px)', boxShadow: '0 8px 20px rgba(34, 84, 61, 0.15)'}}
                borderRadius="xl"
                h="48px"
                loading={isUpdatingPassword}
                disabled={!isPasswordValid}
              >
                Update Password
              </Button>
            </form>
          </DialogBody>
        </DialogContent>
      </DialogRoot>

      {/* Delete Account Dialog */}
      <DialogRoot open={isDelOpen} onOpenChange={e => setIsDelOpen(e.open)} placement="center">
        <DialogBackdrop bg="rgba(28, 69, 50, 0.4)" backdropFilter="blur(6px)" />
        <DialogContent position="fixed" top="50%" left="50%" transform="translate(-50%, -50%)" w="90%" maxW="450px" bg="white" borderRadius="3xl" p={4} boxShadow="0 25px 50px -12px rgba(28, 69, 50, 0.25)" zIndex={9999}>
          <DialogHeader color="red.600">
            <Flex align="center" gap={2}>
              <Icon as={MdWarningAmber} boxSize={6} />
              <Text fontWeight="bold">Delete Account</Text>
            </Flex>
          </DialogHeader>
          <DialogCloseTrigger color="#4A5568" _hover={{bg: '#FFF5F5', color: 'red.600'}} />
          <DialogBody>
            <Text fontSize="sm" color="#4A5568" mb={4}>
              This action is{' '}
              <Text as="span" fontWeight="bold" color="red.600">
                permanent
              </Text>{' '}
              and cannot be reversed.
            </Text>
            <Text fontSize="xs" fontWeight="bold" color="#1C4532" textTransform="uppercase" mb={2}>
              Type "DELETE" to confirm:
            </Text>
            <Input
              placeholder="DELETE"
              value={confirmDeleteText}
              onChange={e => setConfirmDeleteText(e.target.value)}
              borderRadius="xl"
              h="48px"
              mb={4}
              bg="#F4F9F5"
              border="1px solid rgba(72, 187, 120, 0.2)"
              _focus={{bg: 'white', borderColor: 'red.400', boxShadow: '0 0 0 1px #F56565'}}
            />
            <Button
              colorScheme="red"
              w="100%"
              borderRadius="xl"
              h="48px"
              loading={isDeleting}
              disabled={confirmDeleteText !== 'DELETE'}
              onClick={handleDeleteAccount}
              _hover={{transform: 'translateY(-1px)', boxShadow: '0 8px 20px rgba(229, 62, 62, 0.2)'}}
            >
              Permanently Delete Account
            </Button>
          </DialogBody>
        </DialogContent>
      </DialogRoot>

      {/* Override Target Dialog */}
      <DialogRoot open={isOverrideOpen} onOpenChange={e => setIsOverrideOpen(e.open)} placement="center">
        <DialogBackdrop bg="rgba(28, 69, 50, 0.4)" backdropFilter="blur(6px)" />
        <DialogContent position="fixed" top="50%" left="50%" transform="translate(-50%, -50%)" w="90%" maxW="450px" bg="white" borderRadius="3xl" p={4} boxShadow="0 25px 50px -12px rgba(28, 69, 50, 0.25)" zIndex={9999}>
          <DialogHeader>
            <Text color="#1C4532" fontWeight="bold">
              Unlock Goal Editing
            </Text>
          </DialogHeader>
          <DialogCloseTrigger color="#4A5568" _hover={{bg: '#F0FFF4', color: '#1C4532'}} />
          <DialogBody fontSize="sm" color="#4A5568" mb={4}>
            Overriding your monthly target manually resets your 30-day target calculation cycle starting today.
          </DialogBody>
          <DialogFooter>
            <Flex gap={3} w="100%" justify="flex-end">
              <Button variant="ghost" color="#4A5568" borderRadius="xl" _hover={{bg: 'rgba(226, 232, 240, 0.8)', color: '#1C4532'}} onClick={() => setIsOverrideOpen(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="orange"
                borderRadius="xl"
                _hover={{transform: 'translateY(-1px)', boxShadow: '0 8px 20px rgba(221, 107, 32, 0.2)'}}
                onClick={() => {
                  setIsTargetLocked(false)
                  setIsOverrideOpen(false)
                }}
              >
                Unlock Goal
              </Button>
            </Flex>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  )
}
