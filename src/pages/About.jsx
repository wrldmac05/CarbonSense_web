import {Box, Heading, Text} from '@chakra-ui/react'

export default function About() {
  return (
    <Box p={10} color="black">
      <Heading mb={4}>About Carbonsense</Heading>
      <Text maxW="600px">Carbonsense helps users track track their carbon footprint on their lifestyle!</Text>
    </Box>
  )
}
