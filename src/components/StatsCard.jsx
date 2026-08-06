// components/StatsCard.jsx
import {Box, Text} from '@chakra-ui/react'

export default function StatsCard({title, value, accentColor = '#38A169'}) {
  return (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="#E2E8F0" // Light gray border
      boxShadow="sm"
      minW="200px"
      borderTop="4px solid"
      borderTopColor={accentColor} // Adds a splash of color to the top edge
      _hover={{boxShadow: 'md', transform: 'translateY(-2px)'}}
      transition="all 0.2s ease"
    >
      <Text fontSize="xs" fontWeight="bold" color="#718096" textTransform="uppercase" letterSpacing="wider">
        {title}
      </Text>
      <Text fontSize="3xl" fontWeight="extrabold" color="#2D3748" mt={1}>
        {value}
      </Text>
    </Box>
  )
}
